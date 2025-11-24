"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Stock, Portfolio } from "@/lib/types";
import { formatCurrency, formatPercent, fluctuatePrice } from "@/lib/utils";

interface WatchlistProps {
  portfolio: Portfolio;
  allStocks: Stock[];
}

export default function Watchlist({ portfolio, allStocks }: WatchlistProps) {
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>(() => {
    return allStocks.filter((stock) => portfolio.watchlist.includes(stock.symbol));
  });

  useEffect(() => {
    // Fetch real-time data for watchlist stocks
    const fetchWatchlistStocks = async () => {
      try {
        const response = await fetch("/api/stocks");
        const data = await response.json();
        if (!data.error && Array.isArray(data)) {
          const filtered = data.filter((stock: Stock) => portfolio.watchlist.includes(stock.symbol));
          setWatchlistStocks(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch watchlist stocks:", error);
      }
    };

    // Initial fetch
    fetchWatchlistStocks();

    // Update every 30 seconds to respect API rate limits (cached for 30s)
    const interval = setInterval(fetchWatchlistStocks, 30000);

    return () => clearInterval(interval);
  }, [portfolio.watchlist]);

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-6">
      <h2 className="text-xl font-bold text-blue-accent mb-4">Watchlist</h2>
      <div className="space-y-3">
        {watchlistStocks.map((stock, index) => {
          const isPositive = stock.change >= 0;
          return (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/stock/${stock.symbol}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-hover hover:border-blue-primary hover:shadow-blue-glow transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      isPositive ? "bg-green-400/10" : "bg-red-400/10"
                    }`}>
                      {isPositive ? (
                        <TrendingUp className={`h-4 w-4 ${
                          isPositive ? "text-green-400" : "text-red-400"
                        }`} />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-blue-accent">{stock.symbol}</div>
                      <div className="text-xs text-blue-accent/70">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatCurrency(stock.price)}</div>
                    <div className={`text-sm font-medium ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}>
                      {formatPercent(stock.changePercent)}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


