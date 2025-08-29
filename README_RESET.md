Daily reset script

This repository includes `scripts/dailyReset.ts` which performs daily maintenance:

- Deletes all rows in `messages`, `rooms`, `votes` tables (archive MVP handled elsewhere)
- Inserts a placeholder question into `questions` table (replace with GPT integration)

How to run locally

1. Create a `.env` file with the following keys:

```
VITE_SUPABASE_URL=https://<your>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-service-key>
# or
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# (Optional) GPT / OpenAI settings
OPENAI_API_KEY=<your-openai-api-key>
# If you need a custom endpoint (e.g., proxy), set OPENAI_API_URL
# OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

2. Run the script:

```bash
npm run daily-reset
```

Scheduling

- Recommend deploying as a GitHub Actions scheduled job OR Supabase Scheduled Function (Edge Function) using the service role key.
- For GitHub Actions, create a workflow that runs `npm ci` and then `npm run daily-reset` once per day at 00:00.
