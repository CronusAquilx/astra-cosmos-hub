import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { STREAMING_SERVERS } from "@/lib/movies/tmdb";
import { useMovieDetail, useTVDetail } from "@/lib/movies/hooks";
import { useWatchHistory } from "@/lib/movies/watch-history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/movies/watch/$type/$id")({
  head: () => ({ meta: [{ title: "Watch — Astra Movies" }] }),
  component: Watch,
});

function Watch() {
  const { type, id } = Route.useParams();
  const n = Number(id);
  const isTV = type === "tv";
  const [server, setServer] = useState(STREAMING_SERVERS[0]!.id);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const movie = useMovieDetail(isTV ? 0 : n);
  const tv = useTVDetail(isTV ? n : 0);
  const d = isTV ? tv.data : movie.data;
  const history = useWatchHistory();
  const recordFn = history.record.mutate;

  useEffect(() => {
    if (d) recordFn({ tmdb_id: n, media_type: type, title: d.title || d.name, poster_path: d.poster_path ?? undefined, ...(isTV ? { season, episode } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.id, season, episode]);

  const s = STREAMING_SERVERS.find((x) => x.id === server)!;
  const seasons = tv.data?.seasons?.filter((x) => x.season_number > 0) ?? [];
  const epCount = seasons.find((x) => x.season_number === season)?.episode_count ?? 1;

  return (
    <div className="h-full overflow-y-auto">
      <header className="flex h-12 items-center gap-2 px-3">
        <Link to="/movies/title/$type/$id" params={{ type, id }} className="rounded-full p-2 hover:bg-accent"><ArrowLeft className="size-5" /></Link>
        <h1 className="truncate text-sm font-medium">{d?.title || d?.name}</h1>
      </header>
      <div className="mx-auto max-w-5xl px-3">
        <div className="aspect-video overflow-hidden rounded-lg bg-muted">
          <iframe key={`${server}-${season}-${episode}`} src={s.url(n, type, isTV ? season : undefined, isTV ? episode : undefined)} className="size-full" allowFullScreen allow="autoplay; fullscreen; encrypted-media" />
        </div>
        {isTV && seasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={season} onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
              {seasons.map((x) => <option key={x.season_number} value={x.season_number}>{x.name}</option>)}
            </select>
            <select value={episode} onChange={(e) => setEpisode(Number(e.target.value))} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
              {Array.from({ length: epCount }, (_, i) => <option key={i} value={i + 1}>Episode {i + 1}</option>)}
            </select>
          </div>
        )}
        <p className="mt-4 label-mono">Servers — try another if one doesn't load</p>
        <div className="mt-2 flex flex-wrap gap-1.5 pb-10">
          {STREAMING_SERVERS.map((x) => (
            <button key={x.id} onClick={() => setServer(x.id)} className={cn("rounded-md border border-border px-3 py-1.5 text-xs", server === x.id && "bg-primary text-primary-foreground")}>{x.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
