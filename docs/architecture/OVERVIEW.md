# Architecture overview

Aegis-OS is a Next.js App Router application with a browser media/UI layer and trusted Node route handlers. The browser owns the continuous camera preview, microphone stream, frame canvas, WebRTC peer connection, overlay transform, and device-local MVP history. The server owns credentials, signed identities, session prompts, OpenAI calls, schema validation, action confirmation, outbound webhook signing, and report generation.

The judged path intentionally avoids extra services that cannot be configured truthfully in an empty repository. Production multi-device use requires PostgreSQL/Supabase RLS and durable job execution; the API contracts are ready for that replacement.

