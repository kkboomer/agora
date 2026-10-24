import Icon from './Icon';

export type NavTab = 'home' | 'closet' | 'discover' | 'gifts' | 'profile';

interface BottomNavProps {
  current: NavTab | null;
  onChange: (tab: NavTab) => void;
  variant: 'home' | 'discovery';
}

export default function BottomNav({ current, onChange, variant }: BottomNavProps) {
  const cls = (tab: NavTab) => (current === tab ? 'current' : '');
  return (
    <nav className={`bottom-nav ${variant === 'discovery' ? 'discovery-nav' : 'home-nav'}`} aria-label="Main navigation">
      <button className={cls('home')} onClick={() => onChange('home')} aria-label="Home"><Icon name="home" filled={current === 'home'} /></button>
      <button className={cls('closet')} onClick={() => onChange('closet')} aria-label="Closet"><Icon name="shirt" /></button>
      <button className={`discover-button ${cls('discover')}`} onClick={() => onChange('discover')} aria-label="Discover">
        <span className="discover-orb"><Icon name="star" size={20} filled /></span>
      </button>
      <button className={cls('gifts')} onClick={() => onChange('gifts')} aria-label="Gifts"><Icon name="gift" /></button>
      <button className={cls('profile')} onClick={() => onChange('profile')} aria-label="Profile"><Icon name="user" /></button>
    </nav>
  );
}
