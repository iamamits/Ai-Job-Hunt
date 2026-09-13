## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and add your local API key.
3. Run the app:
   `npm run dev`

## Deploy To Vercel

1. Import the GitHub repository into Vercel.
2. In Vercel project settings, add `OPENROUTER_API_KEY` under Environment Variables.
3. Add `APP_URL` with your deployed Vercel URL.
4. Redeploy the project.

Never commit `.env`, `.env.local`, or real API keys to GitHub. The repository includes `.env.example` only as a safe template.
