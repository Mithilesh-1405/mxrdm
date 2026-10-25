import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Gauge,
  Leaf,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { formatDate } from "../utils/formatters";

export function Header({ dark, onTheme }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark">
          <Leaf size={18} />
        </span>
        <span>
          Northline <strong>Wind Desk</strong>
        </span>
      </Link>
      <div className="topbar-actions">
        <span className="status-dot">
          <i /> Snapshot online
        </span>
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label="Toggle color theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="icon-button menu-button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="mobile-nav">
          <NavItems onClick={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Workspace</div>
      <NavItems />
      <div className="sidebar-foot">
        <div className="live-badge">
          <span /> January 2026 scope
        </div>
        <p>Decision support for day-ahead wind procurement.</p>
      </div>
    </aside>
  );
}
export function NavItems({ onClick }) {
  return (
    <nav className="nav-items">
      <NavLink onClick={onClick} to="/" end>
        <Gauge size={17} />
        Decision View
      </NavLink>
      <NavLink onClick={onClick} to="/accuracy">
        <BarChart3 size={17} />
        Forecast Accuracy
      </NavLink>
    </nav>
  );
}
export function ControlBar({ meta, controls }) {
  return (
    <section className="control-bar">
      <div className="control-intro">
        <span className="eyebrow">Decision controls</span>
        <span className="control-scope">January 2026 delivery</span>
      </div>
      <div className="controls">
        <label>
          <CalendarDays size={15} />
          Delivery date
          <select
            value={controls.date}
            onChange={(event) => controls.setDate(event.target.value)}
          >
            {(meta?.delivery_dates || []).map((value) => (
              <option key={value} value={value}>
                {formatDate(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cutoff
          <input
            type="time"
            value={controls.cutoff}
            onChange={(event) => controls.setCutoff(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
