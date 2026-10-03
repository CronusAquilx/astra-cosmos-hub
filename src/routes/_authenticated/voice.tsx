import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { MobileMenuButton } from "@/components/astra/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({ meta: [{ title: "Voice — Astra" }] }),
  component: VoicePage,
});

type Line = { role: "user" | "assistant"; text: string };

function VoicePage() {
  const [token, setToken] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ""));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setToken(s?.access_token ?? ""));
    return () => data.subscription.unsubscribe();
  }, []);

  function onEvent(e: LiveEvent) {
    const role = e.type === "session.input_transcript.delta" ? "user" : e.type === "session.output_transcript.delta" ? "assistant" : null;
    if (!role || typeof e["delta"] !== "string") return;
    const delta = e["delta"] as string;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) return [...prev.slice(0, -1), { role, text: last.text + delta }];
      return [...prev, { role, text: delta }];
    });
  }

  const voice = useLiveVoice({ url: `/api/live?token=${encodeURIComponent(token)}`, onEvent });
  const idle = voice.status === "idle" || voice.status === "closed";
  const live = voice.status === "connected";

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:px-6">
        <MobileMenuButton />
        <h1 className="text-sm font-medium">Voice</h1>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        <div className="relative flex size-48 items-center justify-center">
          <div className={cn("absolute inset-0 rounded-full bg-star/20 blur-2xl transition-opacity", live ? "animate-pulse opacity-100" : "opacity-40")} />
          <div className={cn("relative size-36 rounded-full bg-gradient-to-br from-star to-star/40 shadow-[0_0_60px_-10px_var(--star)] transition-transform duration-700",
            live && !voice.muted && "scale-110 animate-pulse", voice.status === "connecting" && "animate-spin")} />
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {idle && (voice.hasConnected ? "Call ended" : "Tap to start talking with Astra")}
          {voice.status === "connecting" && "Connecting…"}
          {live && (voice.muted ? "Muted" : "Listening — just talk")}
          {voice.status === "stopping" && "Ending…"}
        </p>
        {voice.error && <p role="alert" className="max-w-md text-center text-sm text-destructive">{voice.error}</p>}
        <div className="flex items-center gap-4">
          {idle ? (
            <button onClick={() => { setLines([]); voice.start(); }} disabled={!token}
              className="flex items-center gap-2 rounded-full bg-star px-6 py-3 font-medium text-star-foreground disabled:opacity-40">
              <Mic className="size-5" /> Start talking
            </button>
          ) : (
            <>
              <button onClick={() => voice.setMuted(!voice.muted)} disabled={!live} aria-label={voice.muted ? "Unmute" : "Mute"}
                className="flex size-14 items-center justify-center rounded-full border bg-card disabled:opacity-40">
                {voice.muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>
              <button onClick={voice.stop} disabled={voice.status === "stopping"} aria-label="End call"
                className="flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                <PhoneOff className="size-5" />
              </button>
            </>
          )}
          {voice.playbackBlocked && (
            <button onClick={voice.resumePlayback} className="flex items-center gap-2 rounded-full border px-4 py-3 text-sm"><Play className="size-4" /> Play voice</button>
          )}
        </div>
        {lines.length > 0 && (
          <div className="max-h-48 w-full max-w-xl space-y-2 overflow-y-auto rounded-lg border bg-card/60 p-3 text-sm">
            {lines.map((l, i) => (
              <p key={i} className={l.role === "user" ? "text-muted-foreground" : ""}><span className="font-medium">{l.role === "user" ? "You" : "Astra"}:</span> {l.text}</p>
            ))}
            <div ref={endRef} />
          </div>
        )}
        <audio ref={voice.audioRef} className="sr-only" />
      </div>
    </div>
  );
}
