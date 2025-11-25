"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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

interface UserProfile {
  id: string;
  unique_user_id?: string;
  email: string;
  name: string;
  avatar_url: string | null;
  account_balance: number;
  total_invested: number;
  member_since: string;
  trading_level: string;
  stats?: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    bestTrade: {
      symbol: string;
      date: string;
      gain: number;
    };
  };
  preferences?: {
    theme: string;
    notifications: boolean;
    twoFactorAuth: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, session, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    trading_level: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!authUser || !session) {
      router.push("/signin");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        console.log('Fetching user profile...');
        const token = session.access_token;
        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch user profile:", response.status, errorData);
          throw new Error(errorData.error || "Failed to fetch user profile");
        }

        const userData = await response.json();
        console.log('User data received:', userData);
        
        // Fetch transaction stats (with error handling)
        let transactions = [];
        try {
          const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false });
          
          if (error) {
            console.error("Error fetching transactions:", error);
          } else {
            transactions = data || [];
          }
        } catch (transError) {
          console.error("Exception fetching transactions:", transError);
        }

        const totalTrades = transactions?.length || 0;
        const profitableTrades = transactions?.filter((t: any) => {
          if (t.type === "buy") return false;
          return true;
        }).length || 0;
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

        // Get best trade (simplified)
        const bestTrade = transactions?.find((t: any) => t.type === "sell") || null;

        const userProfile = {
          ...userData,
          stats: {
            totalTrades,
            winRate,
            avgReturn: 0,
            bestTrade: bestTrade ? {
              symbol: bestTrade.symbol,
              date: bestTrade.created_at,
              gain: 0,
            } : {
              symbol: "N/A",
              date: new Date().toISOString(),
              gain: 0,
            },
          },
          preferences: {
            theme: "Dark",
            notifications: true,
            twoFactorAuth: false,
          },
        };
        
        setUser(userProfile);
        setEditForm({
          name: userData.name || authUser.email?.split("@")[0] || "User",
          trading_level: userData.trading_level || "Beginner",
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
        // Set default user profile to prevent infinite loading
        const defaultUser: UserProfile = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
          avatar_url: null,
          account_balance: 100000,
          total_invested: 0,
          member_since: new Date().toISOString(),
          trading_level: "Beginner",
          stats: {
            totalTrades: 0,
            winRate: 0,
            avgReturn: 0,
            bestTrade: {
              symbol: "N/A",
              date: new Date().toISOString(),
              gain: 0,
            },
          },
          preferences: {
            theme: "Dark",
            notifications: true,
            twoFactorAuth: false,
          },
        };
        setUser(defaultUser);
        setEditForm({
          name: defaultUser.name,
          trading_level: defaultUser.trading_level,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    
    // Refresh user data when page becomes visible (after transfer)
    const handleVisibilityChange = () => {
      if (!document.hidden && authUser && session) {
        // Add small delay to ensure backend has processed
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
    };
    
    // Also listen for storage events (when balance updates from other tabs)
    const handleStorageChange = () => {
      if (authUser && session) {
        fetchUserProfile();
      }
    };
    
    // Poll for balance updates every 5 seconds (in case of transfers)
    const pollInterval = setInterval(() => {
      if (authUser && session && !document.hidden) {
        fetchUserProfile();
      }
    }, 5000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom refresh event
    window.addEventListener('balanceUpdated', fetchUserProfile);
    
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('balanceUpdated', fetchUserProfile);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, session, authLoading]);

  const handleSave = async () => {
    if (!session || !user) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const token = session.access_token;
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          trading_level: editForm.trading_level,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      setUser({ ...user, ...updatedUser });
      setIsEditing(false);
      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSaveMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading || !user) {
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
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                    alt={user.name}
                      width={128}
                      height={128}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-primary shadow-blue-glow object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-blue-primary shadow-blue-glow bg-blue-gradient flex items-center justify-center">
                      <UserIcon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-gradient rounded-full border-4 border-dark-card">
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-accent mb-2">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white focus:outline-none focus:border-blue-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-accent mb-2">Trading Level</label>
                        <select
                          value={editForm.trading_level}
                          onChange={(e) => setEditForm({ ...editForm, trading_level: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white focus:outline-none focus:border-blue-primary"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      {saveMessage && (
                        <div className={`p-3 rounded-lg text-sm ${
                          saveMessage.includes("successfully") 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {saveMessage}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-lg bg-blue-gradient text-white font-medium hover:shadow-blue-glow transition-all disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({
                              name: user.name || "",
                              trading_level: user.trading_level || "Beginner",
                            });
                            setSaveMessage(null);
                          }}
                          className="px-4 py-2 rounded-lg border border-dark-border bg-dark-hover text-blue-accent hover:border-blue-primary transition-all"
                        >
                          Cancel
                        </button>
                  </div>
                </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{user.name}</h2>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 rounded-lg border border-dark-border bg-dark-hover text-blue-accent hover:border-blue-primary transition-all text-sm"
                        >
                          Edit Profile
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-blue-accent/70">
                    <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Member since {new Date(user.member_since).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{user.trading_level} Trader</span>
                    </div>
                  </div>
                    </>
                  )}
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
                  {formatCurrency(user.account_balance)}
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
                  {formatCurrency(user.total_invested)}
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
                  <div className="text-xl sm:text-2xl font-bold text-white">{user.stats?.totalTrades || 0}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Win Rate</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {(user.stats?.winRate || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Average Return</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-primary">
                    {formatPercent(user.stats?.avgReturn || 0)}
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-dark-border">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Best Trade</div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">{user.stats?.bestTrade?.symbol || "N/A"}</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">
                      {user.stats?.bestTrade?.date ? new Date(user.stats.bestTrade.date).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {formatCurrency(user.stats?.bestTrade?.gain || 0)}
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
                    {user.preferences?.theme || "Dark"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">Notifications</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">Receive trading alerts</div>
                  </div>
                  <div
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${
                      user.preferences?.notifications
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.preferences?.notifications ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-dark-hover border border-dark-border">
                  <div className="flex-1">
                    <div className="text-sm sm:text-base font-semibold text-blue-accent">Two-Factor Authentication</div>
                    <div className="text-xs sm:text-sm text-blue-accent/70">Enhanced security</div>
                  </div>
                  <div
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${
                      user.preferences?.twoFactorAuth
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {user.preferences?.twoFactorAuth ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Unique User ID */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-blue-accent flex items-center gap-2">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Your Unique ID
                </h3>
                {user.unique_user_id && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.unique_user_id!);
                      // You could add a toast notification here
                      alert("Copied to clipboard!");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-gradient text-white text-xs sm:text-sm font-medium hover:shadow-blue-glow transition-all"
                  >
                    Copy ID
                  </button>
                )}
              </div>
              {user.unique_user_id ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-primary font-mono mb-2">
                    {user.unique_user_id}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-accent/70">
                    Share this ID with others so they can send you credits directly!
                  </p>
                </div>
              ) : (
                <p className="text-blue-accent/70 text-sm">
                  Your unique ID is being generated...
                </p>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}


