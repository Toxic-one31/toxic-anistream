# ☠️ Toxic Anime Bot

Railway-ready Telegram service for the **Toxic Anime** monorepo.

## Identity

Toxic Anime is designed as an anime command center:

**Search → Anime → Episodes → Quality → Download → FFmpeg → Telegram**

The Telegram UI is provider-agnostic. Provider adapters return normalized anime/episode data, allowing sources to be added or replaced without rewriting the Telegram layer.

## Current stage

- ☠️ Toxic Anime branding and command UI
- 🔎 `/anime <title>` search entry point
- 📥 download status entry point
- 📊 Railway health/status endpoints
- 🎬 FFmpeg + aria2 available in the container
- 🧩 provider adapter boundary
- 🚫 no MongoDB dependency in this service scaffold

The actual provider search, episode resolution, download worker, Telegram file delivery, caching and quality selection are separate integration stages.

## Railway

Set the Railway service root directory to `apps/bot`, then add variables from `.env.example`.

For persistent downloads/session data, attach a Railway Volume and set:

```
DATA_DIR=/data/toxic-anime
```

## License note

The original `MirageBots/AnimePahe` project is GPL-2.0 licensed. Future code directly copied or adapted from it must retain applicable license notices and comply with GPL-2.0. This service currently uses an independent provider boundary rather than copying its source files verbatim.
