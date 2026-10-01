import { Star } from 'lucide-react';

/**
 * StarRating — reusable star rating component.
 *
 * Props:
 *   value        {number}   Current rating value (1–5, or 0 for none)
 *   onChange     {Function} Called with new value when a star is clicked (interactive mode)
 *   interactive  {boolean}  When true, stars are clickable
 *   size         {number}   Star icon size (default 18)
 *   showCount    {boolean}  Show count badge (default false)
 *   count        {number}   Number of ratings to display
 *   showLabel    {boolean}  Show numeric value (default true when avgRating > 0)
 *   className    {string}   Extra wrapper classes
 */
function StarRating({
  value = 0,
  onChange,
  interactive = false,
  size = 18,
  showCount = false,
  count = 0,
  showLabel = true,
  className = '',
}) {
  const stars = [1, 2, 3, 4, 5];
  const displayValue = typeof value === 'number' ? value : 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const filled = star <= Math.round(displayValue);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={interactive && onChange ? () => onChange(star) : undefined}
              aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
              className={[
                'transition-transform',
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm'
                  : 'cursor-default pointer-events-none',
              ].join(' ')}
            >
              <Star
                size={size}
                className={
                  filled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-zinc-200 text-zinc-300 dark:fill-zinc-700 dark:text-zinc-600'
                }
              />
            </button>
          );
        })}
      </div>

      {/* Numeric label */}
      {showLabel && displayValue > 0 && (
        <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 ml-0.5">
          {displayValue.toFixed(1)}
        </span>
      )}

      {/* Count badge */}
      {showCount && (
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 ml-0.5">
          ({count})
        </span>
      )}
    </div>
  );
}

export default StarRating;
