import type { ReactNode } from 'react';
import { PendantChip } from '../components/Chip.js';
import { LotusMark } from './LotusMark.js';

export type ShellTab = {
  id: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  onSelect?: () => void;
};

export type ShellProps = {
  title?: string;
  pendantState: 'connected' | 'charging' | 'low' | 'not_connected' | 'recording' | 'mics_off';
  battery?: number;
  companion: ReactNode;
  children: ReactNode;
  bottomNav?: ReactNode;
  simpleMode?: boolean;
  alertCount?: number;
  tabs?: ShellTab[];
  avatarInitials?: string;
  onNewChat?: () => void;
  onSearch?: () => void;
  onAlerts?: () => void;
  contentBare?: boolean;
};

export function AppShell({
  title = 'Svaraa',
  pendantState,
  battery,
  companion,
  children,
  bottomNav,
  simpleMode,
  alertCount = 0,
  tabs = [],
  avatarInitials = 'PR',
  onNewChat,
  onSearch,
  onAlerts,
  contentBare,
}: ShellProps) {
  return (
    <div className={simpleMode ? 'shell shell--simple' : 'shell'}>
      <div className="shell-wallpaper" aria-hidden />

      <header className="shell-topbar">
        <div className="shell-topbar__left">
          <button type="button" className="shell-brand" aria-label={title}>
            <LotusMark size={28} />
          </button>
          {!simpleMode && tabs.length > 0 ? (
            <nav className="shell-tabs" aria-label="Open views">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`shell-tab${tab.active ? ' is-active' : ''}${tab.danger ? ' is-danger' : ''}`}
                  onClick={tab.onSelect}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="shell-topbar__right">
          {!simpleMode ? (
            <button type="button" className="shell-newchat" onClick={onNewChat}>
              + New chat
            </button>
          ) : null}
          <button type="button" className="shell-iconbtn" aria-label="Search" onClick={onSearch}>
            <SearchIcon />
          </button>
          <button type="button" className="shell-iconbtn" aria-label="Alerts" onClick={onAlerts}>
            <BellIcon />
            {alertCount > 0 ? <span className="shell-badge">{alertCount > 9 ? '9+' : alertCount}</span> : null}
          </button>
          <PendantChip state={pendantState} battery={battery} />
          <span className="shell-avatar" aria-hidden>
            {avatarInitials.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </header>

      <div className={`shell-body${simpleMode ? ' shell-body--simple' : ''}`}>
        {!simpleMode ? <aside className="shell-companion">{companion}</aside> : null}
        <main className={contentBare ? 'shell-main shell-main--bare' : 'shell-main shell-main--sheet'}>
          {children}
        </main>
      </div>

      {bottomNav ? <nav className="shell-bottom">{bottomNav}</nav> : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}
