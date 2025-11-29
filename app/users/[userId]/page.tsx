"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  ArrowLeft,
  Send,
} from "lucide-react";
import Loading from "@/components/Loading";

interface PublicUserProfile {
  id: string;
  unique_user_id?: string;
  email: string;
  name: string;
  avatar_url: string | null;
  account_balance?: number;
  total_invested: number;
  member_since: string;
  trading_level: string;
  has_balance?: boolean;
}

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, session, loading: authLoading } = useAuth();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = params.userId as string;

  useEffect(() => {
    if (authLoading) return;
    
    if (!authUser || !session) {
      router.push("/signin");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const token = session.access_token;
        // Support both UUID and unique_user_id in URL
        const identifier = userId; // Can be UUID or unique_user_id
        const response = await fetch(`/api/users/${encodeURIComponent(identifier)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user profile");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err instanceof Error ? err.message : "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    
    // Refresh user data when page becomes visible (after transfer)
    const handleVisibilityChange = () => {
      if (!document.hidden && authUser && session) {
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
    };
    
    // Listen for balance update events
    const handleBalanceUpdate = () => {
      if (authUser && session) {
        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
  }, [userId, authUser, session, authLoading, router]);

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="flex pt-0 lg:pt-0">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
                <p className="text-red-400 mb-4">{error || "User not found"}</p>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 rounded-lg bg-blue-gradient text-white hover:shadow-blue-glow transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isOwnProfile = authUser?.id === user.id;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex pt-0 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-accent hover:text-blue-primary mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                {isOwnProfile ? "Your Profile" : `${user.name}'s Profile`}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-blue-accent/70">
                {isOwnProfile 
                  ? "Manage your account settings and view your trading statistics"
                  : "View user profile and trading statistics"
                }
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
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      {user.name}
                    </h2>
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
                </div>
              </div>
            </motion.div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-accent/70">
                    {isOwnProfile ? "Account Balance" : "Account Status"}
                  </h3>
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {isOwnProfile 
                    ? formatCurrency(user.account_balance || 0)
                    : (user.has_balance ? "Active" : "No Balance")
                  }
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
                  {formatCurrency(user.total_invested || 0)}
                </div>
              </motion.div>
            </div>

            {/* Unique User ID */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-blue-accent/70">Unique User ID</h3>
                <button
                  onClick={() => {
                    if (user.unique_user_id) {
                      navigator.clipboard.writeText(user.unique_user_id);
                      // You could add a toast notification here
                    }
                  }}
                  className="text-xs text-blue-primary hover:text-blue-secondary transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg sm:text-xl font-bold text-blue-primary font-mono">
                  {user.unique_user_id || "Not assigned"}
                </p>
                {user.unique_user_id && (
                  <span className="text-xs text-blue-accent/70">
                    (Share this ID to receive credits)
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <p className="text-xs text-blue-accent/50 mt-2">
                  Share this ID with others so they can send you credits!
                </p>
              )}
            </motion.div>
          </div>
        </main>
      </div>

    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfileContent />
    </Suspense>
  );
}

