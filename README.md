# GovAssist

GovAssist is a mobile-friendly Tamil and English demo for people who want a clearer way to explore public-benefit schemes and understand the steps in an application.

## Problem and solution

Government scheme information and application steps can be difficult to navigate, especially when the instructions are unfamiliar or a user would rather speak than type. GovAssist presents a small set of examples in plain language, answers questions in English or Tamil, and guides the user through a one-field-at-a-time practice form with a read-back before they finish.

**This is only a demo.** It is not an official government service, does not make an eligibility decision, and never submits an application.

## Demo

- Demo video/GIF: _Not recorded yet. Add the recording link here before submitting the hackathon entry._
- The running app is available in the GovAssist Replit preview.

## Features

- English, Tamil, and automatic language selection
- Five sample scheme guides covering a Tamil Nadu family card, old-age pension, widow pension, disability pension, and a postgraduate scholarship
- Eligibility and document notes linked to official scheme or department pages
- Browser voice input and spoken assistant replies, with typed input as a fallback
- A practice application that asks for one sample answer at a time, reads the answers back, and requires confirmation
- Clear notice that chat messages and sample answers are sent to Groq for replies, while no application is sent to a government service

## Technology

- React, TypeScript, Vite, and Tailwind CSS
- Express API with OpenAPI-generated client types and Zod validation
- Groq chat completions called by the server; `GROQ_API_KEY` is never exposed in the browser
- Browser Web Speech APIs for voice input and speech synthesis
- Local JSON scheme data; no database

## Run locally

Use Node.js and pnpm from the workspace root:

```sh
pnpm install
```

Set `GROQ_API_KEY` in your shell environment for assistant replies. In Replit, add it through **Secrets** instead of putting it in a file or source control.

Start the API server in one terminal:

```sh
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Start the web app in another terminal:

```sh
PORT=24520 BASE_PATH=/ pnpm --filter @workspace/govassist run dev
```

Open `http://localhost:24520`. The Vite development server forwards `/api` requests to the API server on port `8080`.

In Replit, use the managed **API Server** and **GovAssist** workflows; they set the required service environment and routing automatically.

## Scheme references and data notes

The five short entries in `artifacts/api-server/src/data/schemes.json` are curated from official programme or department pages. The current catalog is **not** imported from raw `data.gov.in` CSV/JSON downloads. Eligibility details and accepted documents may vary or change, so users should verify the source page and current Tamil Nadu requirements.

- [Tamil Nadu family-card eligibility](https://consumer.tn.gov.in/eligibility_ration.htm)
- [Indira Gandhi National Old Age Pension Scheme](https://www.myscheme.gov.in/schemes/nsap-ignoaps)
- [Indira Gandhi National Widow Pension Scheme](https://www.myscheme.gov.in/schemes/ignwps)
- [Indira Gandhi National Disability Pension Scheme](https://www.myscheme.gov.in/schemes/igndps)
- [Tamil Nadu Directorate of Collegiate Education scholarship information](https://tndce.tn.gov.in/Home/scholarship)

## Checks

```sh
pnpm run typecheck
pnpm --filter @workspace/api-server run build
```