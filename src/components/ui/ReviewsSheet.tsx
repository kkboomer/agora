'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';
import Icon from './Icon';
import Stars from './Stars';
import { averageRating, reviewsFor, type Review } from '@/lib/reviews';
import type { DiscoverItem } from '@/lib/discoverFeed';

interface Props {
  item: DiscoverItem;
  reviews: Review[];
  open: boolean;
  onClose: () => void;
}

/** Bottom sheet listing an item's reviews, TikTok-comments style. */
export default function ReviewsSheet({ item, reviews: allReviews, open, onClose }: Props) {
  const [liked, setLiked] = useState<string[]>([]);
  const reviews = reviewsFor(item.id, allReviews);
  const avg = averageRating(reviews);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={`Reviews for ${item.title}`}
      height="70%"
      title={
        <div>
          <h2>{reviews.length} reviews</h2>
          <div className="reviews-avg"><Stars rating={avg} size={13} /><span>{avg.toFixed(1)}</span></div>
        </div>
      }
    >
      <ul className="reviews-list">
        {reviews.map((r) => {
          const isLiked = liked.includes(r.id);
          return (
            <li key={r.id} className="review">
              <span className="review-avatar" style={{ background: r.color }}>{r.user[0].toUpperCase()}</span>
              <div className="review-body">
                <div className="review-meta"><strong>{r.user}</strong><span>{r.when}</span></div>
                <Stars rating={r.rating} size={12} />
                <p>{r.text}</p>
              </div>
              <button
                className={`review-like ${isLiked ? 'on' : ''}`}
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike review' : 'Like review'}
                onClick={() => setLiked((l) => (isLiked ? l.filter((i) => i !== r.id) : [...l, r.id]))}
              >
                <Icon name="heart" size={17} filled={isLiked} />
                <small>{r.likes + (isLiked ? 1 : 0)}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
