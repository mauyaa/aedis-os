# Changelog

## Unreleased

### Security

- Upgraded Next.js and `eslint-config-next` from 16.2.11 to 16.3.8, closing three critical and one high advisory, including SSRF in image optimization ([GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4)).
- Upgraded `sharp` to 0.35.5 for the librsvg vulnerability ([GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w)).
- Pinned patched transitive versions of `postcss` (8.5.31), `nanoid` (3.3.18) and `source-map-js` (1.2.2) through `pnpm.overrides`.
- `pnpm audit:ci` is green again; every other release gate passes unchanged.

### Maintenance

- Added weekly grouped Dependabot updates for npm and GitHub Actions so new advisories surface as a reviewable pull request instead of a red `main`.

## 0.2.0 — 2026-07-22

- Added the real decoded-pixel Local Spatial Engine and versioned J2 inspection pack.
- Added scene rejection, reference/ROI distances, explicit verification outcomes, and truthful engine metadata.
- Added Browser Voice Commands, exact action binding, trusted report identity, and request throttles.
- Preserved optional OpenAI Responses and Realtime adapters behind an explicit disabled-by-default gate.
- Replaced the state-only E2E claim with desktop/mobile Playwright and added the no-credit release gate.
- Added eight-case local evaluation, CI, Codex contribution evidence, and audited submission copy.

## 0.1.0 — 2026-07-22

- Built the initial Aegis-OS electronics inspection vertical slice, strict contracts, media workspace, optional OpenAI adapters, overlays, incidents, reports, history, owned assets, and deployment.
