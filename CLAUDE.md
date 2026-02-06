# ContentFlow - Claude Code Instructions

## Project
SEO content generation platform (Netlify Functions + Supabase + vanilla JS frontend).
- **Backend:** `netlify/functions/api.js`
- **Frontend:** `index.html` (root, git-tracked) + `public/index.html` (deploy copy, gitignored)
- **Important:** Both `index.html` files must be kept in sync. `public/` is gitignored — always apply changes to root `index.html` for commits.

## Session Continuity — MANDATORY

**After every commit or major completed task, update `CURRENT_STATUS.md`:**

1. Update the `Last Updated` date and `Current Session` summary at the top
2. Update the `LATEST SESSION` section with:
   - What was built/changed (feature name, bug fix, etc.)
   - Files modified and what changed in each
   - Git commit hash(es)
   - Next steps / what's left to do
3. Move the previous "LATEST SESSION" down to "PREVIOUS SESSION" if starting a new day

**On session start, read `CURRENT_STATUS.md` first** to recover context from prior sessions.

## Key Files for Context Recovery
- **Primary:** `CURRENT_STATUS.md` — full development state
- **Secondary:** `SESSION_LOG.md` — session history
- **Tertiary:** `git log --oneline -20` — recent commits
