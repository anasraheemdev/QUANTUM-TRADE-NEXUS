"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
              <p className="text-blue-accent/70 text-lg">
                Manage your account settings and view your trading statistics
              </p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border border-dark-border bg-dark-card p-8 mb-6"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-blue-primary shadow-blue-glow"
                  />
                  <div className="absolute bottom-0 right-0 p-2 bg-blue-gradient rounded-full border-4 border-dark-card">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-accent/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {new Date(user.memberSince).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>{user.tradingLevel} Trader</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg border border-dark-border bg-dark-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-accent/70">Account Balance</h3>
                  <UserIcon className="h-5 w-5 text-blue-primary" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(user.accountBalance)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg border border-dark-border bg-dark-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-accent/70">Total Invested</h3>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(user.totalInvested)}
                </div>
              </motion.div>
            </div>

            {/* Trading Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-dark-border bg-dark-card p-6 mb-6"
            >
              <h3 className="text-xl font-bold text-blue-accent mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-accent/70 mb-2">Total Trades</div>
                  <div className="text-2xl font-bold text-white">{user.stats.totalTrades}</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-accent/70 mb-2">Win Rate</div>
                  <div className="text-2xl font-bold text-green-400">
                    {user.stats.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-accent/70 mb-2">Average Return</div>
                  <div className="text-2xl font-bold text-blue-primary">
                    {formatPercent(user.stats.avgReturn)}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-dark-border">
                <div className="text-sm text-blue-accent/70 mb-2">Best Trade</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-accent">{user.stats.bestTrade.symbol}</div>
                    <div className="text-sm text-blue-accent/70">
                      {new Date(user.stats.bestTrade.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
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
              className="rounded-lg border border-dark-border bg-dark-card p-6"
            >
              <h3 className="text-xl font-bold text-blue-accent mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div>
                    <div className="font-semibold text-blue-accent">Theme</div>
                    <div className="text-sm text-blue-accent/70">Current theme preference</div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-blue-gradient text-white font-medium">
                    {user.preferences.theme}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div>
                    <div className="font-semibold text-blue-accent">Notifications</div>
                    <div className="text-sm text-blue-accent/70">Receive trading alerts</div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg font-medium ${
                      user.preferences.notifications
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.preferences.notifications ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div>
                    <div className="font-semibold text-blue-accent">Two-Factor Authentication</div>
                    <div className="text-sm text-blue-accent/70">Enhanced security</div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg font-medium ${
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


