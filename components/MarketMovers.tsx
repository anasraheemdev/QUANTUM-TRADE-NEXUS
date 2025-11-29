"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Stock } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface MarketMoversProps {
  stocks: Stock[];
}

export default function MarketMovers({ stocks }: MarketMoversProps) {
  // Sort by change percentage
  const sortedStocks = [...stocks].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );
  const topMovers = sortedStocks.slice(0, 5);

  return (
    <div className="rounded-lg border border-dark-border bg-dark-card p-6">
      <h2 className="text-xl font-bold text-blue-accent mb-4">Market Movers</h2>
      <div className="space-y-3">
        {topMovers.map((stock, index) => {
          const isPositive = stock.change >= 0;
          return (
            <motion.div
              key={`${stock.symbol}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/stock/${stock.symbol}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-hover hover:border-blue-primary hover:shadow-blue-glow transition-all cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded ${
                      isPositive ? "bg-green-400/10" : "bg-red-400/10"  
                    }`}>                                                
                      {isPositive ? (                                    
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (                                               
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-accent">{stock.symbol}</div>
                      <div className="text-xs text-blue-accent/70">{stock.name}</div>
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
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


