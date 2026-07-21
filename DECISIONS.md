# Decisions

1. **One reliable vertical slice.** Electronics pre-power visual inspection is the only complete domain path; breadth was cut before core reliability.
2. **Two loops, one authority boundary.** Realtime handles conversation and intent; GPT-5.6 Responses produces physical findings; Zod and policy code are final authorities.
3. **Real frame selection, not video claims.** Live media stays in the browser and only a user- or tool-triggered JPEG is submitted.
4. **Browser-local MVP persistence.** This makes the single-device judge journey work without inventing database credentials. PostgreSQL/RLS is explicitly required for multi-device production.
5. **Internal incident always works.** External webhook delivery is optional, signed, idempotency-keyed, timed out, and honestly labeled when unconfigured.
6. **Exact action confirmation.** The signed token binds organization, session, finding, title, description, severity, expiry, and nonce.
7. **Generated owned targets.** A before/after board pair provides reproducible safe evidence without copyrighted material.

