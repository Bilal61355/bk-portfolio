# Bilal — AIML Portfolio

An editorial-style personal portfolio built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion and React Three Fiber.

## Requirements

- Node.js 20 LTS or newer
- npm

## Run locally

```bash
npm install
Copy-Item .env.example .env.local  # PowerShell
npm run dev
```

Open http://localhost:3000.

## Personalise before publishing

Set real values in `.env.local` (or the Vercel project environment variables):

- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_GITHUB_URL`
- `NEXT_PUBLIC_LINKEDIN_URL`

Leave values blank until the correct details are available. The site intentionally does not link to generic GitHub/LinkedIn homepages or use a fabricated email address.

Review the project descriptions and add verified repository/demo URLs, screenshots, model evaluation results and precise individual contributions before presenting them as completed case studies. The fraud-detection project is described as using the Kaggle credit-card fraud dataset. MechanicAI is described as a product concept/build, and the emotion API as an IBM course project.

## Quality checks

```bash
npm run typecheck
npm run build
npm run start
```

## Deploy to Vercel

1. Push this folder to a GitHub repository you control.
2. Import the repository into Vercel.
3. Keep the framework preset as Next.js and the default build command (`npm run build`).
4. Add the real contact/profile environment variables in Vercel if you want those links displayed.
5. Deploy and verify the production URL on desktop and mobile.

No API keys or server-side environment variables are required for the current portfolio implementation.
