import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function CRMLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="crm-layout">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="crm-main">
        <header className="mobile-header">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Open navigation menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="mobile-brand">EstateFlow</span>
        </header>
        {children}
      </main>

    </div>
  );
}