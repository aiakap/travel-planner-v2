## Rule: Documentation placement

- Keep the repository root clean: only `README.md` (and future top-level meta docs like `CONTRIBUTING.md` or `LICENSE`) belong at `/`.
- All new Markdown docs should go under `docs/`:
  - `docs/changelogs/` — feature completions, fixes, release/progress notes, and post-mortems.
  - `docs/guides/` — quick starts, READMEs, setup guides, checklists, plans, and how-tos.
  - `docs/runbooks/` — debugging steps, rollback instructions, troubleshooting notes, and testing guides.
  - Add new subsystem-specific docs alongside existing ones in `docs/` (e.g., `IMAGE_GENERATION_SYSTEM.md`).
- When adding a new area, link it from `docs/README.md` (and optionally the root `README.md` docs section) so navigation stays up to date.
- Do not reintroduce stray `*.md` files in the project root; use the folders above instead.
