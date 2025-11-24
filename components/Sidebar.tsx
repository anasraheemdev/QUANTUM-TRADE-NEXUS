"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  TrendingUp,
  User,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: TrendingUp, label: "Markets", href: "/" },
  { icon: Wallet, label: "Portfolio", href: "/dashboard" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-dark-border bg-dark-card h-screen sticky top-0">
      <div className="flex flex-col p-6 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <motion.div
              key={item.href}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                  isActive
                    ? "bg-blue-gradient text-white shadow-blue-glow"
                    : "text-blue-accent hover:bg-dark-hover hover:text-blue-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto p-6 border-t border-dark-border">
        <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
          <p className="text-sm text-blue-accent mb-2">Need Help?</p>
          <p className="text-xs text-blue-accent/70">
            Contact support for assistance with your trading account.
          </p>
        </div>
      </div>
    </aside>
  );
}


