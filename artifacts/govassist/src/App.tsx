import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListSchemes, useSendChatMessage, type ChatInput, type ChatMessage, type Scheme } from '@workspace/api-client-react';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, ClipboardList, FileText, Headphones, Mic, MicOff, RotateCcw, Send, ShieldCheck, Volume2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
type Language = 'en' | 'ta' | 'auto';
type ActiveLanguage = 'en' | 'ta';
type Stage = 'discover' | 'eligibility' | 'form' | 'readback' | 'complete';
type TranscriptItem = { role: 'user' | 'assistant'; content: string; id: number };

const copy = {
  en: {
    guide: 'Your benefits guide', tagline: 'A clearer way through', demo: 'DEMO · NOT AN OFFICIAL GOVERNMENT SERVICE',
    greeting: 'Hello. I can help you explore sample government schemes and understand the steps involved. What kind of support are you looking for?',
    voiceReady: 'Voice input is ready. Speak a little at a time.', voiceFallback: 'Voice input is not available in this browser. You can type here instead.',
    header: 'A little help, one step at a time.', subheader: 'Tell me what you need. We’ll look at a relevant scheme, then walk through a sample application together.',
    choose: 'A good place to begin', chooseSub: 'Choose a sample scheme to explore, or tell me what kind of support you need.',
    chatTitle: 'Your conversation', live: 'GUIDED SESSION', compose: 'Type a message…', send: 'Send message', mic: 'Use voice input',
    note: 'Demo only—not an official government service. Chat messages go to Groq; sample form answers stay in this browser. No application is submitted. Do not enter sensitive details in chat.',
    steps: ['Find a scheme', 'Check the details', 'Fill sample form', 'Review & finish'],
    sampleSchemes: 'Sample schemes', sampleTag: 'Explore a starting point', loading: 'Finding sample schemes…',
    loadError: 'We could not load the scheme examples.', retry: 'Try again', eligibility: 'Sample eligibility', documents: 'Documents to keep nearby',
    summary: 'In a few words', review: 'Review this scheme', begin: 'Continue to sample form', field: 'Sample application', fieldHelp: 'We’ll ask for one detail at a time. You can use a made-up answer for this demo.',
    next: 'Save and continue', reviewTitle: 'Let’s read that back', reviewHelp: 'Your sample answers stay in this browser and are read back here. No application is submitted.', confirm: 'Yes, these look right', edit: 'Go back to the form',
    doneTitle: 'You’ve completed the demo', doneHelp: 'Here is the sample information you entered. No application was sent.', startOver: 'Start a new conversation',
    source: 'Reference', noSchemes: 'No sample schemes are available right now.', failed: 'That message could not be sent. Please try again.', tapSpeak: 'Read this reply aloud',
    working: 'Thinking through the next step…', matched: 'A possible match', phase: 'YOUR PROGRESS', openDetails: 'View details', closeDetails: 'Hide details',
    answerPlaceholder: 'Enter a sample answer', continuePrompt: 'I’d like to continue with a sample application.', readbackPrompt: 'Please review these sample answers and confirm them.',
    completedPrompt: 'Yes, these sample details look right.', formFirst: 'Let’s practice one detail at a time. Please enter', formSaved: 'Saved in this demo. Next, please enter', readbackHint: 'Use “Go back to the form” to change an answer, or confirm if these look right.', completeReply: 'This practice walkthrough is finished. No application was submitted.', stepOf: 'of', noTranscript: 'Your messages will appear here as we talk.',
    connection: 'Chat messages go to Groq for replies. Sample form answers stay in this browser.', startWith: 'You can start with a scheme below or type a question.',
    language: 'Choose language', micPermission: 'Please allow microphone access in your browser settings.', noSpeech: 'No speech was detected. Please try again.', voiceError: 'Voice input could not start. Please check your microphone and try again.', speechFallback: 'Speech playback is not available in this browser.',
  },
  ta: {
    guide: 'உங்கள் நலத்திட்ட வழிகாட்டி', tagline: 'தெளிவான அடுத்த படி', demo: 'மாதிரி · அதிகாரப்பூர்வ அரசு சேவை அல்ல',
    greeting: 'வணக்கம். மாதிரி அரசு நலத்திட்டங்களை அறிந்து, அவற்றின் படிகளைப் புரிந்துகொள்ள உதவுகிறேன். உங்களுக்கு என்ன வகையான உதவி தேவை?',
    voiceReady: 'குரல் உள்ளீடு தயாராக உள்ளது. மெதுவாகப் பேசுங்கள்.', voiceFallback: 'இந்த உலாவியில் குரல் உள்ளீடு இல்லை. இங்கே தட்டச்சு செய்யலாம்.',
    header: 'ஒவ்வொரு படியாக, எளிய வழிகாட்டல்.', subheader: 'உங்களுக்கு என்ன தேவை என்று சொல்லுங்கள். பொருத்தமான திட்டத்தைப் பார்த்து, மாதிரி விண்ணப்பத்தை ஒன்றாகப் புரிந்துகொள்வோம்.',
    choose: 'இங்கிருந்து தொடங்கலாம்', chooseSub: 'ஒரு மாதிரி திட்டத்தைத் தேர்ந்தெடுக்கவும் அல்லது உங்களுக்கு என்ன உதவி தேவை என்று சொல்லுங்கள்.',
    chatTitle: 'உங்கள் உரையாடல்', live: 'வழிகாட்டும் உரையாடல்', compose: 'செய்தியைத் தட்டச்சு செய்யுங்கள்…', send: 'செய்தி அனுப்பு', mic: 'குரல் உள்ளீடு',
    note: 'இது மாதிரி விளக்கம்; அதிகாரப்பூர்வ அரசு சேவை அல்ல. உரையாடல் செய்திகள் Groq-க்கு அனுப்பப்படும்; மாதிரி படிவப் பதில்கள் இந்த உலாவியிலேயே இருக்கும். விண்ணப்பம் சமர்ப்பிக்கப்படாது. உரையாடலில் முக்கியமான விவரங்களை உள்ளிட வேண்டாம்.',
    steps: ['திட்டத்தைத் தேடு', 'விவரங்களைப் பார்', 'மாதிரி படிவம்', 'சரிபார்த்து முடி'],
    sampleSchemes: 'மாதிரி திட்டங்கள்', sampleTag: 'தொடங்க ஒரு வழி', loading: 'மாதிரி திட்டங்களைத் தேடுகிறது…',
    loadError: 'மாதிரி திட்டங்களை ஏற்ற முடியவில்லை.', retry: 'மீண்டும் முயற்சி', eligibility: 'மாதிரி தகுதி', documents: 'தயாராக வைத்திருக்க வேண்டிய ஆவணங்கள்',
    summary: 'சுருக்கமாக', review: 'இந்தத் திட்டத்தைப் பார்', begin: 'மாதிரி படிவத்திற்குச் செல்', field: 'மாதிரி விண்ணப்பம்', fieldHelp: 'ஒரு நேரத்தில் ஒரு விவரம் கேட்கப்படும். இந்த மாதிரிக்கு கற்பனைப் பதிலைப் பயன்படுத்தலாம்.',
    next: 'சேமித்து தொடரவும்', reviewTitle: 'பதில்களை மீண்டும் பார்ப்போம்', reviewHelp: 'மாதிரி பதில்கள் இந்த உலாவியிலேயே இருக்கும்; இங்கே மீண்டும் வாசிக்கப்படும். விண்ணப்பம் சமர்ப்பிக்கப்படாது.', confirm: 'ஆம், சரியாக உள்ளது', edit: 'படிவத்திற்குத் திரும்பு',
    doneTitle: 'மாதிரி முடிந்தது', doneHelp: 'நீங்கள் உள்ளிட்ட மாதிரி விவரங்கள் இங்கே உள்ளன. விண்ணப்பம் அனுப்பப்படவில்லை.', startOver: 'புதிய உரையாடலைத் தொடங்கு',
    source: 'ஆதாரம்', noSchemes: 'இப்போது மாதிரி திட்டங்கள் எதுவும் இல்லை.', failed: 'செய்தியை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', tapSpeak: 'இந்தப் பதிலைச் சத்தமாக வாசி',
    working: 'அடுத்த படியைத் தயாரிக்கிறது…', matched: 'பொருந்தக்கூடிய திட்டம்', phase: 'உங்கள் முன்னேற்றம்', openDetails: 'விவரங்களைப் பார்', closeDetails: 'மறை',
    answerPlaceholder: 'மாதிரி பதிலை உள்ளிடவும்', continuePrompt: 'மாதிரி விண்ணப்பத்துடன் தொடர விரும்புகிறேன்.', readbackPrompt: 'இந்த மாதிரி பதில்களைப் பார்த்து உறுதிப்படுத்தவும்.',
    completedPrompt: 'ஆம், இந்த மாதிரி விவரங்கள் சரியாக உள்ளன.', formFirst: 'ஒவ்வொரு விவரமாகப் பயிற்சி செய்வோம். முதலில் உள்ளிடவும்:', formSaved: 'இந்த மாதிரியில் சேமிக்கப்பட்டது. அடுத்து உள்ளிடவும்:', readbackHint: 'பதிலை மாற்ற படிவத்திற்குத் திரும்பவும்; சரியாக இருந்தால் உறுதிப்படுத்தவும்.', completeReply: 'இந்த மாதிரி வழிகாட்டல் முடிந்தது. எந்த விண்ணப்பமும் சமர்ப்பிக்கப்படவில்லை.', stepOf: '/', noTranscript: 'உரையாடல் தொடங்கியதும் உங்கள் செய்திகள் இங்கே தெரியும்.',
    connection: 'உரையாடல் பதில்களுக்காக Groq-க்கு அனுப்பப்படும். மாதிரி படிவப் பதில்கள் இந்த உலாவியிலேயே இருக்கும்.', startWith: 'கீழே உள்ள திட்டத்துடன் தொடங்கலாம் அல்லது கேள்வியைத் தட்டச்சு செய்யலாம்.',
    language: 'மொழியைத் தேர்ந்தெடுக்கவும்', micPermission: 'உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.', noSpeech: 'குரல் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.', voiceError: 'குரல் உள்ளீட்டைத் தொடங்க முடியவில்லை. மைக்ரோஃபோனைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', speechFallback: 'இந்த உலாவியில் குரல் வாசிப்பு கிடைக்கவில்லை.',
  },
};

function getTamil(text: string) {
  return /[\u0B80-\u0BFF]/.test(text);
}

function isAffirmative(text: string) {
  const value = text.trim().toLowerCase();
  return /^(yes|yeah|yep|sure|ok(?:ay)?|continue|proceed|start)\b/.test(value)
    || /^(ஆம்|ஆமாம்|சரி|தொடரலாம்|தொடங்கலாம்)(\s|[.!?,…]|$)/.test(value);
}

function Home() {
  const schemesQuery = useListSchemes();
  const chat = useSendChatMessage();
  const [language, setLanguage] = useState<Language>('auto');
  const [activeLanguage, setActiveLanguage] = useState<ActiveLanguage>('en');
  const [stage, setStage] = useState<Stage>('discover');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldIndex, setFieldIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [fieldDraft, setFieldDraft] = useState('');
  const [error, setError] = useState('');
  const [voiceNote, setVoiceNote] = useState('');
  const [listExpanded, setListExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onerror: ((event: any) => void) | null; onend: (() => void) | null } | null>(null);
  const t = copy[language === 'ta' || (language === 'auto' && activeLanguage === 'ta') ? 'ta' : 'en'];
  const schemes = schemesQuery.data ?? [];
  const currentField = selectedScheme?.form_fields[fieldIndex];
  const progressIndex = stage === 'discover' ? 0 : stage === 'eligibility' ? 1 : stage === 'form' ? 2 : 3;
  const getCopyFor = (text = '') => copy[
    language === 'ta' || (language === 'auto' && (activeLanguage === 'ta' || getTamil(text))) ? 'ta' : 'en'
  ];

  useEffect(() => {
    if (transcript.length > 0) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript, chat.isPending, stage]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const appendLocalExchange = (userMessage: string, assistantMessage: string) => {
    const id = Date.now();
    setTranscript((items) => [
      ...items,
      { role: 'user', content: userMessage, id },
      { role: 'assistant', content: assistantMessage, id: id + 1 },
    ]);
    speak(assistantMessage);
  };

  const sendToGuide = async (message: string, contextStage: Stage = stage, scheme: Scheme | null = selectedScheme, contextAnswers = answers, fieldId: string | null = currentField?.id ?? null) => {
    const clean = message.trim();
    if (!clean || chat.isPending) return false;
    const detected: ActiveLanguage = language === 'auto' ? (getTamil(clean) ? 'ta' : activeLanguage) : language;
    setActiveLanguage(detected);
    const history: ChatMessage[] = transcript.slice(-20).map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));
    const input: ChatInput = {
      message: clean.slice(0, 2000),
      language: detected,
      conversationHistory: history,
      context: { stage: contextStage, schemeId: scheme?.id ?? null, currentFieldId: fieldId, answers: contextAnswers },
    };
    const userItem: TranscriptItem = { role: 'user', content: clean, id: Date.now() };
    setTranscript((items) => [...items, userItem]);
    setError('');
    setLastFailedMessage('');
    try {
      const response = await chat.mutateAsync({ data: input });
      setTranscript((items) => [...items, { role: 'assistant', content: response.reply, id: Date.now() + 1 }]);
      speak(response.reply);
      const match = response.matchedSchemeId ? schemes.find((item) => item.id === response.matchedSchemeId) : null;
      if (match) {
        setSelectedScheme(match);
        if (contextStage === 'discover') setStage('eligibility');
      }
      return true;
    } catch {
      setError(t.failed);
      setLastFailedMessage(clean);
      return false;
    }
  };

  const chooseScheme = async (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setStage('eligibility');
    setAnswers({});
    setFieldIndex(0);
    setDetailsExpanded(true);
    const name = activeLanguage === 'ta' ? scheme.name_ta : scheme.name_en;
    await sendToGuide(name, 'discover', scheme, {}, null);
  };

  const onSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const message = draft.trim();
    setDraft('');
    if (language === 'auto' && getTamil(message)) setActiveLanguage('ta');
    if (stage === 'form') {
      saveField(message);
      return;
    }
    if (stage === 'eligibility' && isAffirmative(message)) {
      startForm(selectedScheme, message);
      return;
    }
    if (stage === 'readback') {
      if (isAffirmative(message)) completeReadback(message);
      else appendLocalExchange(message, getCopyFor(message).readbackHint);
      return;
    }
    if (stage === 'complete') {
      appendLocalExchange(message, getCopyFor(message).completeReply);
      return;
    }
    const matching = schemes.find((scheme) => `${scheme.name_en} ${scheme.name_ta}`.toLowerCase().includes(message.toLowerCase()) || message.toLowerCase().includes(scheme.name_en.toLowerCase()));
    if (matching && !selectedScheme) {
      setSelectedScheme(matching);
      setStage('eligibility');
      await sendToGuide(message, 'discover', matching, {}, null);
      return;
    }
    await sendToGuide(message);
  };

  const startForm = (schemeOverride: Scheme | null = selectedScheme, userMessage = t.continuePrompt) => {
    if (!schemeOverride) return;
    setFieldIndex(0);
    setFieldDraft('');
    const firstField = schemeOverride.form_fields[0];
    if (!firstField) {
      setStage('readback');
      return;
    }
    setStage('form');
    const tamil = language === 'ta' || (language === 'auto' && (activeLanguage === 'ta' || getTamil(userMessage)));
    const localCopy = getCopyFor(userMessage);
    const label = tamil ? firstField.label_ta : firstField.label_en;
    appendLocalExchange(userMessage, `${localCopy.formFirst} ${label}.`);
    window.setTimeout(() => fieldRef.current?.focus(), 80);
  };

  const saveField = (value: string) => {
    if (!selectedScheme || !currentField || !value.trim()) return;
    const nextAnswers = { ...answers, [currentField.id]: value.trim() };
    setAnswers(nextAnswers);
    setFieldDraft('');
    const nextIndex = fieldIndex + 1;
    const isLast = nextIndex >= selectedScheme.form_fields.length;
    if (isLast) setStage('readback');
    setFieldIndex(isLast ? fieldIndex : nextIndex);
    setFieldDraft(isLast ? '' : nextAnswers[selectedScheme.form_fields[nextIndex].id] ?? '');
    if (isLast) {
      const tamil = language === 'ta' || (language === 'auto' && (activeLanguage === 'ta' || getTamil(value)));
      const localCopy = getCopyFor(value);
      const answersToRead = selectedScheme.form_fields
        .map((field) => `${tamil ? field.label_ta : field.label_en}: ${nextAnswers[field.id] ?? '—'}`)
        .join('. ');
      appendLocalExchange(value.trim(), `${localCopy.readbackPrompt} ${answersToRead}`);
      return;
    }
    const nextField = selectedScheme.form_fields[nextIndex];
    const tamil = language === 'ta' || (language === 'auto' && (activeLanguage === 'ta' || getTamil(value)));
    const localCopy = getCopyFor(value);
    appendLocalExchange(value.trim(), `${localCopy.formSaved} ${tamil ? nextField.label_ta : nextField.label_en}.`);
    window.setTimeout(() => fieldRef.current?.focus(), 80);
  };

  const submitField = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveField(fieldDraft);
  };

  const completeReadback = (confirmation: string) => {
    if (!selectedScheme) return;
    setStage('complete');
    appendLocalExchange(confirmation, getCopyFor(confirmation).completeReply);
  };

  const confirmReadback = () => completeReadback(t.completedPrompt);

  const restart = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setStage('discover');
    setSelectedScheme(null);
    setTranscript([]);
    setAnswers({});
    setFieldIndex(0);
    setDraft('');
    setFieldDraft('');
    setError('');
    setLastFailedMessage('');
    setVoiceNote('');
  };

  const startVoice = () => {
    const SpeechRecognitionCtor = (window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceNote(t.voiceFallback);
      inputRef.current?.focus();
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setVoiceNote('');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    let recognitionFailed = false;
    recognition.lang = (language === 'ta' || (language === 'auto' && activeLanguage === 'ta')) ? 'ta-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const phrase = (event.results?.[0]?.[0]?.transcript ?? '').trim();
      if (!phrase) return;
      setVoiceNote('');
      if (language === 'auto' && getTamil(phrase)) setActiveLanguage('ta');
      if (stage === 'form') {
        setFieldDraft(phrase);
        saveField(phrase);
      } else if (stage === 'eligibility' && isAffirmative(phrase)) {
        startForm(selectedScheme, phrase);
      } else if (stage === 'readback') {
        if (isAffirmative(phrase)) completeReadback(phrase);
        else appendLocalExchange(phrase, getCopyFor(phrase).readbackHint);
      } else if (stage === 'complete') {
        appendLocalExchange(phrase, getCopyFor(phrase).completeReply);
      } else {
        setDraft('');
        void sendToGuide(phrase);
      }
    };
    recognition.onerror = (event: any) => {
      recognitionFailed = true;
      setVoiceNote(event?.error === 'not-allowed' || event?.error === 'service-not-allowed'
        ? t.micPermission
        : event?.error === 'no-speech'
          ? t.noSpeech
          : t.voiceError);
      recognitionRef.current = null;
    };
    recognition.onend = () => { recognitionRef.current = null; if (!recognitionFailed) setVoiceNote(''); };
    recognitionRef.current = recognition;
    setVoiceNote(t.voiceReady);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceNote(t.voiceError);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceNote(t.speechFallback);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTamil(text) ? 'ta-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const languageName = (scheme: Scheme, kind: 'name' | 'category' | 'summary' | 'eligibility') => {
    const tamil = language === 'ta' || (language === 'auto' && activeLanguage === 'ta');
    const key = `${kind}_${tamil ? 'ta' : 'en'}` as keyof Scheme;
    return scheme[key] as string;
  };

  const toggleDetails = () => setDetailsExpanded((expanded) => !expanded);

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-8 sm:px-7 lg:px-10">
        <header className="flex min-h-[82px] items-center justify-between gap-4 border-b border-[#d8d4c9]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#204e45] text-[#f4d888] shadow-sm">
              <span className="absolute h-6 w-6 rounded-full border border-[#f4d888]/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#f4d888]" />
            </div>
            <div>
              <p className="font-serif text-[18px] font-extrabold tracking-[-.04em] text-[#20443e]">{t.guide}</p>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#78827b]">{t.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#d7d1c5] bg-[#f8f6ef] px-3 py-2 text-[10px] font-bold tracking-[.11em] text-[#586e64] sm:flex">
              <ShieldCheck size={14} strokeWidth={1.8} />
              <span>{t.demo}</span>
            </div>
            <div role="group" aria-label={t.language} className="flex items-center rounded-full border border-[#d7d1c5] bg-[#f8f6ef] p-1">
              {(['en', 'ta', 'auto'] as const).map((option) => (
                <button key={option} type="button" data-testid={`language-${option}`} aria-pressed={language === option} onClick={() => setLanguage(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${language === option ? 'bg-[#204e45] text-[#fbf7e8]' : 'text-[#66776e] hover:text-[#204e45]'}`}>
                  {option === 'en' ? 'English' : option === 'ta' ? 'தமிழ்' : 'Auto'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="relative grid items-end gap-5 pb-7 pt-9 sm:grid-cols-[1fr_auto] sm:pt-12">
          <div className="max-w-[720px] fade-in">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#78827b]">
              <span className="h-px w-7 bg-[#c49f45]" /> {t.demo}
            </div>
            <h1 className="max-w-[690px] font-serif text-[34px] font-semibold leading-[1.12] tracking-[-.055em] text-[#1f443d] sm:text-[46px]">
              {t.header}
            </h1>
            <p className="mt-4 max-w-[600px] text-[14px] leading-6 text-[#68766e] sm:text-[15px]">{t.subheader}</p>
          </div>
          <div className="hidden items-center gap-3 pb-1 sm:flex">
            <div className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#d7c99f] bg-[#f5edcf]">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#204e45] text-[#f4d888]"><Headphones size={20} strokeWidth={1.5} /></div>
              <span className="absolute right-0 top-1 h-3 w-3 rounded-full border-2 border-[#f4f0e5] bg-[#cda83f]" />
            </div>
            <div><p className="font-serif text-sm font-bold text-[#244b43]">{t.live}</p><p className="mt-1 text-xs text-[#7a857e]">{t.connection}</p></div>
          </div>
        </section>

        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_350px]">
          <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#d9d4c8] bg-[#fbf9f3] shadow-[0_18px_55px_rgba(38,63,55,.08)]">
            <div className="flex items-center justify-between border-b border-[#e5e0d5] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9efe8] text-[#315b4f]"><Headphones size={17} /></div>
                <div><h2 className="font-serif text-[16px] font-bold text-[#25473f]">{t.chatTitle}</h2><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#8a938c]">{t.live}</p></div>
              </div>
              {transcript.length > 0 && <button data-testid="button-reset-conversation" onClick={restart} title={t.startOver} className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-[#6c7c73] hover:bg-[#f0ede4]"><RotateCcw size={14} /><span className="hidden sm:inline">{t.startOver}</span></button>}
            </div>
            <div ref={scrollRef} className="message-scroll flex min-h-[330px] max-h-[510px] flex-col gap-5 overflow-y-auto px-5 py-6 sm:min-h-[390px] sm:px-8 sm:py-8" aria-live="polite">
              {transcript.length === 0 && (
                <div className="fade-in flex max-w-[570px] gap-3" data-testid="message-welcome">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#204e45] text-[12px] font-bold text-[#f4d888]">G</div>
                  <div className="rounded-2xl rounded-tl-sm border border-[#e4dfd4] bg-[#f4f2eb] px-4 py-3.5 text-[14px] leading-6 text-[#435a50]">{t.greeting}<p className="mt-2 text-xs text-[#839087]">{t.startWith}</p></div>
                </div>
              )}
              {transcript.map((item) => (
                <div key={item.id} className={`fade-in flex max-w-[94%] gap-3 ${item.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`} data-testid={`message-${item.role}-${item.id}`}>
                  {item.role === 'assistant' && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#204e45] text-[12px] font-bold text-[#f4d888]">G</div>}
                  <div className={`group relative rounded-2xl px-4 py-3.5 text-[14px] leading-6 ${item.role === 'user' ? 'rounded-tr-sm bg-[#315d51] text-[#fbf8ed]' : 'rounded-tl-sm border border-[#e4dfd4] bg-[#f4f2eb] text-[#435a50]'}`}>
                    <p className="whitespace-pre-wrap">{item.content}</p>
                    {item.role === 'assistant' && <button data-testid={`button-read-aloud-${item.id}`} onClick={() => speak(item.content)} title={t.tapSpeak} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#78877e] hover:text-[#315d51]"><Volume2 size={13} /> {t.tapSpeak}</button>}
                  </div>
                </div>
              ))}
              {chat.isPending && <div className="flex items-center gap-3 text-sm text-[#7c8980]" data-testid="status-chat-loading"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#204e45] text-[#f4d888]">G</div><span className="animate-pulse">{t.working}</span></div>}
            </div>

            {(stage === 'eligibility' || stage === 'form' || stage === 'readback' || stage === 'complete') && selectedScheme && (
              <div className="mx-5 mb-5 rounded-2xl border border-[#d8d6c7] bg-[#f3f1e8] p-4 sm:mx-8 sm:mb-6 sm:p-5 fade-in" data-testid="panel-current-step">
                {stage === 'eligibility' && (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#9a8141]">{t.matched}</p><h3 className="font-serif text-[20px] font-bold leading-snug text-[#234a41]">{languageName(selectedScheme, 'name')}</h3><p className="mt-1 text-xs text-[#78847c]">{languageName(selectedScheme, 'category')}</p></div>
                      <button data-testid="button-toggle-details" onClick={toggleDetails} className="flex items-center gap-1 rounded-full border border-[#d5d1c3] px-3 py-1.5 text-xs font-semibold text-[#61746a] hover:bg-[#e8e5db]">{detailsExpanded ? t.closeDetails : t.openDetails}<ChevronDown size={13} className={detailsExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
                    </div>
                    {detailsExpanded && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-[#fbfaf5] p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#9a8141]">{t.eligibility}</p><p className="text-[13px] leading-5 text-[#4e6258]">{languageName(selectedScheme, 'eligibility')}</p></div>
                      <div className="rounded-xl bg-[#fbfaf5] p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#9a8141]">{t.documents}</p><ul className="space-y-1.5">{(language === 'ta' || (language === 'auto' && activeLanguage === 'ta') ? selectedScheme.documents_ta : selectedScheme.documents_en).map((doc, index) => <li key={`${doc}-${index}`} className="flex items-start gap-2 text-[13px] leading-5 text-[#4e6258]"><Check size={14} className="mt-1 shrink-0 text-[#6b8979]" />{doc}</li>)}</ul></div>
                    </div>}
                     <div className="mt-4 flex flex-col gap-3 border-t border-[#dedacd] pt-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs leading-5 text-[#79847c]">{t.note}</span><button data-testid="button-begin-sample-form" disabled={chat.isPending} onClick={() => void startForm()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#204e45] px-5 py-2.5 text-[13px] font-semibold text-[#fbf7e8] transition hover:bg-[#173c35] disabled:opacity-50">{t.begin}<ArrowRight size={15} /></button></div>
                  </>
                )}
                {stage === 'form' && currentField && <form onSubmit={submitField}>
                  <div className="mb-4 flex items-center justify-between gap-4"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#9a8141]">{t.field} · {fieldIndex + 1} {t.stepOf} {selectedScheme.form_fields.length}</p><h3 className="font-serif text-[19px] font-bold text-[#234a41]">{language === 'ta' || (language === 'auto' && activeLanguage === 'ta') ? currentField.label_ta : currentField.label_en}</h3></div><ClipboardList size={20} className="text-[#8e9a8e]" /></div>
                  <p className="mb-4 text-xs leading-5 text-[#748078]">{t.fieldHelp}</p>
                  <div className="flex flex-col gap-2 sm:flex-row"><input ref={fieldRef} data-testid={`input-sample-field-${currentField.id}`} type={currentField.type === 'number' ? 'number' : 'text'} value={fieldDraft} onChange={(event) => setFieldDraft(event.target.value)} placeholder={t.answerPlaceholder} className="min-w-0 flex-1 rounded-xl border border-[#d8d4c8] bg-[#fbfaf5] px-4 py-3 text-sm text-[#26473f] outline-none placeholder:text-[#9aa29b] focus:border-[#648174] focus:ring-2 focus:ring-[#648174]/15" required />
                    <button data-testid="button-next-sample-field" disabled={chat.isPending || !fieldDraft.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#204e45] px-5 py-3 text-sm font-semibold text-[#fbf7e8] hover:bg-[#173c35] disabled:opacity-45">{t.next}<ArrowRight size={15} /></button></div>
                </form>}
                {stage === 'readback' && <div>
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4eadf] text-[#38624f]"><ClipboardList size={19} /></div><div><h3 className="font-serif text-[19px] font-bold text-[#234a41]">{t.reviewTitle}</h3><p className="text-xs text-[#78847c]">{t.reviewHelp}</p></div></div>
                  <div className="mb-4 divide-y divide-[#e2ded2] rounded-xl border border-[#e2ded2] bg-[#fbfaf5]">{selectedScheme.form_fields.map((field) => <div key={field.id} className="flex items-start justify-between gap-4 px-4 py-3"><span className="text-xs font-semibold text-[#758078]">{language === 'ta' || (language === 'auto' && activeLanguage === 'ta') ? field.label_ta : field.label_en}</span><span className="text-right text-sm font-medium text-[#31574d]">{answers[field.id] || '—'}</span></div>)}</div>
                  <div className="flex flex-wrap justify-end gap-2"><button data-testid="button-edit-sample-form" onClick={() => { setFieldIndex(0); setStage('form'); setFieldDraft(answers[selectedScheme.form_fields[0]?.id ?? ''] ?? ''); }} className="rounded-full border border-[#cfcbbd] px-4 py-2.5 text-xs font-semibold text-[#607268] hover:bg-[#e9e6dc]">{t.edit}</button><button data-testid="button-confirm-sample" onClick={confirmReadback} disabled={chat.isPending} className="flex items-center gap-2 rounded-full bg-[#204e45] px-5 py-2.5 text-xs font-semibold text-[#fbf7e8] hover:bg-[#173c35] disabled:opacity-50">{t.confirm}<CheckCircle2 size={15} /></button></div>
                </div>}
                {stage === 'complete' && <div className="fade-in">
                  <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfeadf] text-[#35604d]"><CheckCircle2 size={20} /></div><div><h3 className="font-serif text-[20px] font-bold text-[#234a41]">{t.doneTitle}</h3><p className="mt-1 text-xs text-[#78847c]">{t.doneHelp}</p></div></div>
                  <div className="mb-4 rounded-xl border border-[#e2ded2] bg-[#fbfaf5] px-4"><div className="border-b border-[#e2ded2] py-3 text-sm font-bold text-[#31574d]">{languageName(selectedScheme, 'name')}</div>{selectedScheme.form_fields.map((field) => <div key={field.id} className="flex justify-between gap-4 border-b border-[#e2ded2] py-3 last:border-0"><span className="text-xs text-[#758078]">{language === 'ta' || (language === 'auto' && activeLanguage === 'ta') ? field.label_ta : field.label_en}</span><span className="text-right text-sm font-medium text-[#31574d]">{answers[field.id] || '—'}</span></div>)}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-[11px] leading-5 text-[#78847c]">{t.note}</p><button data-testid="button-start-over" onClick={restart} className="flex items-center gap-2 rounded-full bg-[#204e45] px-4 py-2.5 text-xs font-semibold text-[#fbf7e8] hover:bg-[#173c35]"><RotateCcw size={14} />{t.startOver}</button></div>
                </div>}
              </div>
            )}

            {error && <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl border border-[#e7c6b9] bg-[#fcf0ea] px-4 py-3 text-xs text-[#8a4637] sm:mx-8" role="alert" data-testid="status-chat-error"><AlertCircle size={15} />{error}<button data-testid="button-retry-chat" onClick={() => void sendToGuide(lastFailedMessage)} className="ml-auto font-bold underline">{t.retry}</button></div>}
            <form onSubmit={onSend} className="border-t border-[#e5e0d5] bg-[#f8f6ef] px-5 py-4 sm:px-8 sm:py-5">
              <div className="flex items-end gap-2 rounded-[18px] border border-[#d9d4c8] bg-[#fbfaf5] p-2 pl-4 shadow-[0_3px_12px_rgba(36,63,53,.04)] focus-within:border-[#7d9888] focus-within:ring-2 focus-within:ring-[#7d9888]/10">
                <input ref={inputRef} data-testid="input-chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={stage === 'form' ? t.answerPlaceholder : t.compose} maxLength={2000} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#26473f] outline-none placeholder:text-[#9aa29b]" />
                <button type="button" data-testid="button-voice-input" onClick={startVoice} aria-label={t.mic} disabled={chat.isPending} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${recognitionRef.current ? 'bg-[#ead9ca] text-[#974d3f]' : 'text-[#60786b] hover:bg-[#efede4]'}`}>{recognitionRef.current ? <MicOff size={17} /> : <Mic size={17} />}</button>
                <button type="submit" data-testid="button-send-message" disabled={!draft.trim() || chat.isPending} aria-label={t.send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#204e45] text-[#fbf7e8] transition hover:bg-[#173c35] disabled:opacity-40"><Send size={16} /></button>
              </div>
              <div className="flex min-h-6 items-center justify-between gap-2 px-1 pt-2"><p className="text-[11px] leading-4 text-[#818b83]" data-testid="text-voice-status">{voiceNote || t.note}</p><span className="hidden shrink-0 text-[10px] text-[#a0a79f] sm:block">{draft.length}/2000</span></div>
            </form>
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="overflow-hidden rounded-[22px] border border-[#d8d3c6] bg-[#244b42] text-[#f7f4e9] shadow-[0_14px_38px_rgba(32,76,66,.12)]">
              <div className="soft-grid p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#cad4c9]">{t.phase}</p><span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-[#e6dfc7]">{progressIndex + 1} / 4</span></div>
                <ol className="space-y-4">
                  {t.steps.map((label, index) => {
                    const isCurrent = index === progressIndex;
                    const isDone = index < progressIndex || stage === 'complete';
                    return <li key={label} className={`flex items-center gap-3 text-[13px] ${isCurrent ? 'font-semibold text-[#fff9e8]' : isDone ? 'text-[#d8e1d4]' : 'text-[#a7b9ad]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] ${isDone ? 'border-[#e8cf82] bg-[#e8cf82] text-[#244b42]' : isCurrent ? 'border-[#e8cf82] text-[#f4d888]' : 'border-white/25 text-white/60'}`}>{isDone ? <Check size={13} /> : `0${index + 1}`}</span>{label}{isCurrent && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f4d888]" />}</li>;
                  })}
                </ol>
              </div>
            </section>
            <section className="overflow-hidden rounded-[22px] border border-[#d9d4c8] bg-[#fbf9f3] shadow-[0_10px_28px_rgba(38,63,55,.05)]">
              <div className="flex items-center justify-between border-b border-[#e8e3d8] px-5 py-4">
                <div><p className="font-serif text-[16px] font-bold text-[#25473f]">{t.sampleSchemes}</p><p className="mt-1 text-[11px] text-[#849087]">{t.sampleTag}</p></div>
                <button data-testid="button-toggle-schemes" onClick={() => setListExpanded((value) => !value)} aria-label={listExpanded ? t.closeDetails : t.openDetails} className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a887f] hover:bg-[#f0ede4]"><ChevronDown size={16} className={listExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
              </div>
              {listExpanded && <div className="p-3">
                {schemesQuery.isLoading && <div className="space-y-2 p-2" data-testid="status-schemes-loading"><div className="h-[66px] animate-pulse rounded-xl bg-[#efede5]" /><div className="h-[66px] animate-pulse rounded-xl bg-[#efede5]" /><p className="pt-1 text-xs text-[#879188]">{t.loading}</p></div>}
                {schemesQuery.isError && <div className="m-2 rounded-xl border border-[#e6d5c7] bg-[#fbf1e8] p-3 text-xs leading-5 text-[#865647]" data-testid="status-schemes-error"><p>{t.loadError}</p><button data-testid="button-retry-schemes" onClick={() => void schemesQuery.refetch()} className="mt-1 font-bold underline">{t.retry}</button></div>}
                {!schemesQuery.isLoading && !schemesQuery.isError && schemes.length === 0 && <div className="m-2 rounded-xl bg-[#f2f0e8] p-4 text-xs leading-5 text-[#77837a]" data-testid="status-schemes-empty"><FileText size={17} className="mb-2 text-[#829287]" />{t.noSchemes}</div>}
                 {schemes.slice(0, 5).map((scheme) => {
                  const isSelected = selectedScheme?.id === scheme.id;
                   return <button key={scheme.id} data-testid={`button-scheme-${scheme.id}`} disabled={chat.isPending} onClick={() => void chooseScheme(scheme)} className={`group mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors last:mb-0 disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? 'bg-[#e8ede5]' : 'hover:bg-[#f2f0e8]'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-[#315d51] text-[#f4d888]' : 'bg-[#efede4] text-[#718278]'}`}><FileText size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#38574c]">{languageName(scheme, 'name')}</span><span className="mt-0.5 block truncate text-[11px] text-[#89938b]">{languageName(scheme, 'category')}</span></span>
                    <ArrowRight size={14} className="shrink-0 text-[#9ba59b] transition-transform group-hover:translate-x-0.5" />
                  </button>;
                })}
              </div>}
              {selectedScheme && <div className="border-t border-[#e8e3d8] px-5 py-4"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#9a8141]">{t.summary}</p><p className="text-xs leading-5 text-[#65766c]">{languageName(selectedScheme, 'summary')}</p><a href={selectedScheme.source} target="_blank" rel="noreferrer" data-testid="link-scheme-source" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#477061] underline decoration-[#b4c5b8] underline-offset-2">{t.source}: {selectedScheme.source_label}<ArrowRight size={12} /></a></div>}
            </section>
            <div className="flex items-start gap-3 px-2 py-1 text-[11px] leading-5 text-[#829087]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#8da090]" /><p>{t.note}</p></div>
          </aside>
        </div>
        <footer className="mt-7 flex flex-col gap-2 border-t border-[#d8d4c9] py-4 text-[10px] leading-5 text-[#879087] sm:flex-row sm:items-center sm:justify-between">
          <p>{t.demo}</p><p>{t.connection}</p>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
