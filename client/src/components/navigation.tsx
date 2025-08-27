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
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();

  const isActive = (path: string) => location === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const publicNavItems = [
    { path: "/", label: t("nav.home"), icon: Home },
  ];

  const authenticatedNavItems = [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/family-registry", label: "Family Registry", icon: UserPlus },
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

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

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
            
            {/* Authentication controls */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="flex items-center space-x-2 bg-saffron-500 hover:bg-saffron-600"
                  >
                    <UserPlus size={16} />
                    <span>Register</span>
                  </Button>
                </Link>
              </div>
            )}
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
            
            {/* Mobile authentication controls */}
            <div className="px-4 py-3 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                    <User size={16} />
                    <span>{user?.firstName} {user?.lastName}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/signin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center space-x-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn size={16} />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center space-x-2 bg-saffron-500 hover:bg-saffron-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserPlus size={16} />
                      <span>Register</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
