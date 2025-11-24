"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
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

export default function UserSearch() {
  const router = useRouter();
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!session) return;

      setIsSearching(true);
      try {
        const token = session.access_token;
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.users || []);
          setShowResults(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Search API error:", errorData);
          setResults([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, session]);

  const handleUserClick = (user: SearchResult) => {
    setShowResults(false);
    setSearchQuery("");
    // Use unique_user_id if available, otherwise use UUID
    const identifier = user.unique_user_id || user.id;
    router.push(`/users/${identifier}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-accent/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="Search users by name or ID..."
          className="w-full pl-10 pr-10 py-3 rounded-lg bg-dark-hover border border-dark-border text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-accent/50 hover:text-blue-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-dark-border bg-dark-card shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-4 text-center text-blue-accent/70">
                Searching...
              </div>
            ) : (
              <div className="py-2">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="w-full px-4 py-3 hover:bg-dark-hover transition-colors text-left flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-gradient flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{user.name}</div>
                      <div className="text-xs text-blue-accent/70 truncate">{user.email}</div>
                      {user.unique_user_id && (
                        <div className="text-xs text-blue-primary font-mono mt-1">
                          {user.unique_user_id}
                        </div>
                      )}
                      <div className="text-xs text-blue-accent/50 mt-1">
                        {user.trading_level} • {user.has_balance ? "Active" : "No Balance"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && !isSearching && results.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-dark-border bg-dark-card shadow-xl z-50 p-4 text-center text-blue-accent/70"
        >
          No users found
        </motion.div>
      )}
    </div>
  );
}

