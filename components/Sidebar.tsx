"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  TrendingUp,
  User,
  Wallet,
  BarChart3,
  Settings,
  X,
  LogOut,
  Shield,
  Users,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Public menu items (always visible)
const publicMenuItems = [
  { icon: Home, label: "Home", href: "/", requiresAuth: false },
  { icon: TrendingUp, label: "Markets", href: "/markets", requiresAuth: false },
];

// Protected menu items (only visible when authenticated)
const protectedMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { icon: Wallet, label: "Portfolio", href: "/dashboard", requiresAuth: true },
  { icon: History, label: "Trade History", href: "/transactions", requiresAuth: true },
  { icon: BarChart3, label: "Analytics", href: "/dashboard", requiresAuth: true },
  { icon: User, label: "Profile", href: "/profile", requiresAuth: true },
  { icon: User, label: "Find Users", href: "/users", requiresAuth: true },
  { icon: Settings, label: "Settings", href: "/profile", requiresAuth: true },
];

// Admin menu items (only visible to admins)
const adminMenuItems = [
  { icon: Shield, label: "Admin Portal", href: "/admin", requiresAuth: true, adminOnly: true },
  { icon: Users, label: "Client Management", href: "/admin/clients", requiresAuth: true, adminOnly: true },
  { icon: Shield, label: "Admin Requests", href: "/admin/requests", requiresAuth: true, adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: controlledIsOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, signOut, loading: authLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isMobileOpen;
  const setIsOpen = onClose ? onClose : setIsMobileOpen;

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (session) {
        try {
          const response = await fetch("/api/admin/check", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [session]);

  // Get menu items based on auth status and admin role
  const menuItems = [
    ...publicMenuItems,
    ...(user ? protectedMenuItems : []),
    ...(user && isAdmin ? adminMenuItems : []),
  ];

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 lg:p-6 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          // Use a unique key combining href and label to avoid duplicate key warnings
          const uniqueKey = `${item.href}-${item.label}-${index}`;
          
          return (
            <motion.div
              key={uniqueKey}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.requiresAuth && !user ? "/signin" : item.href}
                onClick={(e) => {
                  setIsOpen(false);
                  // If protected route and not authenticated, redirect to signin
                  if (item.requiresAuth && !user && !authLoading) {
                    e.preventDefault();
                    router.push(`/signin?redirect=${item.href}`);
                  }
                }}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                  isActive
                    ? "bg-blue-gradient text-white shadow-blue-glow"
                    : "text-blue-accent hover:bg-dark-hover hover:text-blue-primary"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto p-4 lg:p-6 border-t border-dark-border space-y-2">
        {user ? (
          <>
            <div className="rounded-lg bg-dark-hover p-4 border border-dark-border mb-2">
              <p className="text-sm font-medium text-blue-accent mb-1">{user.email}</p>
              <p className="text-xs text-blue-accent/70">
                {user.user_metadata?.name || "Trader"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/signin"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-blue-gradient text-white font-medium hover:shadow-blue-glow transition-all"
            >
              Sign In
            </Link>
            <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
              <p className="text-sm text-blue-accent mb-2">Need Help?</p>
              <p className="text-xs text-blue-accent/70">
                Contact support for assistance with your trading account.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-dark-border bg-dark-card fixed left-0 top-16 bottom-0 overflow-y-auto scrollbar-hide">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              exit={{ x: -100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 border-r border-dark-border bg-dark-card z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <span className="text-lg font-bold text-blue-accent">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-blue-accent hover:bg-dark-hover hover:text-blue-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Export mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden rounded-lg p-2 text-blue-accent hover:bg-dark-hover hover:text-blue-primary transition-colors"
      aria-label="Open menu"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}


