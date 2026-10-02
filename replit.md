# GovAssist

GovAssist is a mobile-friendly Tamil and English demo that helps people explore sample public-benefit schemes and practice a guided application conversation. It never submits an official application.

## Run & Operate

- Start the managed `artifacts/api-server: API Server` and `artifacts/govassist: web` workflows in Replit.
- Add `GROQ_API_KEY` through Replit Secrets for assistant replies. The key is used by the API server only; never put it in frontend code or commit it.
- `pnpm run typecheck` — typecheck shared libraries and workspace packages.
- `pnpm --filter @workspace/api-server run build` — build the API server.
- API route prefix: `/api`.

## Stack

- pnpm workspace, TypeScript, React, Vite, Tailwind CSS
- Express API with Zod-validated, OpenAPI-generated request and response types
- Groq chat completions called server-side
- Browser Web Speech APIs for speech recognition and speech synthesis
- No database: sample answers and chat history are held only in client memory

## Where things live

- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/api-client-react/` and `lib/api-zod/` — generated API client hooks and validation types
- `artifacts/api-server/src/data/schemes.json` — bilingual sample scheme facts and field labels
- `artifacts/api-server/src/routes/govassist.ts` — scheme and chat routes, Groq call, and response guardrails
- `artifacts/govassist/src/App.tsx` — bilingual chat, scheme details, sample form, read-back, and confirmation states
- `artifacts/govassist/src/index.css` — visual theme and responsive styles

## Architecture decisions

- Scheme facts and form fields come from local curated JSON; the model receives this data as context and must not invent missing requirements.
- The API checks the model's matched scheme ID against the known list before returning it to the client.
- Sample chat messages and form answers are sent to Groq as conversation context so the assistant can guide and read them back. The app does not persist them or send them to a government service.
- Scheme cards link to official scheme or department pages. The current catalog is not a raw `data.gov.in` download.
- Browser speech support varies. When speech recognition is unavailable or denied, users can continue by typing.

## Product

- Explore five example family-card, pension, and scholarship guides in English or Tamil.
- Review sample eligibility and document notes, then move through a one-field-at-a-time practice form by text or voice.
- Review answers and explicitly confirm the demo read-back.
- Every stage is labeled as a demo; no official service connection or application submission exists.

## Gotchas

- Assistant replies require the `GROQ_API_KEY` secret. Scheme examples load without it, but chat will return a configuration error.
- Use the managed artifact workflows so Replit supplies `PORT`, `BASE_PATH`, and service routing. Restart the API workflow after backend changes; it builds and starts a server rather than watching source files.
- Do not treat demo eligibility or document notes as a final eligibility decision. Follow each source link and verify current state rules.