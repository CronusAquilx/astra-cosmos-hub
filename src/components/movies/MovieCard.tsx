import { Link } from '@tanstack/react-router';
import { Star, Play } from 'lucide-react';
import { img, type TMDBMovie } from '@/lib/movies/tmdb';

interface Props {
  movie: TMDBMovie;
  index?: number;
  showRank?: boolean | undefined;
  compact?: boolean;
}

export default function MovieCard({ movie, index = 0, showRank, compact }: Props) {
  const title = movie.title || movie.name || 'Untitled';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const mediaType = movie.media_type;
  if (mediaType && mediaType !== 'movie' && mediaType !== 'tv') return null;
  const type = mediaType === 'tv' || (!mediaType && (Boolean(movie.first_air_date) || (Boolean(movie.name) && !movie.title)))
    ? 'tv'
    : 'movie';
  const rating = movie.vote_average?.toFixed(1);
  const rank = (index ?? 0) + 1;

  if (showRank && rank <= 10) {
    return (
      <div className="relative flex items-end shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span
          className="font-serif select-none leading-none pointer-events-none pr-1"
          style={{
            fontSize: compact ? '96px' : '140px',
            WebkitTextStroke: '2px hsl(var(--foreground) / 0.55)',
            color: 'transparent',
            marginRight: compact ? '-18px' : '-24px',
          }}
        >
          {rank}
        </span>
        <Link to="/movies/title/$type/$id" params={{ type, id: String(movie.id) }} className={`relative ${compact ? 'w-[110px]' : 'w-[140px] sm:w-[160px]'} group`}>
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-border shadow-xl">
            <img
              src={img(movie.poster_path)}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <p className="text-xs font-semibold text-white line-clamp-1">{title}</p>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative group ${compact ? 'w-[120px]' : 'w-[150px] sm:w-[170px]'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <Link to="/movies/title/$type/$id" params={{ type, id: String(movie.id) }}>
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-border shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:border-star/40">
          <img
            src={img(movie.poster_path)}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />

          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
            <p className="text-[13px] font-semibold text-white line-clamp-1 leading-tight">{title}</p>
            <div className="flex items-center gap-2 text-[11px] text-white/70 mt-0.5">
              {year && <span>{year}</span>}
              {rating && rating !== '0.0' && (
                <span className="flex items-center gap-0.5">
                  <Star size={9} className="text-star" fill="currentColor" />
                  <span className="text-star font-semibold">{rating}</span>
                </span>
              )}
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center">
              <Play className="text-black ml-0.5" size={18} fill="currentColor" />
            </div>
          </div>

          {year === String(new Date().getFullYear()) && (
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-star text-star-foreground">NEW</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
