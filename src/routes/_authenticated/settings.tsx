import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getModelStatus } from "@/lib/astra/status.functions";
import { supabase } from "@/integrations/supabase/client";
import { MobileMenuButton } from "@/components/astra/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Astra" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fetchStatus = useServerFn(getModelStatus);
  const { data, isFetching, refetch } = useQuery({ queryKey: ["model-status"], queryFn: () => fetchStatus() });
  const { data: usage } = useQuery({
    queryKey: ["usage-today"],
    queryFn: async () => {
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      const { data } = await supabase.from("usage_events").select("units, input_tokens, output_tokens").gte("created_at", since.toISOString());
      return (data ?? []).reduce(
        (a, r) => ({ units: a.units + Number(r.units), tokens: a.tokens + r.input_tokens + r.output_tokens, n: a.n + 1 }),
        { units: 0, tokens: 0, n: 0 },
      );
    },
  });
  const { data: tools } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => (await supabase.from("tools").select("*").order("sort_order")).data ?? [],
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"), []);
  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("astra-theme", t);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 items-center px-3 md:hidden"><MobileMenuButton /></header>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-14">
        <h1 className="font-display text-4xl">Settings</h1>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="label-mono">Model server</h2>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} /> Check
            </Button>
          </div>
          <div className="mt-2 divide-y rounded-lg border">
            {data?.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn("size-2 rounded-full", m.reachable ? "bg-success" : m.configured ? "bg-destructive" : "bg-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.detail}
                    {m.modelName ? ` · ${m.modelName}` : ""}
                  </div>
                </div>
              </div>
            ))}
            {!data && <div className="px-4 py-3 text-sm text-muted-foreground">Checking…</div>}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Astra talks to your own server (Ollama, llama.cpp, vLLM, or any OpenAI-compatible endpoint). It must be reachable from the internet.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="label-mono">Usage today</h2>
          <div className="mt-2 rounded-lg border p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl">{(usage?.units ?? 0).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/ 500 units</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-star" style={{ width: `${Math.min(100, ((usage?.units ?? 0) / 500) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {usage?.n ?? 0} replies · {(usage?.tokens ?? 0).toLocaleString()} tokens. Units = tokens ÷ 1000 × model × reasoning multiplier. Resets at midnight UTC.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="label-mono">Tools</h2>
          <div className="mt-2 divide-y rounded-lg border">
            {tools?.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn("size-2 rounded-full", t.enabled ? "bg-success" : "bg-muted-foreground")} />
                <div className="flex-1">
                  <div className="text-sm">{t.display_name}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="label-mono">Appearance</h2>
          <div className="mt-2 inline-flex rounded-md border p-0.5">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => applyTheme(t)} className={cn("rounded px-4 py-1.5 text-sm capitalize", theme === t ? "bg-accent text-foreground" : "text-muted-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
