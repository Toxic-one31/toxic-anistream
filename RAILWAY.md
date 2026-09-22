# Toxic Anime Railway deployment

The monorepo is deployed as two services:

## Frontend service

- Root directory: `/`
- Build command: `npm run build`
- Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Deploy from the existing React/Vite project.

## Bot service

- Root directory: `/apps/bot`
- Builder: Dockerfile
- Healthcheck: `/health`
- Required variables: `API_ID`, `API_HASH`, and `BOT_TOKEN`

## Recommended rollout

1. Deploy the frontend without changing its current public behavior.
2. Deploy the bot service separately and verify `/health`.
3. Add provider adapters behind `apps/bot/providers/`.
4. Add persistent storage only after selecting the storage implementation.
5. Keep secrets in Railway Variables; never commit `.env` files or Telegram credentials.
