"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { User } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Settings,
} from "lucide-react";
import Loading from "@/components/Loading";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/data/user.json")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex pt-0 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Profile</h1>
              <p className="text-sm sm:text-base lg:text-lg text-blue-accent/70">
                Manage your account settings and view your trading statistics
              </p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-primary shadow-blue-glow object-cover"
                  />
                  <div className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-gradient rounded-full border-4 border-dark-card">
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{user.name}</h2>
                  <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-blue-accent/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Member since {new Date(user.memberSince).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{user.tradingLevel} Trader</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-accent/70">Account Balance</h3>
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {formatCurrency(user.accountBalance)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-accent/70">Total Invested</h3>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {formatCurrency(user.totalInvested)}
                </div>
              </motion.div>
            </div>

            {/* Trading Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6 mb-4 sm:mb-6"
            >
              <h3 className="text-lg sm:text-xl font-bold text-blue-accent mb-4 sm:mb-6 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Trading Statistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Total Trades</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{user.stats.totalTrades}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Win Rate</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {user.stats.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Average Return</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-primary">
                    {formatPercent(user.stats.avgReturn)}
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-dark-border">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Best Trade</div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">{user.stats.bestTrade.symbol}</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">
                      {new Date(user.stats.bestTrade.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {formatCurrency(user.stats.bestTrade.gain)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-bold text-blue-accent mb-4 sm:mb-6 flex items-center gap-2">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                Preferences
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">Theme</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">Current theme preference</div>
                  </div>
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-gradient text-white text-xs sm:text-sm font-medium whitespace-nowrap">
                    {user.preferences.theme}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">Notifications</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">Receive trading alerts</div>
                  </div>
                  <div
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${
                      user.preferences.notifications
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.preferences.notifications ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">Two-Factor Authentication</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">Enhanced security</div>
                  </div>
                  <div
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${
                      user.preferences.twoFactorAuth
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.preferences.twoFactorAuth ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}


