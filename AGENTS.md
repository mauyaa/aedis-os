# Repository rules

- Use strict TypeScript and runtime validation at every trust boundary.
- Keep `OPENAI_API_KEY`, session secrets, and webhook secrets server-only.
- Never replace failed live AI or integration calls with a mock success.
- Production code must not enable deterministic AI mocks.
- Any external, costly, destructive, irreversible, hazardous, or safety-sensitive action requires an exact-argument confirmation token.
- Preserve the 0–1000 normalized spatial contract and test contain, cover, crop, letterbox, and mirror behavior.
- Do not store continuous video or raw audio. Evidence capture must be explicit.
- Revalidate organization access inside route handlers; proxy or client state is not authorization.
- New UI commands must be schema-bound; never execute model-generated HTML or JavaScript.
- Run lint, typecheck, unit, integration, end-to-end, build, and evaluation gates before release.
- Tests may use deterministic fixtures. Hosted judge analysis uses the real decoded-pixel Local Spatial Engine; optional GPT-5.6 is disabled unless explicitly funded and configured.
- Documentation must distinguish measured facts, configuration gaps, and future work.
