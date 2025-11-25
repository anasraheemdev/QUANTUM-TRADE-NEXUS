"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PriceTicker from "@/components/PriceTicker";
import PortfolioSummary from "@/components/PortfolioSummary";
import Watchlist from "@/components/Watchlist";
import MarketMovers from "@/components/MarketMovers";
import StockCard from "@/components/StockCard";
import { useAuth } from "@/contexts/AuthContext";
import { Stock, Portfolio } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Loading from "@/components/Loading";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Only redirect if auth is done loading and user is still not authenticated
    if (!user) {
      console.log('No user, redirecting to signin');
      router.replace("/signin?redirect=/dashboard");
      return;
    }
    
    // Check if user is admin and redirect to admin dashboard
    const checkAdminAndRedirect = async () => {
      if (session) {
        try {
          const response = await fetch("/api/admin/check", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const data = await response.json();
          if (data.isAdmin) {
            router.replace("/admin");
            return;
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    
    checkAdminAndRedirect();
    
    // User exists, proceed with data fetching
    if (!user) {
      return;
    }

    const fetchData = async () => {
      try {
        // Get session token if available
        const token = session?.access_token;
        const [stocksResponse, portfolioResponse] = await Promise.all([
          fetch("/api/stocks"),
          fetch("/api/portfolio", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const stocksData = await stocksResponse.json();
        const portfolioData = await portfolioResponse.json();

        if (stocksData.error) {
          console.error("Stocks API Error:", stocksData.error);
          setStocks([]); // Set empty array on error
        } else {
          setStocks(stocksData);
        }

        if (portfolioData.error) {
          console.error("Portfolio API Error:", portfolioData.error);
          // Set default empty portfolio on error
          setPortfolio({
            accountBalance: 100000,
            totalInvested: 0,
            positions: [],
            totalValue: 0,
            totalGain: 0,
            totalGainPercent: 0,
            totalCost: 0,
            watchlist: [],
          });
        } else {
          // Ensure portfolio has all required fields
          const totalCost = portfolioData.totalInvested || portfolioData.totalCost || 0;
          setPortfolio({
            accountBalance: portfolioData.accountBalance || 100000,
            totalInvested: portfolioData.totalInvested || 0,
            positions: portfolioData.positions || [],
            totalValue: portfolioData.totalValue || 0,
            totalGain: portfolioData.totalGain || 0,
            totalGainPercent: portfolioData.totalGainPercent || 0,
            totalCost: totalCost,
            watchlist: portfolioData.watchlist || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        // Set default values on error
        setStocks([]);
        setPortfolio({
          accountBalance: 100000,
          totalInvested: 0,
          positions: [],
          totalValue: 0,
          totalGain: 0,
          totalGainPercent: 0,
          totalCost: 0,
          watchlist: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Listen for balance update events
    const handleBalanceUpdate = () => {
      if (user && session) {
        setTimeout(() => {
          fetchData();
        }, 500);
      }
    };
    
    // Poll for balance updates every 5 seconds
    const pollInterval = setInterval(() => {
      if (user && session && !document.hidden) {
        fetchData();
      }
    }, 5000);
    
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, authLoading]);

  // Debug logging
  console.log('Dashboard render check:', {
    authLoading,
    loading,
    hasUser: !!user,
    hasSession: !!session,
    hasPortfolio: !!portfolio,
    userEmail: user?.email
  });

  if (authLoading || loading) {
    console.log('Dashboard: Showing loading screen');
    return <Loading />;
  }

  // Ensure portfolio is set before rendering
  if (!portfolio) {
    console.log('Dashboard: No portfolio, showing loading');
    return <Loading />;
  }

  console.log('Dashboard: Rendering dashboard content');

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <PriceTicker stocks={stocks} />
      <div className="flex pt-0 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">My Portfolio</h1>
                  <p className="text-blue-accent/70 text-sm sm:text-base lg:text-lg">
                    View your investments and market activity
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
                    <p className="text-xs text-blue-400">
                      <span className="font-semibold">Note:</span> Trading is managed by administrators
                    </p>
                  </div>
                </div>
              </div>
              {/* Mobile notice */}
              <div className="sm:hidden bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-400">
                  <span className="font-semibold">Note:</span> Trading is managed by administrators
                </p>
              </div>
            </motion.div>

            {/* Portfolio Summary */}
            <div className="mb-6 sm:mb-8">
              <PortfolioSummary portfolio={portfolio} />
            </div>

            {/* Portfolio Positions */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-accent">Your Positions</h2>
                <Link
                  href="/transactions"
                  className="text-sm text-blue-primary hover:text-blue-accent transition-colors"
                >
                  View Trade History →
                </Link>
              </div>
              <div className="rounded-lg border border-dark-border bg-dark-card overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-dark-hover border-b border-dark-border">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Symbol
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Shares
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Avg Price
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Current Price
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Value
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-blue-accent">
                          Gain/Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.positions.map((position, index) => {
                        const isPositive = position.gain >= 0;
                        return (
                          <motion.tr
                            key={position.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-dark-border hover:bg-dark-hover transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div>
                                <div className="font-semibold text-sm sm:text-base text-blue-accent">
                                  {position.symbol}
                                </div>
                                <div className="text-xs sm:text-sm text-blue-accent/70">
                                  {position.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">{position.shares}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">
                              {formatCurrency(position.avgPrice)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">
                              {formatCurrency(position.currentPrice)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-white">
                              {formatCurrency(position.currentValue)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div
                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold ${
                                  isPositive ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                                <span>
                                  {formatCurrency(position.gain)} (
                                  {position.gainPercent >= 0 ? "+" : ""}
                                  {position.gainPercent.toFixed(2)}%)
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Watchlist and Market Movers Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Watchlist portfolio={portfolio} allStocks={stocks} />
              <MarketMovers stocks={stocks} />
            </div>

            {/* Quick Access Stocks */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-accent mb-4 sm:mb-6">Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stocks.slice(0, 4).map((stock, index) => (
                  <StockCard key={stock.symbol} stock={stock} index={index} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


