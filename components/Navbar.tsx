"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Bell, User, Menu } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-card/80 backdrop-blur-md"
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-gradient shadow-blue-glow">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-accent">QUANTUM TRADE NEXUS</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/landing"
            className={`transition-colors hover:text-blue-primary ${
              pathname === "/landing" ? "text-blue-primary" : "text-blue-accent"
            }`}
          >
            Home
          </Link>
          <Link
            href="/"
            className={`transition-colors hover:text-blue-primary ${
              pathname === "/" ? "text-blue-primary" : "text-blue-accent"
            }`}
          >
            Markets
          </Link>
          <Link
            href="/dashboard"
            className={`transition-colors hover:text-blue-primary ${
              pathname === "/dashboard" ? "text-blue-primary" : "text-blue-accent"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className={`transition-colors hover:text-blue-primary ${
              pathname === "/profile" ? "text-blue-primary" : "text-blue-accent"
            }`}
          >
            Profile
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-blue-accent transition-colors hover:bg-dark-hover hover:text-blue-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          <Link
            href="/profile"
            className="rounded-lg p-2 text-blue-accent transition-colors hover:bg-dark-hover hover:text-blue-primary"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

