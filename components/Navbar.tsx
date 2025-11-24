"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, Bell, User, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar, { MobileMenuButton } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import UserSearch from "./UserSearch";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch notification count
  useEffect(() => {
    if (!session || !user) {
      setUnreadCount(0);
      return;
    }

    const fetchNotificationCount = async () => {
      try {
        const token = session.access_token;
        const response = await fetch("/api/notifications?limit=1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, [session, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsNotificationOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-card/80 backdrop-blur-md"
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-gradient shadow-blue-glow">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-base sm:text-xl font-bold text-blue-accent hidden xs:inline">
                QUANTUM TRADE NEXUS
              </span>
              <span className="text-base sm:text-xl font-bold text-blue-accent xs:hidden">
                QTN
              </span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-1 max-w-2xl mx-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-all hover:text-blue-primary whitespace-nowrap px-2 py-1 rounded-lg hover:bg-dark-hover ${
                pathname === "/" ? "text-blue-primary bg-dark-hover" : "text-blue-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/markets"
              className={`text-sm font-medium transition-all hover:text-blue-primary whitespace-nowrap px-2 py-1 rounded-lg hover:bg-dark-hover ${
                pathname === "/markets" ? "text-blue-primary bg-dark-hover" : "text-blue-accent"
              }`}
            >
              Markets
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-all hover:text-blue-primary whitespace-nowrap px-2 py-1 rounded-lg hover:bg-dark-hover ${
                    pathname === "/dashboard" ? "text-blue-primary bg-dark-hover" : "text-blue-accent"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-all hover:text-blue-primary whitespace-nowrap px-2 py-1 rounded-lg hover:bg-dark-hover ${
                    pathname === "/profile" ? "text-blue-primary bg-dark-hover" : "text-blue-accent"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  href="/users"
                  className={`text-sm font-medium transition-all hover:text-blue-primary whitespace-nowrap px-2 py-1 rounded-lg hover:bg-dark-hover ${
                    pathname === "/users" ? "text-blue-primary bg-dark-hover" : "text-blue-accent"
                  }`}
                >
                  Find Users
                </Link>
                <div className="flex-1 max-w-md">
                  <UserSearch />
                </div>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4 relative">
            {user ? (
              <>
                {/* Notifications Button */}
                <div className="relative">
                  <button 
                    onClick={handleNotificationClick}
                    className={`relative rounded-lg p-2 text-blue-accent transition-all hover:bg-dark-hover hover:text-blue-primary ${
                      isNotificationOpen ? "bg-dark-hover text-blue-primary" : ""
                    }`}
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-dark-card"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* Profile Link */}
                <Link
                  href="/profile"
                  className={`rounded-lg p-2 text-blue-accent transition-all hover:bg-dark-hover hover:text-blue-primary ${
                    pathname === "/profile" ? "bg-dark-hover text-blue-primary" : ""
                  }`}
                  aria-label="Profile"
                  title="Profile"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-2 text-blue-accent transition-all hover:bg-dark-hover hover:text-red-400"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm sm:text-base text-blue-accent hover:text-blue-primary transition-colors hidden sm:inline px-2 py-1 rounded-lg hover:bg-dark-hover"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-gradient text-white text-xs sm:text-sm font-medium hover:shadow-blue-glow transition-all active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

