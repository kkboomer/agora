'use client';

import { useState } from 'react';
import Icon from './Icon';

interface Props {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}

/** Tap-to-rate 1–5 stars. Hover (mouse) previews the rating. */
export default function StarPicker({ value, onChange, size = 28 }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="star-picker" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <Icon name="star" size={size} filled={n <= shown} />
        </button>
      ))}
    </div>
  );
}
