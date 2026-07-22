# Architecture overview

Aegis-OS is a Next.js App Router application with two explicit inspection engines.

`local-spatial` is the submitted production engine. The browser owns camera preview, explicit frame capture, device-native voice commands, responsive overlay mapping, and local history. A Node route owns binary validation, Sharp decoding, the versioned inspection pack, scene metrics, reference comparisons, confidence, request/frame binding, signed authorization, action confirmation, and PDF generation.

`openai-precision` is an optional adapter. It preserves the GPT-5.6 Responses strict-schema path and GPT-Realtime-2.1 SDP/function-output path, but is unavailable unless the operator explicitly sets `OPENAI_LIVE_ENABLED=true` and provides separately funded credentials.

There is no production database. Multi-device persistence would require a durable store with row-level authorization; it is not claimed by this release.
