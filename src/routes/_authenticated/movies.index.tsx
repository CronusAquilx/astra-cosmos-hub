import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { MobileMenuButton } from "@/components/astra/AppShell";
import HeroBanner from "@/components/movies/HeroBanner";
import ContentRow from "@/components/movies/ContentRow";
import ChannelsRow from "@/components/movies/ChannelsRow";
import FreeContentRow from "@/components/movies/FreeContentRow";
import MovieCard from "@/components/movies/MovieCard";
import { useAnime, useKDrama, useNowPlaying, usePopular, useSearch, useTopRatedMovies, useTopRatedTV, useTrending } from "@/lib/movies/hooks";
import { YOUTUBE_MOVIES } from "@/lib/movies/tmdb";
import { useWatchlist } from "@/lib/movies/watchlist";

export const Route = createFileRoute("/_authenticated/movies/")({
  head: () => ({ meta: [{ title: "Movies — Astra" }] }),
  component: Movies,
});

function Movies() {
  const [q, setQ] = useState("");
  const trending = useTrending();
  const popular = usePopular();
  const nowPlaying = useNowPlaying();
  const topMovies = useTopRatedMovies();
  const topTV = useTopRatedTV();
  const anime = useAnime();
  const kdrama = useKDrama();
  const results = useSearch(q.trim());
  const watchlist = useWatchlist();

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
        <MobileMenuButton />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies & shows" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </header>
      {q.trim().length > 1 ? (
        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-6">
          {results.data?.map((m) => <MovieCard key={`${m.media_type}-${m.id}`} movie={m} compact />)}
          {results.data?.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No results.</p>}
        </div>
      ) : (
        <>
          <HeroBanner movies={trending.data} />
          <div className="relative z-10 -mt-16 space-y-2 pb-10">
            <ChannelsRow />
            {!!watchlist.data?.length && (
              <ContentRow title="My List" movies={watchlist.data.map((w) => ({ id: w.tmdb_id, title: w.title ?? "", poster_path: w.poster_path, backdrop_path: null, overview: "", vote_average: 0, genre_ids: [], popularity: 0, media_type: w.media_type }))} />
            )}
            <ContentRow title="Trending now" movies={trending.data} isLoading={trending.isLoading} showRank />
            <ContentRow title="Popular" movies={popular.data} isLoading={popular.isLoading} />
            <ContentRow title="In theaters" movies={nowPlaying.data} isLoading={nowPlaying.isLoading} />
            <ContentRow title="Top rated movies" movies={topMovies.data} isLoading={topMovies.isLoading} />
            <ContentRow title="Top rated shows" movies={topTV.data} isLoading={topTV.isLoading} />
            <ContentRow title="Anime" movies={anime.data} isLoading={anime.isLoading} />
            <ContentRow title="K-Drama" movies={kdrama.data} isLoading={kdrama.isLoading} />
            <FreeContentRow title="Free full movies" movies={YOUTUBE_MOVIES} />
          </div>
        </>
      )}
    </div>
  );
}
