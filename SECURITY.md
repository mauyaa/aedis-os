# Security and privacy

Report vulnerabilities privately to the repository owner; do not include credentials or private evidence in public issues.

## Implemented controls

- OpenAI and webhook credentials are read only in Node route handlers.
- Signed expiring sessions scope requests to an organization ID.
- Strict Zod schemas reject oversized, unknown, or malformed inputs.
- Action tokens bind exact arguments, organization, expiry, and a single-use nonce.
- External delivery uses HMAC-SHA256, a destination timeout, and idempotency key.
- CSP, clickjacking protection, MIME sniffing protection, referrer policy, and camera/microphone permissions policy are set.
- Continuous video and raw audio are neither uploaded nor stored; image capture is explicit.
- Production refuses to sign sessions without `SESSION_SECRET`; live AI has no mock fallback.

## Release gate

Before hosting, use a 32+ random-character session secret, configure HTTPS, restrict deployment access, verify the separate webhook receiver signature, scan `.next/static` for `sk-`, `OPENAI_API_KEY`, service-role patterns, and rotate any exposed value. Review dependency audit output and configure a server database with organization RLS for multi-device use.

