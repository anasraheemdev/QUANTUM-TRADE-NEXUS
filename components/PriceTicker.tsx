"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Stock } from "@/lib/types";
import { formatCurrency, formatPercent, fluctuatePrice } from "@/lib/utils";

interface PriceTickerProps {
  stocks: Stock[];
}

export default function PriceTicker({ stocks: initialStocks }: PriceTickerProps) {
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);

  useEffect(() => {
    // Fetch real-time data from API every 5 seconds
    const fetchStocks = async () => {
      try {
        const response = await fetch("/api/stocks");
        const data = await response.json();
        if (!data.error && Array.isArray(data)) {
          setStocks(data);
        }
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      }
    };

    // Initial fetch
    if (initialStocks.length === 0) {
      fetchStocks();
    }

    // Update every 30 seconds to respect API rate limits (cached for 30s)
    const interval = setInterval(fetchStocks, 30000);

    return () => clearInterval(interval);
  }, [initialStocks.length]);

  return (
    <div className="w-full overflow-hidden bg-dark-card border-y border-dark-border">
      <div className="flex animate-scroll">
        {[...stocks, ...stocks].map((stock, index) => {
          const isPositive = stock.change >= 0;
          return (
            <motion.div
              key={`${stock.symbol}-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 border-r border-dark-border whitespace-nowrap"
            >
              <span className="font-semibold text-xs sm:text-sm text-blue-accent">{stock.symbol}</span>
              <span className="text-xs sm:text-sm text-white">{formatCurrency(stock.price)}</span>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatPercent(stock.changePercent)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
}


