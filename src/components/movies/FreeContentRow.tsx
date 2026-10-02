import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import YouTubeMovieCard from './YouTubeMovieCard';

interface FreeMovie {
  title: string;
  year: string;
  videoId: string;
  poster: string;
  source: 'youtube' | 'archive';
}

interface Props {
  title: string;
  movies: FreeMovie[];
}

export default function FreeContentRow({ title, movies }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  if (!movies.length) return null;

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
        {movies.map((m, i) => (
          <YouTubeMovieCard key={m.videoId} {...m} index={i} />
        ))}
      </div>
    </section>
  );
}
