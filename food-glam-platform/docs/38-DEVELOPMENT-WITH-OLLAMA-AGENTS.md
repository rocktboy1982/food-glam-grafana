# Developing this project with Ollama + an Agent

This repo is specification-heavy. The fastest way to turn it into code is:
1) run a **local model** via Ollama
2) connect an **agentic coding tool** (VS Code plugin or CLI)
3) feed it the specs in small chunks (module-by-module)
4) keep a tight loop: implement → run → verify

---

## 0) Recommended approach (simple + reliable)

- Use **Ollama** to host a local coding model.
- Use **Continue** (VS Code extension) OR **Aider** (CLI) as the “agent” that edits files.
- Start by scaffolding the Next.js app, then implement modules in the same order as your architecture build order.

Why this works well here:
- Your specs are already modular.
- Agents perform best with small, well-scoped tasks.

---

## 1) Install Ollama (Windows)

1) Install Ollama for Windows from the official site.
2) In a terminal, verify:
   - `ollama --version`

Pull a model (pick one):
- `ollama pull qwen2.5-coder:7b`
- `ollama pull deepseek-coder-v2:16b`
- `ollama pull llama3.1:8b`

Run a quick check:
- `ollama run qwen2.5-coder:7b "Say hello"`

Notes:
- Bigger models usually code better but need more VRAM/RAM.
- If you see slow responses, use a smaller model.

---

## 2) Option A (recommended): Continue.dev agent in VS Code

### Install
- Install the VS Code extension: **Continue**.

### Configure Continue to use Ollama
In Continue settings/config, set the model provider to Ollama.
Typical values:
- Base URL: `http://localhost:11434`
- Model: `qwen2.5-coder:7b` (or whatever you pulled)

Then:
- Open this repo folder in VS Code.
- Use Continue Chat.

### How to give it the specs
In chat, explicitly point it to the docs it must follow.
Example prompt:

"Implement the Next.js app skeleton per docs. Follow these specs: docs/00-ARCHITECTURE.md, docs/33-UX-SIMPLICITY-APPLE-LIKE.md, docs/90-SUPABASE-SCHEMA.md. Create routes and placeholders only; do not implement Health Mode yet. After changes, run typecheck and lint."

Keep tasks small:
- one module per prompt
- one or two files at a time when possible

---

## 3) Option B: Aider agent (CLI) + Ollama

Aider can act like a file-editing agent from the terminal.

### Install
- `python -m pip install aider-chat`

### Run with Ollama
Example (varies by aider version):
- `aider --model ollama/qwen2.5-coder:7b`

Add the key spec files to the context:
- `aider README.md docs/00-ARCHITECTURE.md docs/90-SUPABASE-SCHEMA.md`

Then ask for incremental changes:
- "Scaffold Next.js App Router structure and a landing page per docs/33."

---

## 4) How to structure the work (agent-friendly)

### Step 1: Scaffold the app
Ask the agent to:
- create a Next.js (App Router) project
- set up Tailwind + shadcn/ui
- add basic layout, nav (Explore/Search/Plan/Cookbook/Me)

### Step 2: Add Supabase integration
- env vars
- server client + browser client
- auth setup (Google first; Apple optional)

### Step 3: Implement “food-first” MVP modules in order
Follow your build order from the architecture doc.
Good early wins:
- Approaches + Explore
- Posts read pages
- Voting + Trending lists
- Search + Similar recipes
- Recipe detail + Print + Cook Mode
- Collections + Shopping Lists + Shares

### Step 4: Only then add moderation + sanctions
Moderation is cross-cutting; implement once core tables exist.

---

## 5) A practical prompting pattern (copy/paste)

Use this template for each module:

1) Context:
- "You are implementing Module X."
- "Specs: <list 2–4 docs>"

2) Constraints:
- "Keep Apple-like simplicity."
- "External-first links only; do not proxy external URLs."
- "No substitutions/unit conversions."

3) Deliverables:
- "Add routes: …"
- "Add DB migrations or SQL file: …"
- "Add minimal UI: …"

4) Verification:
- "Run lint + typecheck."
- "List manual test steps."

---

## 6) Guardrails (avoid agent mistakes)

- Never let the agent invent schema fields that contradict the docs.
- Require it to update docs when it introduces a new table/field.
- Keep secrets out of prompts.
- Prefer server-side checks for permissions; use RLS for enforcement.

---

## 7) Suggested local dev commands (once code exists)

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`

(Choose npm/yarn/pnpm and standardize early.)
