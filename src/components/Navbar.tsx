import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, PhoneCall, Globe } from "lucide-react";
import { getMenu, siteConfig } from "../lib/content";
import type { MenuItem } from "../types";

interface NavbarProps {
  // Optional: only the home page passes these so it can highlight/scroll
  // its active section. Other pages render the Navbar without props.
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  openBooking?: () => void;
}

const menuItems = getMenu();

export default function Navbar({ activeTab, setActiveTab, openBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const scrollToSection = (target: string) => {
    if (target === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document
      .getElementById(`${target}-section`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNav = (item: MenuItem) => {
    setMobileMenuOpen(false);
    if (item.type === "route" && item.href) {
      navigate(item.href);
      return;
    }
    const target = item.target || item.id;
    if (isHome) {
      // Preserve original behaviour: App's effect scrolls when activeTab changes.
      if (setActiveTab) setActiveTab(target);
      else scrollToSection(target);
    } else {
      // Coming from another route: go home, then scroll once mounted.
      navigate("/");
      window.setTimeout(() => scrollToSection(target), 150);
    }
  };

  const handleBooking = () => {
    setMobileMenuOpen(false);
    if (openBooking) {
      openBooking();
    } else {
      navigate("/");
      window.setTimeout(() => scrollToSection("contact"), 150);
    }
  };

  const isActive = (item: MenuItem) =>
    item.type === "route"
      ? location.pathname.startsWith(item.href || "\0")
      : isHome && activeTab === (item.target || item.id);

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              if (isHome) {
                setActiveTab?.("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigate("/");
              }
            }}
            id="navbar-logo"
          >
            <div className="w-10 h-10 rounded bg-amber-500 flex items-center justify-center text-neutral-950 font-bold text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider block">THE GARAGE</span>
              <span className="text-xs text-amber-500 tracking-widest font-mono block -mt-1">JÁVEA</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex space-x-1 lg:space-x-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNav(item)}
                className={`px-3 py-2 rounded text-sm font-medium tracking-wide transition-all ${
                  isActive(item)
                    ? "text-amber-500 bg-neutral-900"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Languages & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-neutral-900 rounded border border-neutral-800 text-xs text-neutral-400 font-mono">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{siteConfig.contact.languages}</span>
            </div>

            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
              className="flex items-center space-x-1.5 text-xs text-neutral-300 hover:text-amber-400 font-mono transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
              <span>{siteConfig.contact.phone}</span>
            </a>

            <button
              id="cta-booking-nav"
              onClick={handleBooking}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded text-sm font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all"
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden space-x-3">
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-neutral-900 rounded border border-neutral-800 text-[10px] text-neutral-400 font-mono">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>NL • EN</span>
            </div>

            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-neutral-900 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNav(item)}
                className="block w-full text-left px-4 py-3 rounded text-base font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-900 space-y-4">
            <div className="flex justify-between items-center text-sm px-4">
              <span className="text-neutral-400 font-mono">Languages spoken:</span>
              <span className="text-amber-500 font-bold font-mono">{siteConfig.contact.languages}</span>
            </div>

            <div className="flex justify-between items-center text-sm px-4">
              <span className="text-neutral-400 font-mono">Phone:</span>
              <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="text-white hover:text-amber-400 font-bold font-mono">
                {siteConfig.contact.phone}
              </a>
            </div>

            <div className="px-4">
              <button
                id="cta-booking-mobile"
                onClick={handleBooking}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded text-center font-bold shadow-lg"
              >
                Book Service & Advisory
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
