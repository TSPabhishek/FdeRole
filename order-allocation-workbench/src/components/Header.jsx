import { Bell, ChevronDown, PackageCheck, Settings2 } from 'lucide-react'

export default function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#overview" aria-label="Stockwise overview">
        <span className="brand-mark"><PackageCheck size={21} strokeWidth={2.2} /></span>
        <span>Stock check<span className="brand-period">.</span></span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <a className="nav-link" href="#overview">Overview</a>
        <a className="nav-link nav-link-active" href="#allocations" aria-current="page">Allocations</a>
        <a className="nav-link" href="#inventory">Inventory</a>
      </nav>

      <div className="topbar-actions">
        <span className="workspace-label">Northstar Supply <ChevronDown size={14} /></span>
        <button className="icon-button" type="button" aria-label="Settings">
          <Settings2 size={18} />
        </button>
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Bell size={18} /><span className="notification-dot" />
        </button>
        <button className="avatar avatar-user" type="button" aria-label="Account: Alex Morgan">AM</button>
      </div>
    </header>
  )
}
