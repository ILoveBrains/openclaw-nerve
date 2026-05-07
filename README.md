<div align="center">

<img src="docs/nerve-logo-animated.svg" alt="Nerve" width="200" />

# Nerve

**The cockpit OpenClaw deserves.**

*OpenClaw is powerful. Nerve is the interface that makes people say "oh, now I get it."*

> ⚠️ **This fork is for active development of the Theme Overhaul and Deck Mode features.**
> For the stable upstream, see [daggerhashimoto/openclaw-nerve](https://github.com/daggerhashimoto/openclaw-nerve).

[![Star Nerve on GitHub](https://img.shields.io/github/stars/ILoveBrains/openclaw-nerve?style=for-the-badge&logo=github&label=Star%20Fork%20on%20GitHub&color=0f172a)](https://github.com/ILoveBrains/openclaw-nerve)
[![MIT License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

</div>

```bash
curl -fsSL https://raw.githubusercontent.com/ILoveBrains/openclaw-nerve/theme-overhaul/install.sh | bash
```
> *Run the installer, live in 60 seconds*

---

## What's in this fork

This branch (`theme-overhaul`) contains significant UI and UX enhancements built on top of upstream Nerve. The two main feature areas are:

### 🎨 Theme Overhaul

A rebuilt, full-featured theme system with a visual editor and third-party theme import.

| Feature | Description |
|---|---|
| **Full-size Theme Editor** | Replaces the cramped bottom dock with a slide-in overlay panel, live preview of colors, typography, and components |
| **Tweakcn Import** | Paste a theme ID or raw JSON from [tweakcn.com](https://tweakcn.com) to import shadcn/ui themes directly |
| **CSS Variable Normalization** | All themes use `--color-*` prefixed variables for consistency with shadcn/ui and Control UI |
| **14 Built-in Themes** | Including new additions like `midnight`, `solarized`, `dracula`, `catppuccin`, `nord`, `rose-pine` |
| **7 Layout Templates** | Dense, spacious, comfortable, compact, relaxed, minimal, and roomy spacing presets |
| **Import / Export** | Save themes as JSON and share them across installs |

📖 [Theme System Documentation](docs/THEMES.md)

### 🗂️ Deck Mode

Multi-column chat layout for simultaneous, independent sessions side-by-side.

| Feature | Description |
|---|---|
| **Up to 6 Columns** | Chat with multiple agents or sessions at the same time |
| **Independent Context** | Each column has its own `ChatProvider`, session, messages, and input — no shared state |
| **Persistent Layout** | Deck configuration saves to `localStorage` and restores on reload |
| **Resizable Columns** | Drag gutters to adjust column widths; equalize with one click |
| **Sidebar Integration** | Click an agent in the sidebar to toggle it in/out of the deck |
| **Session Scoping** | `SessionScope` wraps each column so `currentSession` is isolated per column |

📖 [Deck Mode Documentation](docs/DECK_MODE.md)

### 📚 New & Updated Documentation

| Document | What's inside |
|---|---|
| [`docs/THEMES.md`](docs/THEMES.md) | Full theme system reference: CSS vars, schema, built-in themes, layout templates, visual editor, import/export |
| [`docs/DECK_MODE.md`](docs/DECK_MODE.md) | Deck mode architecture, column lifecycle, resize behavior, data flow, and sidebar wiring |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Updated with DeckContext, ThemeEditorPanel, theme system libraries, and deck mode components |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md) | Corrected file paths, added missing source files, updated deck layer and layout template descriptions |

---

## Why Nerve exists

Chat is great for talking to agents.
It is not enough for operating them.

The moment you care about visibility, control and coordination over your agents, the thread gets too small. You want the workspace, sessions, taskboard, editor, usage, and agent context in one place.

*Nerve is that place.*

### Why it feels different

- **Fleet control, not just chat** — Run multiple agents from one place. Each agent can have its own workspace, subagents, memory, identity, soul, and skills, while Nerve gives you a single control plane to switch context, inspect state, and operate the whole fleet.
- **Voice that feels built in** — Push-to-talk, wake word flows, explicit language selection, local Whisper transcription, multilingual stop and cancel phrases, and multiple TTS providers.
- **Full agent operating context** — Inspect, edit, and manage agent context live, without guessing what an agent knows, where it works, or how it is configured.
- **A real operating layer** — Crons, session trees, kanban workflows, review loops, proposal inboxes, and model overrides.
- **Rich live output** — Charts, diffs, previews, syntax-highlighted code, structured tool rendering, and streaming UI.

---

## Get started

### One command

```bash
curl -fsSL https://raw.githubusercontent.com/ILoveBrains/openclaw-nerve/theme-overhaul/install.sh | bash
```

### Pick your setup

- **[Local](docs/DEPLOYMENT-A.md)** — Run Nerve and Gateway on one machine. *Recommended default.*
- **[Hybrid](docs/DEPLOYMENT-B.md)** — Keep Nerve local, run Gateway in the cloud
- **[Cloud](docs/DEPLOYMENT-C.md)** — Run Nerve and Gateway in the cloud

<details><summary><strong>Manual install (this fork)</strong></summary>

```bash
git clone -b theme-overhaul https://github.com/ILoveBrains/openclaw-nerve.git
cd openclaw-nerve
npm install
npm run setup
npm run prod
```

</details>

<details><summary><strong>Updating</strong></summary>

```bash
npm run update -- --yes
```

Fetches the latest release, rebuilds, restarts, verifies health, and rolls back automatically on failure.

</details>

<details><summary><strong>Development</strong></summary>

```bash
npm run dev          # frontend — Vite on :3080 by default
PORT=3081 npm run dev:server  # backend — explicit split-port dev setup
```

**Requires:** Node.js 22+ and an OpenClaw gateway.

</details>

---

## How it fits into OpenClaw

```text
Browser ─── Nerve (:3080) ─── OpenClaw Gateway (:18789)
 │           │
 ├─ WS ──────┤ proxied to gateway
 ├─ SSE ─────┤ file watchers, real-time sync
 └─ REST ────┘ files, memories, TTS, models
```

**Frontend:** React 19 · Tailwind CSS 4 · shadcn/ui · Vite 7  
**Backend:** Hono 4 on Node.js

---

## Security

Nerve binds to `127.0.0.1` by default. When exposed (`HOST=0.0.0.0`), built-in password authentication protects the UI and its endpoints. See **[docs/SECURITY.md](docs/SECURITY.md)** for the full threat model.

---

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — codebase structure and system design
- **[Configuration](docs/CONFIGURATION.md)** — `.env` variables and setup behavior
- **[Deployment Guides](docs/README.md)** — local, hybrid, and cloud setups
- **[Theme System](docs/THEMES.md)** — 🆕 comprehensive theme system documentation
- **[Deck Mode](docs/DECK_MODE.md)** — 🆕 multi-column chat layout documentation
- **[Agent Markers](docs/AGENT-MARKERS.md)** — TTS, charts, kanban markers, and rich UI output
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** — common issues and fixes
- **[Tailscale Guide](docs/TAILSCALE.md)** — private remote access via tailnet
- **[Contributing](CONTRIBUTING.md)** — development workflow and pull requests
- **[Changelog](CHANGELOG.md)** — release notes and shipped changes

---

## License

[MIT](LICENSE)
