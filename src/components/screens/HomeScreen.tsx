/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import FilterSheet from '@/components/ui/FilterSheet';
import { DISCOVER_ITEMS } from '@/lib/discoverFeed';
import { activeFilterCount, matchesFilters, type ProductFilters } from '@/lib/filters';
import type { FeedTab } from '@/components/screens/DiscoverScreen';

interface Props {
  nav: NavTab;
  onNav: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onSearch: (query: string) => void;
  productFilters: ProductFilters;
  onProductFilters: (filters: ProductFilters) => void;
  cartCount: number;
  onOpenSettings: () => void;
  onSeeAll: (tab: FeedTab) => void;
  onOpenCart: () => void;
  onOpenProduct: (id: string) => void;
}

export default function HomeScreen({ nav, onNav, onOpenSearch, onSearch, productFilters, onProductFilters, cartCount, onOpenSettings, onSeeAll, onOpenCart, onOpenProduct }: Props) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = activeFilterCount(productFilters);

  // Makes a card behave as a button that opens the product page.
  const open = (id: string, title: string) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': `Open ${title}`,
    onClick: () => onOpenProduct(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenProduct(id);
      }
    },
  });

  return (
    <main className="app-shell">
      <section className="phone home-screen" aria-label="Agora home">
        <div className="home-scroll">
          <header className="home-header">
            <button className="header-action" aria-label="Settings" onClick={onOpenSettings}><Icon name="cog" size={21} /></button>
            <h1>Agora</h1>
            <button className="header-action home-cart" aria-label={`Shopping cart, ${cartCount} items`} onClick={onOpenCart}><Icon name="cart" size={21} />{cartCount > 0 && <span>{cartCount}</span>}</button>
          </header>

          <form
            className="search-bar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              // Filters alone are enough to search.
              if (query.trim() || filterCount) onSearch(query.trim());
            }}
          >
            <button type="submit" className="search-submit" aria-label="Search"><Icon name="search" size={20} /></button>
            <input type="search" placeholder="Search pieces, brands, styles" aria-label="Search Agora" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className={`search-filters ${filterCount ? 'filters-on' : ''}`} aria-label={filterCount ? `Filters, ${filterCount} active` : 'Filters'} onClick={() => setFiltersOpen(true)}>
              <Icon name="sliders" size={18} />
            </button>
          </form>

          <section className="home-section">
            <div className="section-heading">
              <div><span className="section-kicker">NOW</span><h2>Trending pieces</h2></div>
              <button onClick={() => onSeeAll('Trending')}>See all <Icon name="arrow" size={14} /></button>
            </div>
            <div className="trend-grid">
              <article className="trend-card trend-main" {...open('frankie-oversized-tailoring', 'Oversized tailoring')}>
                <img src="https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700" alt="Neutral tailored blazer and trousers" />
                <div className="trend-overlay"><span>1</span><div><small>THE FRANKIE SHOP</small><h3>Oversized tailoring</h3><p>$189</p></div></div>
              </article>
              <article className="trend-card" {...open('nicholson-volume-jacket', 'Volume Jacket')}>
                <img src="https://images.unsplash.com/photo-1603189343302-e603f7add05a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=500" alt="Black statement jacket" />
                <div className="mini-copy"><small>STUDIO NICHOLSON</small><h3>Volume Jacket</h3><p>$215</p></div>
              </article>
            </div>
          </section>

          <section className="home-section friend-section">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR CIRCLE</span><h2>Friends are into</h2></div>
              <button onClick={() => onSeeAll('Friends')}>See all <Icon name="arrow" size={14} /></button>
            </div>
            <div className="friend-list">
              <article className="friend-card" {...open('everyday-trench', 'Everyday Trench')}>
                <div className="friend-photo"><img src="https://images.unsplash.com/photo-1692180142575-c31fcd106b5b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=500" alt="Editorial street style look" /><span className="avatar">M</span></div>
                <div><p><strong>Maya</strong> saved this</p><h3>Everyday Trench</h3><span>$168</span></div>
              </article>
              <article className="friend-card" {...open('sculpted-midi', 'Sculpted Midi')}>
                <div className="friend-photo"><img src="https://images.unsplash.com/photo-1659522761084-79196b64abe4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=500" alt="Minimal white dress" /><span className="avatar alt">A</span></div>
                <div><p><strong>Alex</strong> bought this</p><h3>Sculpted Midi</h3><span>$142</span></div>
              </article>
            </div>
          </section>
        </div>
        <FilterSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          applied={productFilters}
          onApply={onProductFilters}
          countFor={(f) => DISCOVER_ITEMS.filter((i) => matchesFilters(i, f)).length}
        />
        <BottomNav current={nav} onChange={onNav} variant="home" />
      </section>
    </main>
  );
}
