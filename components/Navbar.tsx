"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Bell, User, X } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar, { MobileMenuButton } from "./Sidebar";

export default function Navbar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <Link href="/landing" className="flex items-center gap-2">
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
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/landing"
              className={`text-sm transition-colors hover:text-blue-primary ${
                pathname === "/landing" ? "text-blue-primary" : "text-blue-accent"
              }`}
            >
              Home
            </Link>
            <Link
              href="/"
              className={`text-sm transition-colors hover:text-blue-primary ${
                pathname === "/" ? "text-blue-primary" : "text-blue-accent"
              }`}
            >
              Markets
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm transition-colors hover:text-blue-primary ${
                pathname === "/dashboard" ? "text-blue-primary" : "text-blue-accent"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`text-sm transition-colors hover:text-blue-primary ${
                pathname === "/profile" ? "text-blue-primary" : "text-blue-accent"
              }`}
            >
              Profile
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              className="relative rounded-lg p-2 text-blue-accent transition-colors hover:bg-dark-hover hover:text-blue-primary"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <Link
              href="/profile"
              className="rounded-lg p-2 text-blue-accent transition-colors hover:bg-dark-hover hover:text-blue-primary"
              aria-label="Profile"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

