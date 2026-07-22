# Aegis-OS — Devpost submission copy

**Category:** Work & Productivity

**Hosted project:** https://aegis-os-delta.vercel.app

**Public repository:** https://github.com/mauyaa/aedis-os

**License:** MIT

**Public YouTube video:** Not uploaded as of 2026-07-22; this is a release-blocking owner action.

**Primary Codex Session ID:** Not generated as of 2026-07-22; run `/feedback` in this exact primary task and enter the returned ID.

## Inspiration

Field technicians lose time translating verbal guidance into a precise physical location, and conventional checklists rarely preserve the evidence that proves a correction happened. Aegis-OS turns a captured frame into spatial guidance, deliberate action, and explicit newer-frame verification.

## What it does

Aegis-OS combines a working deterministic local spatial engine with an optional OpenAI precision architecture. The public judge workflow analyzes real image pixels, checks scene quality, locates a visible J2 connector fault, guides the correction, verifies a newer frame, requires approval before incident creation, and generates a checksummed report.

Its versioned inspection pack defines the reference images, scene thresholds, J2 region, fault thresholds, safe correction, and verification method. The engine measures brightness, contrast, sharpness, alignment, global similarity, and J2-region distance. It produces a normalized spatial box and refuses to change a finding when the scene or confidence is inadequate.

Device-native Browser Voice Commands provide hands-free control where Chrome supports them. Buttons remain available for every action. Core inspection continues without a cloud connection, API key, or payment.

## How we built it

The application uses Next.js 16, React 19, strict TypeScript, Zod, Sharp, pdf-lib, Vitest, and Playwright. Route handlers validate every trust boundary. The report uses the signed session’s inspector and workspace values. Incident confirmations are bound to the exact session, user, organization, action version, destination, arguments, expiry, and nonce.

GPT-5.6 was used meaningfully through the primary Codex development session to design and implement the inspection schema, coordinate transforms, verification contract, safety boundary, test suite, local spatial engine, and release audit. The optional GPT-5.6 Responses and GPT-Realtime-2.1 adapters remain in the repository but are not represented as active in the no-credit deployment.

GPT-5.6 was meaningfully used through Codex during the design,
implementation, testing, and adversarial review of Aegis-OS.
The submitted hosted judge path uses the deterministic Local Spatial
Engine because Build Week credits are Codex credits rather than API credits.
The optional GPT-5.6 Responses adapter remains implemented but is not
presented as active in the submitted deployment.

## Challenges

The hardest engineering problem was safe verification: zero new findings cannot mean every old finding is resolved. Aegis binds every outcome to one unresolved finding and one newer frame, then enforces scene quality, visible evidence, and confidence server-side. A second challenge was preserving spatial accuracy across contain, cover, crop, letterbox, and mirrored camera layouts. A third was making the scored experience reliable without pretending Build Week Codex credits were OpenAI API credits.

## Accomplishments

- Real image decoding and scene rejection for PNG, JPEG, and WebP.
- A generic, versioned inspection-pack architecture and deterministic J2 reference check.
- Normalized 0–1000 overlay mapping with responsive and mirror tests.
- Explicit `resolved`, `still_present`, and `uncertain` verification outcomes.
- Exact human confirmation before internal or configured external action.
- Checksummed, verification-aware PDF and browser-local session history.
- Genuine desktop and mobile browser E2E plus a no-credit/no-outbound-call gate.
- An eight-case reproducible local judge-kit evaluation.

## What we learned

Transparent operational state is a product capability. A local engine that declares its measurements and uncertainty is more useful than a cloud dependency that silently substitutes samples during an outage. We also learned that multimodal systems need application-side request, frame, and state-transition validation even when model output is schema-constrained.

## What’s next

Additional versioned packs, project-owned registration markers for automatic perspective rectification, durable organization storage with RLS, and live evaluation of the optional OpenAI precision path when separately funded API credits are available.

## Judge note

Use the under-three-minute procedure in `JUDGE_TESTING_INSTRUCTIONS.md`. The submitted engine is Local Spatial v1, not a fallback demo. The optional OpenAI path is disabled and makes no request during the judge journey.
