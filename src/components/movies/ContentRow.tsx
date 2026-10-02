import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { type TMDBMovie } from '@/lib/movies/tmdb';

interface Props {
  title: string;
  movies: TMDBMovie[] | undefined;
  isLoading?: boolean | undefined;
  showRank?: boolean | undefined;
}

function SkeletonCard() {
  return (
    <div className="w-[150px] sm:w-[170px] flex-shrink-0">
      <div className="aspect-[2/3] rounded-lg bg-secondary/60 animate-pulse" />
      <div className="mt-2 h-4 w-3/4 rounded bg-secondary/40 animate-pulse" />
      <div className="mt-1 h-3 w-1/2 rounded bg-secondary/30 animate-pulse" />
    </div>
  );
}

export default function ContentRow({ title, movies, isLoading, showRank }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  const filtered = movies?.filter((m) => !m.media_type || m.media_type === 'movie' || m.media_type === 'tv');

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
        <h2 className="font-serif text-xl sm:text-2xl text-foreground tracking-wide">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered?.map((m, i) => <MovieCard key={m.id} movie={m} index={i} showRank={showRank} />)}
      </div>
    </section>
  );
}
