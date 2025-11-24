"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import UserSearch from "@/components/UserSearch";
import { formatCurrency } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Award,
  Search,
} from "lucide-react";
import Loading from "@/components/Loading";
import Image from "next/image";

interface UserResult {
  id: string;
  unique_user_id?: string;
  email: string;
  name: string;
  trading_level: string;
  member_since: string;
  avatar_url: string | null;
  has_balance: boolean;
  total_invested: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: authUser, session, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!authUser || !session) {
      router.push("/signin");
      return;
    }
  }, [authUser, session, authLoading, router]);

  const handleSearch = async (query: string) => {
    if (!query.trim() || !session) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = session.access_token;
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!authUser || !session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex pt-0 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Find Users
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-blue-accent/70">
                Search for users by name or ID to view their profiles and send credits
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <UserSearch />
                </div>
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="px-6 py-3 rounded-lg bg-blue-gradient text-white font-semibold hover:shadow-blue-glow transition-all"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </motion.div>

            {/* Results */}
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="h-8 w-8 border-4 border-blue-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-blue-accent/70 mt-4">Searching users...</p>
              </div>
            )}

            {!loading && users.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              >
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/users/${user.id}`)}
                    className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6 cursor-pointer hover:border-blue-primary transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full border-2 border-blue-primary object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-blue-primary bg-blue-gradient flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{user.name}</h3>
                        <p className="text-xs text-blue-accent/70 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-accent/70">Level</span>
                        <span className="text-blue-primary font-medium">{user.trading_level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-accent/70">Invested</span>
                        <span className="text-white font-medium">{formatCurrency(user.total_invested)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-accent/70">Status</span>
                        <span className={`font-medium ${user.has_balance ? 'text-green-400' : 'text-red-400'}`}>
                          {user.has_balance ? "Active" : "No Balance"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-dark-border">
                        <Calendar className="h-3 w-3 text-blue-accent/50" />
                        <span className="text-xs text-blue-accent/70">
                          Joined {new Date(user.member_since).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!loading && users.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <UserIcon className="h-16 w-16 text-blue-accent/30 mx-auto mb-4" />
                <p className="text-blue-accent/70">No users found. Try a different search term.</p>
              </div>
            )}

            {!loading && users.length === 0 && !searchQuery && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-blue-accent/30 mx-auto mb-4" />
                <p className="text-blue-accent/70">Start typing to search for users by name or ID</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

