/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import BottomNav, { type NavTab } from '@/components/ui/BottomNav';
import FilterSheet from '@/components/ui/FilterSheet';
import { DISCOVER_ITEMS, findProduct } from '@/lib/discoverFeed';
import type { Friend } from '@/lib/friends';
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
  friends: Friend[];
}

export default function HomeScreen({ nav, onNav, onOpenSearch, onSearch, productFilters, onProductFilters, cartCount, onOpenSettings, onSeeAll, onOpenCart, onOpenProduct, friends }: Props) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = activeFilterCount(productFilters);

  // Trending is the first of the products in the database; "friends are into" is what real friends liked or saved.
  const trending = DISCOVER_ITEMS.slice(0, 2);
  const friendPicks = friends
    .flatMap((f) => f.collections.flatMap((c) => c.itemIds.map((id) => ({ friend: f, id, liked: c.name === 'Liked items' }))))
    .flatMap((pick) => {
      const item = findProduct(pick.id);
      return item ? [{ ...pick, item }] : [];
    })
    .filter((pick, i, all) => all.findIndex((x) => x.id === pick.id) === i)
    .slice(0, 2);

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
              {trending.map((item, i) => (
                <article key={item.id} className={`trend-card ${i === 0 ? 'trend-main' : ''}`} {...open(item.id, item.title)}>
                  <img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} />
                  {i === 0 ? (
                    <div className="trend-overlay"><span>1</span><div><small>{item.brand.toUpperCase()}</small><h3>{item.title}</h3><p>${item.price}</p></div></div>
                  ) : (
                    <div className="mini-copy"><small>{item.brand.toUpperCase()}</small><h3>{item.title}</h3><p>${item.price}</p></div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="home-section friend-section">
            <div className="section-heading">
              <div><span className="section-kicker">YOUR CIRCLE</span><h2>Friends are into</h2></div>
              <button onClick={() => onSeeAll('Friends')}>See all <Icon name="arrow" size={14} /></button>
            </div>
            <div className="friend-list">
              {friendPicks.length === 0 && <p className="friend-picks-empty">{friends.length === 0 ? 'Add friends to see what they’re into.' : 'Nothing from your friends yet.'}</p>}
              {friendPicks.map(({ friend, item, liked }, i) => (
                <article key={item.id} className="friend-card" {...open(item.id, item.title)}>
                  <div className="friend-photo"><img src={item.image} alt={item.alt} style={{ objectPosition: item.focus }} /><span className={`avatar ${i % 2 ? 'alt' : ''}`}>{friend.initial}</span></div>
                  <div><p><strong>{friend.name.split(' ')[0]}</strong> {liked ? 'liked' : 'saved'} this</p><h3>{item.title}</h3><span>${item.price}</span></div>
                </article>
              ))}
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
