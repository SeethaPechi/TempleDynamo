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
              <span className="text-white text-lg font-bold">ॐ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-temple-brown">Sri Lakshmi Temple</h1>
              <p className="text-xs text-gray-600">Family Community</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation items */}
            <div className="flex items-center space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    className={`px-3 py-2 font-medium transition-colors flex items-center space-x-2 rounded-lg ${
                      isActive(path)
                        ? "text-saffron-600 bg-saffron-50"
                        : "text-temple-brown hover:text-saffron-600 hover:bg-saffron-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                </Link>
              ))}
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <LanguageSwitcher />
              
              {/* Authentication controls */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    <User size={14} />
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
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-temple-brown hover:text-saffron-600"
                    >
                      <LogIn size={16} />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="flex items-center space-x-2 bg-saffron-500 hover:bg-saffron-600 text-white"
                    >
                      <UserPlus size={16} />
                      <span>Register</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
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
          <div className="md:hidden bg-white shadow-lg border-t border-gray-100">
            {/* Navigation Items */}
            <div className="py-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full text-left px-6 py-4 flex items-center space-x-3 touch-manipulation transition-colors ${
                      isActive(path)
                        ? "text-saffron-600 bg-saffron-50 border-r-4 border-saffron-500"
                        : "text-temple-brown hover:bg-saffron-50 active:bg-saffron-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-base font-medium">{label}</span>
                  </button>
                </Link>
              ))}
            </div>
            
            {/* Mobile authentication section */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg">
                    <User size={16} />
                    <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 bg-white"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 text-center mb-3">
                    Sign in to access all features
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/signin">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 bg-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn size={16} />
                        <span>Sign In</span>
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        className="w-full flex items-center justify-center space-x-2 bg-saffron-500 hover:bg-saffron-600 text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus size={16} />
                        <span>Register</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Language switcher */}
            <div className="px-6 py-3 border-t border-gray-200">
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
