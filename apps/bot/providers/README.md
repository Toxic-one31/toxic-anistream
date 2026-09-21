# Provider boundary

Anime providers belong behind this directory. Implement provider adapters with a stable contract:

- `search(query)`
- `get_title(title_id)`
- `get_episodes(title_id)`
- `get_download_options(episode_id)`

Provider adapters must respect the upstream site's terms, robots rules, copyright requirements, and applicable law. Do not assume that a streaming URL is a downloadable or redistributable file.
