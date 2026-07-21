"use client";
/* eslint-disable @next/next/no-img-element -- blob-backed evidence must preserve original pixels */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Camera, Check, CheckCircle2, ChevronRight, CircleDot, FileDown, History, ImagePlus, LoaderCircle, LogOut, Mic, MicOff, RefreshCw, ScanLine, ShieldCheck, Siren, Square, Upload, Video, VideoOff, X } from "lucide-react";
import { clsx } from "clsx";
import type { Finding, InspectionResult } from "@/lib/contracts";
import { calculateVideoTransform, mapNormalizedBox } from "@/lib/spatial";

type Identity = { token: string; user: { id: string; email: string }; organization: { id: string; name: string } };
type EventItem = { id: string; at: string; label: string; tone?: "ok" | "warn" | "info" };
type Incident = { id: string; title: string; createdAt: string; externalReference?: string; deliveryStatus: string };
type Session = { id: string; startedAt: string; completedAt: string | null; findings: Finding[]; events: EventItem[]; incidents: Incident[]; step: number; sourceName: string };
type SystemState = "ready" | "connecting" | "listening" | "speaking" | "capturing" | "analyzing" | "finding" | "verifying" | "failed" | "complete";

const steps = ["Workspace ready", "Visual orientation", "Connection check", "Corrective verification", "Evidence & sign-off"];
const storageKey = "aegis-os-state-v1";
const nowEvent = (label: string, tone: EventItem["tone"] = "info"): EventItem => ({ id: crypto.randomUUID(), at: new Date().toISOString(), label, tone });
const freshSession = (): Session => ({ id: crypto.randomUUID(), startedAt: new Date().toISOString(), completedAt: null, findings: [], events: [nowEvent("Inspection workspace opened")], incidents: [], step: 1, sourceName: "No visual source" });

export function InspectionWorkspace() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [session, setSession] = useState<Session>(() => freshSession());
  const [history, setHistory] = useState<Session[]>([]);
  const [systemState, setSystemState] = useState<SystemState>("ready");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [sourceSize, setSourceSize] = useState({ width: 1600, height: 1000 });
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [levels, setLevels] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [proposal, setProposal] = useState<{ token: string; finding: Finding } | null>(null);
  const [panel, setPanel] = useState<"finding" | "timeline" | "history">("finding");
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<{ pc: RTCPeerConnection; dc: RTCDataChannel; audio: HTMLAudioElement } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { try { const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as { identity?: Identity; history?: Session[]; active?: Session } | null; if (stored?.identity) setIdentity(stored.identity); if (stored?.history) setHistory(stored.history); if (stored?.active) setSession(stored.active); } catch { /* corrupted local cache is non-authoritative */ } }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (identity) localStorage.setItem(storageKey, JSON.stringify({ identity, history, active: session })); }, [identity, history, session]);
  useEffect(() => { const element = viewportRef.current; if (!element) return; const observer = new ResizeObserver(([entry]) => setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(element); return () => observer.disconnect(); }, []);
  useEffect(() => () => { stream?.getTracks().forEach((track) => track.stop()); realtimeRef.current?.pc.close(); if (uploadedUrl?.startsWith("blob:")) URL.revokeObjectURL(uploadedUrl); }, [stream, uploadedUrl]);

  const addEvent = useCallback((label: string, tone: EventItem["tone"] = "info") => setSession((value) => ({ ...value, events: [...value.events, nowEvent(label, tone)] })), []);
  const activeFinding = session.findings.find((finding) => finding.status === "unverified") || session.findings.at(-1);
  const transform = useMemo(() => calculateVideoTransform(sourceSize.width, sourceSize.height, Math.max(1, viewportSize.width), Math.max(1, viewportSize.height), "contain", false), [sourceSize, viewportSize]);

  async function signIn(email: string, workspace: string) {
    setError(null); const response = await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, workspace }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setIdentity(data); addEvent(`Signed in to ${data.organization.name}`, "ok");
  }

  async function connectCamera() {
    setError(null); setSystemState("connecting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stream?.getTracks().forEach((track) => track.stop()); setStream(media); setUploadedUrl(null);
      if (videoRef.current) videoRef.current.srcObject = media;
      const track = media.getVideoTracks()[0]; const settings = track.getSettings(); setSourceSize({ width: settings.width || 1920, height: settings.height || 1080 });
      setSession((value) => ({ ...value, sourceName: track.label || "Live camera" })); addEvent("Live camera connected", "ok"); setSystemState("ready");
    } catch (cause) { setSystemState("failed"); setError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access or upload a judge-kit image." : "No camera is available. Upload an image to continue."); addEvent("Camera connection failed", "warn"); }
  }

  function selectImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("Select a PNG, JPEG, or WebP image."); return; }
    if (file.size > 10_000_000) { setError("Image must be smaller than 10 MB."); return; }
    if (uploadedUrl?.startsWith("blob:")) URL.revokeObjectURL(uploadedUrl); stream?.getTracks().forEach((track) => track.stop()); setStream(null);
    const url = URL.createObjectURL(file); setUploadedUrl(url); setSession((value) => ({ ...value, sourceName: file.name })); setError(null); addEvent(`Evidence source selected: ${file.name}`, "ok");
  }
  async function selectSample(path: string, name: string) { const response = await fetch(path); if (!response.ok) { setError("Judge-kit image could not be loaded."); return; } selectImage(new File([await response.blob()], name, { type: "image/png" })); }

  const captureFrame = useCallback(async () => {
    const canvas = document.createElement("canvas"); let width = 0; let height = 0;
    if (stream && videoRef.current?.videoWidth) { width = videoRef.current.videoWidth; height = videoRef.current.videoHeight; canvas.width = width; canvas.height = height; canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, width, height); }
    else if (uploadedUrl && imageRef.current?.naturalWidth) { width = imageRef.current.naturalWidth; height = imageRef.current.naturalHeight; canvas.width = width; canvas.height = height; canvas.getContext("2d")?.drawImage(imageRef.current, 0, 0, width, height); }
    else throw new Error("Connect a camera or upload an inspection image first.");
    setSourceSize({ width, height }); return { dataUrl: canvas.toDataURL("image/jpeg", .9), width, height };
  }, [stream, uploadedUrl]);

  const analyze = useCallback(async (intent: "inspection" | "verification" = "inspection") => {
    if (!identity) return; abortRef.current?.abort(); const controller = new AbortController(); abortRef.current = controller; setError(null); setSystemState(intent === "verification" ? "verifying" : "capturing");
    try {
      const frame = await captureFrame(); const frameId = crypto.randomUUID(); const requestId = crypto.randomUUID(); addEvent(`Captured ${intent} frame ${frameId.slice(0, 8)}`, "ok"); setSystemState(intent === "verification" ? "verifying" : "analyzing");
      const response = await fetch("/api/analysis", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${identity.token}` }, signal: controller.signal, body: JSON.stringify({ sessionId: session.id, requestId, frameId, imageDataUrl: frame.dataUrl, width: frame.width, height: frame.height, intent, currentStepId: `step-${session.step}`, previousFindings: session.findings.map((finding) => ({ temporaryId: finding.temporaryId, category: finding.category, severity: finding.severity, title: finding.title, description: finding.description, confidence: finding.confidence, evidence: finding.evidence, sourceFrameIds: finding.sourceFrameIds, spatialAnchors: finding.spatialAnchors, recommendedAction: finding.recommendedAction, verificationMethod: finding.verificationMethod, requiresHumanVerification: finding.requiresHumanVerification, safetySensitive: finding.safetySensitive })) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Analysis failed"); const result = data.result as InspectionResult;
      if (!result.sceneQuality.usable) { setSystemState("failed"); setError(result.sceneQuality.recaptureInstruction || "The image is not usable. Reposition the camera and try again."); addEvent(`Frame rejected: ${result.sceneQuality.issues.join(", ")}`, "warn"); return; }
      setSession((value) => {
        const resolved = intent === "verification" && result.findings.length === 0 ? value.findings.map((finding) => finding.status === "unverified" ? { ...finding, status: "resolved" as const } : finding) : value.findings;
        const incoming: Finding[] = result.findings.map((finding) => ({ ...finding, id: crypto.randomUUID(), status: "unverified", createdAt: new Date().toISOString() }));
        const event = nowEvent(intent === "verification" && incoming.length === 0 ? "Correction verified on newer visual evidence" : `${incoming.length} structured finding(s) applied`, incoming.length ? "warn" : "ok");
        return { ...value, findings: [...resolved, ...incoming], events: [...value.events, event], step: intent === "verification" && incoming.length === 0 ? 4 : Math.max(value.step, result.procedureAssessment.status === "failed" ? 2 : 3) };
      });
      setSystemState(result.findings.length ? "finding" : "ready"); setPanel("finding");
      if (result.shouldSpeakImmediately && "speechSynthesis" in window && !voiceConnected) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(result.spokenSummary)); }
    } catch (cause) { if (cause instanceof DOMException && cause.name === "AbortError") return; setSystemState("failed"); const message = cause instanceof Error ? cause.message : "Analysis failed"; setError(message); addEvent(`Analysis failed: ${message}`, "warn"); }
  }, [identity, session.id, session.step, session.findings, voiceConnected, addEvent, captureFrame]);

  async function connectVoice() {
    if (!identity || voiceConnected) return; setError(null); setSystemState("connecting");
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      const pc = new RTCPeerConnection(); mic.getTracks().forEach((track) => pc.addTrack(track, mic));
      const audio = new Audio(); audio.autoplay = true; pc.ontrack = (event) => { audio.srcObject = event.streams[0]; setSystemState("speaking"); };
      const dc = pc.createDataChannel("oai-events"); dc.onopen = () => { setVoiceConnected(true); setSystemState("listening"); addEvent("Realtime voice connected", "ok"); };
      dc.onmessage = (event) => { try { const message = JSON.parse(event.data); if (message.type === "response.function_call_arguments.done" && message.name === "request_precision_analysis") { const args = JSON.parse(message.arguments || "{}"); void analyze(args.intent === "verification" ? "verification" : "inspection"); } if (message.type === "input_audio_buffer.speech_started") setSystemState("listening"); if (message.type === "response.audio.delta") setSystemState("speaking"); if (message.type === "response.done") setSystemState("listening"); } catch { /* ignore unknown realtime events */ } };
      pc.onconnectionstatechange = () => { if (["failed", "disconnected", "closed"].includes(pc.connectionState)) { setVoiceConnected(false); setSystemState("failed"); setError("Realtime voice disconnected. Reconnect when ready."); } };
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const response = await fetch("/api/realtime", { method: "POST", headers: { "content-type": "application/sdp", authorization: `Bearer ${identity.token}` }, body: offer.sdp }); const answer = await response.text(); if (!response.ok) { let detail = answer; try { detail = JSON.parse(answer).error; } catch {} throw new Error(detail); }
      await pc.setRemoteDescription({ type: "answer", sdp: answer }); realtimeRef.current = { pc, dc, audio };
      const context = new AudioContext(); const analyser = context.createAnalyser(); const source = context.createMediaStreamSource(mic); source.connect(analyser); const values = new Uint8Array(analyser.frequencyBinCount); const draw = () => { if (pc.connectionState === "closed") { void context.close(); return; } analyser.getByteFrequencyData(values); const chunk = Math.max(1, Math.floor(values.length / 8)); setLevels(Array.from({ length: 8 }, (_, i) => values.slice(i * chunk, (i + 1) * chunk).reduce((a, b) => a + b, 0) / chunk / 255)); requestAnimationFrame(draw); }; draw();
    } catch (cause) { setSystemState("failed"); const message = cause instanceof Error ? cause.message : "Voice connection failed"; setError(message); addEvent(`Realtime voice failed: ${message}`, "warn"); }
  }

  function toggleMute() { const sender = realtimeRef.current?.pc.getSenders().find((item) => item.track?.kind === "audio"); if (!sender?.track) return; sender.track.enabled = muted; setMuted(!muted); if (!muted) setLevels(levels.map(() => 0)); }
  function disconnectVoice() { realtimeRef.current?.pc.getSenders().forEach((sender) => sender.track?.stop()); realtimeRef.current?.pc.close(); realtimeRef.current = null; setVoiceConnected(false); setSystemState("ready"); setLevels(levels.map(() => 0)); addEvent("Realtime voice disconnected"); }

  async function proposeIncident(finding: Finding) {
    if (!identity) return; setError(null); const response = await fetch("/api/actions/propose", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${identity.token}` }, body: JSON.stringify({ sessionId: session.id, findingId: finding.id, title: finding.title, description: finding.description, severity: finding.severity }) }); const data = await response.json(); if (!response.ok) { setError(data.error); return; } setProposal({ token: data.confirmationToken, finding }); addEvent("Incident action awaiting explicit approval", "warn");
  }
  async function confirmIncident() {
    if (!identity || !proposal) return; setSystemState("analyzing"); const response = await fetch("/api/actions/execute", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${identity.token}` }, body: JSON.stringify({ confirmationToken: proposal.token, decision: "approved" }) }); const data = await response.json(); if (!response.ok) { setError(data.error); setSystemState("failed"); return; }
    const incident: Incident = { id: data.incident.id, title: data.incident.title, createdAt: data.incident.createdAt, deliveryStatus: data.delivery.status, externalReference: data.delivery.reference };
    setSession((value) => ({ ...value, incidents: [...value.incidents, incident], events: [...value.events, nowEvent(`Incident ${incident.id} created${incident.deliveryStatus === "delivered" ? `; external delivery ${incident.externalReference}` : "; external integration not configured"}`, "ok")] })); setProposal(null); setSystemState("ready");
  }

  function completeInspection() { const completed = { ...session, completedAt: new Date().toISOString(), step: 4, events: [...session.events, nowEvent("Inspection completed and locked for reporting", "ok")] }; setSession(completed); setHistory((items) => [completed, ...items.filter((item) => item.id !== completed.id)]); setSystemState("complete"); }
  async function downloadReport() {
    if (!identity) return; const response = await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${identity.token}` }, body: JSON.stringify({ sessionId: session.id, workspace: identity.organization.name, inspector: identity.user.email, startedAt: session.startedAt, completedAt: session.completedAt, findings: session.findings.map(({ title, severity, status, confidence, description }) => ({ title, severity, status, confidence, description })), incidents: session.incidents.map((item) => ({ id: item.id, title: item.title, externalReference: item.externalReference })), events: session.events.map(({ at, label }) => ({ at, label })) }) });
    if (!response.ok) { const data = await response.json(); setError(data.error); return; } const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `aegis-${session.id.slice(0, 8)}.pdf`; anchor.click(); URL.revokeObjectURL(url); addEvent(`PDF report generated; SHA-256 ${response.headers.get("x-aegis-sha256")?.slice(0, 12)}…`, "ok");
  }

  if (!identity) return <SignIn onSubmit={signIn} error={error} />;
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>AEGIS<span className="brand-muted">/OS</span></span><span className="workspace-chip">{identity.organization.name}</span></div>
        <div className="topbar-status"><span className={clsx("status-dot", (systemState === "failed") && "danger", ["analyzing", "verifying", "capturing", "connecting"].includes(systemState) && "busy")} />{stateLabel(systemState)}<span className="session-code">{session.id.slice(0, 8)}</span></div>
        <button className="icon-button" aria-label="Sign out" onClick={() => { localStorage.removeItem(storageKey); setIdentity(null); }}><LogOut size={17} /></button>
      </header>

      <section className="workspace-grid">
        <div className="stage-column">
          <div className="instruction-row"><div><span className="eyebrow">Current instruction</span><h1>{activeFinding?.status === "unverified" ? activeFinding.recommendedAction : session.completedAt ? "Inspection complete. Generate the signed report." : "Center the assembly and ask Aegis to inspect it."}</h1></div><span className="step-count">0{Math.min(session.step + 1, 5)} / 05</span></div>
          <div className="viewport" ref={viewportRef}>
            {stream ? <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={(event) => setSourceSize({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })} /> : uploadedUrl ? <>{/* Blob-backed evidence must preserve original pixels; Next image optimization is intentionally bypassed. */}<img ref={imageRef} src={uploadedUrl} alt="Selected inspection evidence" onLoad={(event) => setSourceSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} /></> : <EmptyViewport onCamera={connectCamera} onFile={selectImage} onSample={selectSample} />}
            {(stream || uploadedUrl) && <div className="source-label"><Video size={13} /> {stream ? "LIVE / NOT RECORDED" : "IMAGE INPUT / ANALYZED ON REQUEST"}</div>}
            <div className="overlay-layer" aria-label="Spatial findings">
              {session.findings.filter((finding) => finding.status !== "rejected").flatMap((finding) => finding.spatialAnchors.map((anchor, index) => {
                if (anchor.type !== "box") return null; const rect = mapNormalizedBox(anchor, transform);
                return <div key={`${finding.id}-${index}`} className={clsx("overlay-box", finding.status, `severity-${finding.severity}`)} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}><span>{anchor.label}</span><b>{Math.round(finding.confidence * 100)}%</b></div>;
              }))}
            </div>
            {["capturing", "analyzing", "verifying"].includes(systemState) && <div className="analysis-state"><ScanLine size={23} /><strong>{systemState === "verifying" ? "Verifying newer evidence" : systemState === "capturing" ? "Capturing best frame" : "GPT-5.6 precision analysis"}</strong><span>Strict spatial contract · no continuous video upload</span></div>}
            {error && <div className="error-banner"><AlertTriangle size={17} /><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError(null)}><X size={15} /></button></div>}
          </div>

          <div className="control-deck">
            <div className="voice-block"><button className={clsx("voice-button", voiceConnected && "active")} onClick={voiceConnected ? disconnectVoice : connectVoice}>{voiceConnected ? <Square size={17} fill="currentColor" /> : <Mic size={19} />}{voiceConnected ? "End voice" : "Start voice"}</button><button className="icon-button deck-icon" disabled={!voiceConnected} aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>{muted ? <MicOff size={18} /> : <Mic size={18} />}</button><div className="waveform" aria-label="Live microphone level">{levels.map((level, index) => <i key={index} style={{ height: `${Math.max(3, level * 26)}px` }} />)}</div><span className="voice-state">{voiceConnected ? muted ? "Muted" : systemState === "speaking" ? "Aegis speaking" : "Listening" : "Voice offline"}</span></div>
            <div className="action-buttons"><button className="secondary-button" onClick={connectCamera}><RefreshCw size={16} /> Camera</button><label className="secondary-button file-button"><Upload size={16} /> Upload<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && selectImage(event.target.files[0])} /></label><button className="primary-button" disabled={!stream && !uploadedUrl || ["analyzing", "capturing", "verifying"].includes(systemState)} onClick={() => analyze(activeFinding?.status === "unverified" ? "verification" : "inspection")}><ScanLine size={17} />{activeFinding?.status === "unverified" ? "Verify correction" : "Inspect frame"}</button></div>
          </div>
        </div>

        <aside className="side-panel">
          <nav className="tabs"><button className={panel === "finding" ? "active" : ""} onClick={() => setPanel("finding")}>Finding</button><button className={panel === "timeline" ? "active" : ""} onClick={() => setPanel("timeline")}>Timeline</button><button className={panel === "history" ? "active" : ""} onClick={() => setPanel("history")}>History</button></nav>
          {panel === "finding" && <FindingPanel finding={activeFinding} incidents={session.incidents} onIncident={proposeIncident} />}
          {panel === "timeline" && <Timeline events={session.events} />}
          {panel === "history" && <HistoryPanel sessions={history} currentId={session.id} onOpen={(item) => setSession(item)} />}
          <div className="procedure"><div className="panel-heading"><span>Procedure</span><span>{Math.round(((session.step + 1) / steps.length) * 100)}%</span></div>{steps.map((step, index) => <div className={clsx("procedure-step", index <= session.step && "done", index === session.step + 1 && "current")} key={step}>{index <= session.step ? <Check size={14} /> : <span>{index + 1}</span>}<p>{step}</p>{index === session.step + 1 && <ChevronRight size={14} />}</div>)}</div>
          <div className="report-actions">{!session.completedAt ? <button className="complete-button" onClick={completeInspection}>Complete inspection <ArrowRight size={16} /></button> : <button className="complete-button" onClick={downloadReport}><FileDown size={16} /> Download PDF report</button>}</div>
        </aside>
      </section>
      {proposal && <Confirmation proposal={proposal} onCancel={() => { setProposal(null); addEvent("Incident action rejected by user"); }} onConfirm={confirmIncident} />}
    </main>
  );
}

function stateLabel(state: SystemState) { return ({ ready: "Ready", connecting: "Connecting", listening: "Listening", speaking: "Aegis speaking", capturing: "Capturing", analyzing: "Analyzing", finding: "Finding detected", verifying: "Verifying correction", failed: "Needs attention", complete: "Inspection complete" })[state]; }

function SignIn({ onSubmit, error }: { onSubmit: (email: string, workspace: string) => Promise<void>; error: string | null }) {
  const [busy, setBusy] = useState(false);
  return <main className="signin"><div className="signin-aside"><div className="brand large"><span className="brand-mark"><ShieldCheck size={22} /></span>AEGIS<span className="brand-muted">/OS</span></div><div><span className="eyebrow accent">Realtime multimodal inspection</span><h1>See the fault.<br />Guide the correction.<br />Prove the result.</h1><p>A hands-free inspection workspace for electronics technicians and hardware teams.</p></div><div className="loop"><span>OBSERVE</span><ArrowRight /><span>LOCATE</span><ArrowRight /><span>ACT</span><ArrowRight /><span>VERIFY</span></div></div><form className="signin-card" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); try { await onSubmit(String(form.get("email")), String(form.get("workspace"))); } finally { setBusy(false); } }}><span className="eyebrow">Secure workspace</span><h2>Start an inspection</h2><p>Creates an isolated local judge workspace. Live AI calls use server credentials only.</p><label>Email<input name="email" type="email" defaultValue="judge@aegis.local" required /></label><label>Workspace<input name="workspace" defaultValue="Aegis Judge Lab" minLength={2} required /></label>{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<button className="primary-button signin-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}Enter secure workspace</button><small>Raw audio and continuous video are not stored. Evidence is captured only on request.</small></form></main>;
}

function EmptyViewport({ onCamera, onFile, onSample }: { onCamera: () => void; onFile: (file: File) => void; onSample: (path: string, name: string) => void }) { return <div className="empty-viewport"><div className="reticle"><Camera size={28} /></div><h2>No visual source</h2><p>Connect a rear camera or use an owned judge-kit image. Both paths use the same live GPT-5.6 analysis endpoint.</p><div><button className="primary-button" onClick={onCamera}><Video size={16} /> Connect camera</button><label className="secondary-button file-button"><ImagePlus size={16} /> Select image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} /></label></div><div className="sample-actions"><button onClick={() => onSample("/judge-kit/aegis-board-fault.png", "aegis-board-fault.png")}>Load fault target</button><button onClick={() => onSample("/judge-kit/aegis-board-corrected.png", "aegis-board-corrected.png")}>Load corrected target</button></div><span><VideoOff size={13} /> Continuous video is never uploaded</span></div>; }

function FindingPanel({ finding, incidents, onIncident }: { finding?: Finding; incidents: Incident[]; onIncident: (finding: Finding) => void }) {
  if (!finding) return <div className="empty-panel"><ScanLine size={24} /><h3>No analysis yet</h3><p>Capture an actual frame to start a precision inspection. A finding appears only after schema validation.</p></div>;
  return <div className="finding-panel"><div className="finding-meta"><span className={`severity-pill ${finding.severity}`}>{finding.severity}</span><span>{finding.status === "unverified" ? <><CircleDot size={13} /> Human verification required</> : <><CheckCircle2 size={13} /> {finding.status}</>}</span></div><h2>{finding.title}</h2><p>{finding.description}</p><div className="confidence"><span>Model confidence</span><b>{Math.round(finding.confidence * 100)}%</b><i><span style={{ width: `${finding.confidence * 100}%` }} /></i></div><div className="evidence-list"><span className="eyebrow">Visible evidence</span>{finding.evidence.map((item) => <div key={item}><Check size={13} />{item}</div>)}</div><div className="recommendation"><span>Next safe action</span><p>{finding.recommendedAction}</p></div><button className="incident-button" disabled={incidents.some((item) => item.title === finding.title)} onClick={() => onIncident(finding)}><Siren size={16} />{incidents.some((item) => item.title === finding.title) ? "Incident created" : "Create maintenance incident"}</button></div>;
}
function Timeline({ events }: { events: EventItem[] }) { return <div className="timeline">{[...events].reverse().map((event) => <div key={event.id}><i className={event.tone} /><span>{new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span><p>{event.label}</p></div>)}</div>; }
function HistoryPanel({ sessions, currentId, onOpen }: { sessions: Session[]; currentId: string; onOpen: (session: Session) => void }) { return <div className="history-list">{sessions.length === 0 ? <div className="empty-panel"><History size={24} /><h3>No completed sessions</h3><p>Completed inspections are preserved here for replay.</p></div> : sessions.map((item) => <button key={item.id} className={item.id === currentId ? "active" : ""} onClick={() => onOpen(item)}><span>{new Date(item.startedAt).toLocaleDateString()}</span><strong>{item.id.slice(0, 8)}</strong><small>{item.findings.length} findings · {item.incidents.length} incidents</small></button>)}</div>; }
function Confirmation({ proposal, onCancel, onConfirm }: { proposal: { finding: Finding }; onCancel: () => void; onConfirm: () => void }) { return <div className="modal-backdrop"><section className="confirmation" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className="modal-icon"><Siren size={22} /></span><span className="eyebrow">Human authorization required</span><h2 id="confirm-title">Create a maintenance incident?</h2><p>This creates an internal incident for <strong>{proposal.finding.title}</strong>. If a signed external webhook is configured, the exact same payload will also be delivered.</p><dl><div><dt>Severity</dt><dd>{proposal.finding.severity}</dd></div><div><dt>Finding</dt><dd>{proposal.finding.id.slice(0, 8)}</dd></div><div><dt>Effect</dt><dd>Internal record + configured webhook</dd></div></dl><div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Reject</button><button className="danger-button" onClick={onConfirm}><Check size={16} /> Confirm exact action</button></div></section></div>; }
