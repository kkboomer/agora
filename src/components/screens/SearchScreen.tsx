'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';

export type Gender = 'women' | 'men';
export interface StyleFilter {
  gender?: Gender;
  category?: string;
  query?: string;
}

interface Category {
  name: string;
  /** Hide for the other gender when set. */
  only?: Gender;
  /** Label to use instead of `name` for men. */
  menName?: string;
}
interface Group {
  name: string;
  only?: Gender;
  items: Category[];
}

const groups: Group[] = [
  { name: 'Tops', items: [{ name: 'T-shirts' }, { name: 'Shirts & blouses', menName: 'Shirts' }, { name: 'Sweaters' }, { name: 'Hoodies' }, { name: 'Tank tops' }] },
  { name: 'Outerwear', items: [{ name: 'Jackets' }, { name: 'Coats' }, { name: 'Blazers' }, { name: 'Vests' }] },
  { name: 'Bottoms', items: [{ name: 'Jeans' }, { name: 'Trousers' }, { name: 'Shorts' }, { name: 'Skirts', only: 'women' }, { name: 'Leggings', only: 'women' }] },
  { name: 'Dresses', only: 'women', items: [{ name: 'Mini' }, { name: 'Midi' }, { name: 'Maxi' }, { name: 'Occasion' }] },
  { name: 'Shoes', items: [{ name: 'Sneakers' }, { name: 'Boots' }, { name: 'Heels', only: 'women' }, { name: 'Sandals' }, { name: 'Flats', only: 'women' }] },
  { name: 'Accessories', items: [{ name: 'Bags' }, { name: 'Jewelry' }, { name: 'Hats' }, { name: 'Belts' }, { name: 'Scarves' }] },
];

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  initialGender: Gender;
  onSelect: (filter: StyleFilter) => void;
  onSearch: (query: string) => void;
}

export default function SearchScreen({ nav, onNav, initialGender, onSelect, onSearch }: Props) {
  const [gender, setGender] = useState<Gender>(initialGender);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = groups
    .filter((g) => !g.only || g.only === gender)
    .map((g) => {
      const items = g.items
        .filter((i) => !i.only || i.only === gender)
        .map((i) => (gender === 'men' && i.menName ? i.menName : i.name));
      return { name: g.name, items: q && !g.name.toLowerCase().includes(q) ? items.filter((i) => i.toLowerCase().includes(q)) : items };
    })
    .filter((g) => g.items.length > 0);

  return (
    <main className="app-shell">
      <section className="phone search-screen" aria-label="Browse by style">
        <div className="search-scroll">
          <header className="search-top">
            <button className="header-action" onClick={() => onNav('home')} aria-label="Back"><Icon name="back" size={21} /></button>
            <h1>Browse</h1>
            <span />
          </header>

          <form
            className="search-bar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) onSearch(query.trim());
            }}
          >
            <button type="submit" className="search-submit" aria-label="Search"><Icon name="search" size={20} /></button>
            <input
              type="search"
              placeholder="Search jackets, jeans, sweaters…"
              aria-label="Search categories"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="gender-toggle" role="tablist" aria-label="Shop for">
            {(['women', 'men'] as const).map((g) => (
              <button key={g} role="tab" aria-selected={gender === g} className={gender === g ? 'active' : ''} onClick={() => setGender(g)}>
                {g === 'women' ? 'Women' : 'Men'}
              </button>
            ))}
          </div>

          <ul className="category-list">
            {visible.map((group) => {
              const isOpen = q ? true : open === group.name;
              return (
                <li key={group.name} className={`category-group ${isOpen ? 'open' : ''}`}>
                  <button
                    className="category-head"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : group.name)}
                  >
                    <span>{group.name}</span>
                    <Icon name="arrow" size={18} className="chevron" />
                  </button>
                  {isOpen && (
                    <ul className="category-items">
                      {group.items.map((item) => (
                        <li key={item}>
                          <button onClick={() => onSelect({ gender, category: item })}>
                            {item}
                            <Icon name="arrow" size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {visible.length === 0 && <li className="category-empty">No matches for “{query}”.</li>}
          </ul>
        </div>
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
