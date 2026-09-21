# Toxic Anime Bot Service

This directory contains the Railway-deployable Telegram bot service for Toxic Anime.

## Scope

- Telegram bot runtime isolated from the React/Vite frontend.
- AnimePahe provider integration point.
- Health endpoint for Railway.
- Environment-driven configuration.
- No MongoDB dependency in the initial service scaffold.

The original `MirageBots/AnimePahe` project is GPL-2.0 licensed. Any future code copied or adapted from it must retain its license notices and comply with GPL-2.0. This service currently uses a clean integration boundary rather than copying source files verbatim.

## Local run

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python bot.py
```

## Railway

Create a Railway service using this repository and set the service root directory to `apps/bot`. Add the variables from `.env.example` in Railway's Variables tab.
