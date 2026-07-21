# Devpost submission — Aegis-OS

## Project title

Aegis-OS

## Tagline

The realtime multimodal inspection OS that sees faults, guides corrections, takes approved action, and verifies the result.

## Category

Work & Productivity

## Problem

Electronics inspection happens while technicians are holding assemblies, moving probes, and cross-checking procedures. Visible faults can be missed, manuals and incident tools interrupt the job, and the before/after evidence often disappears. That creates rework, slow escalation, and reports that cannot show why a decision was made.

## Solution

Aegis-OS closes the loop. A technician speaks naturally while a live camera stays local. When inspection is requested, the app selects an actual frame and GPT-5.6 returns a strict evidence and spatial contract. Aegis overlays the visible issue, gives one concise correction, requires approval for an incident, executes the approved action, examines a newer frame, and preserves the timeline in a checksummed PDF report.

## Differentiation

This is not image description inside chat. The primary interface is a live viewport with voice, grounded overlays, structured findings, procedure state, exact action confirmation, correction verification, and audit evidence. The model cannot emit arbitrary UI or authorize consequential action.

## OpenAI usage

`gpt-realtime-2.1` connects through browser WebRTC and server-mediated `/v1/realtime/calls`. It handles low-latency voice, interruption, short guidance, and a schema-bound `request_precision_analysis` function. `gpt-5.6` receives selected high-detail images through the Responses API and returns strict Structured Outputs: scene usability, findings, confidence, evidence, 0–1000 spatial anchors, procedure assessment, and spoken summary. Independent Zod validation enforces bounds and evidence before UI or persistence changes. A newer frame performs correction verification.

## Codex usage

The primary Codex project task began with an empty workspace. Codex translated the human product brief into the Next.js architecture, built the Realtime bridge and GPT-5.6 inspection adapter, designed the stateful workspace, implemented spatial transforms and authorization, generated the PDF, created original test targets, wrote contract/security/workflow tests, diagnosed setup issues, and produced the judge and submission package. The human chose the mission, target users, electronics scenario, model strategy, approval boundary, design direction, and feature priority.

## Impact

Aegis-OS is designed for electronics technicians, field-service teams, hardware labs, maintenance operations, and technical QA groups that need hands-free guidance and defensible evidence—not speculative measurement or medical advice.

## What was built during Build Week

The repository was empty at the start of the recorded 22 July 2026 Codex task. The full code and documentation in version 0.1.0 were built in this task. There is no invented earlier history; see `BUILD_WEEK_DEVELOPMENT_RECORD.md`.

## Testing link and instructions

Hosted testing link: **not yet assigned; deployment is a required owner action before submission.** Follow `JUDGE_TESTING_INSTRUCTIONS.md` after deployment.

## Repository

Repository URL: **not yet assigned; publish this repository before submission.**

## Video

Demo URL: **not yet recorded.** Use the exact 2:48 script in `DEMO_SCRIPT.md`.

## Codex Session ID

Primary `/feedback` Session ID: **not yet generated; run `/feedback` in the original project task and add the returned ID.**

