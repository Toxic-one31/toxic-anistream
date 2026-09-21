"""Persistent key/value storage backed by a private Telegram channel.

The bot must be an administrator in STORAGE_CHANNEL_ID. Records are append-only
and use a small, versioned text format so they can be inspected manually.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pyrogram import Client

logger = logging.getLogger(__name__)
PREFIX = "TOXIC_STORE_V1 "


class TelegramChannelStore:
    def __init__(self, client: Client, channel_id: int) -> None:
        self.client = client
        self.channel_id = channel_id
        self.values: dict[str, Any] = {}

    async def load(self) -> None:
        """Load the newest value for each key from channel history."""
        async for message in self.client.get_chat_history(self.channel_id):
            text = message.text or message.caption or ""
            if not text.startswith(PREFIX):
                continue
            try:
                record = json.loads(text[len(PREFIX):])
                key = str(record["key"])
                if key not in self.values:
                    self.values[key] = record["value"]
            except (ValueError, KeyError, TypeError) as exc:
                logger.warning("Skipping malformed storage record: %s", exc)
        logger.info("Loaded %d persistent values from Telegram channel", len(self.values))

    async def set(self, key: str, value: Any) -> None:
        """Append a new value record to the private storage channel."""
        payload = {"key": key, "value": value}
        await self.client.send_message(self.channel_id, PREFIX + json.dumps(payload, separators=(",", ":")))
        self.values[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self.values.get(key, default)
