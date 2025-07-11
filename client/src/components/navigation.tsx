import { Link, useLocation } from "wouter";
import {
  Home,
  UserPlus,
  Users,
  Menu,
  X,
  MessageSquare,
  Building,
  TreePine,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location === path;

  const navItems = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/registry", label: t("nav.registry"), icon: UserPlus },
    { path: "/members", label: t("nav.members"), icon: Users },
    { path: "/family-tree", label: t("nav.familyTree"), icon: TreePine },
    { path: "/temples", label: t("nav.temples"), icon: Building },
    {
      path: "/temple-registry",
      label: t("nav.templeRegistry"),
      icon: Building,
    },
    {
      path: "/temple-members",
      label: t("Temple Members") || "Temple Members",
      icon: Building,
    },
    { path: "/whatsapp", label: t("nav.whatsapp"), icon: MessageSquare },
  ];

  return (
    <nav className="bg-white shadow-lg border-b-4 border-temple-gold sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-saffron-500 to-temple-red rounded-full flex items-center justify-center">
              <span className="text-white text-lg"></span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-temple-brown"></h1>
              <p className="text-xs text-gray-600"></p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <button
                  className={`px-4 py-2 font-medium transition-colors flex items-center space-x-2 ${
                    isActive(path)
                      ? "text-saffron-600 border-b-2 border-saffron-500"
                      : "text-temple-brown hover:text-saffron-600"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              </Link>
            ))}
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-temple-brown p-2 touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 bg-white shadow-lg">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 flex items-center space-x-2 touch-manipulation border-b border-gray-100 ${
                    isActive(path)
                      ? "text-saffron-600 bg-saffron-50"
                      : "text-temple-brown hover:bg-saffron-50 active:bg-saffron-100"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-base">{label}</span>
                </button>
              </Link>
            ))}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
