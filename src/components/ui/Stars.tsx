import Icon from './Icon';

interface StarsProps {
  rating: number;
  size?: number;
}

/** Read-only 1–5 star display. Filled stars are gold, empty ones are outlined. */
export default function Stars({ rating, size = 14 }: StarsProps) {
  const full = Math.round(rating);
  return (
    <span className="stars" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? 'on' : ''}>
          <Icon name="star" size={size} filled={n <= full} />
        </span>
      ))}
    </span>
  );
}
