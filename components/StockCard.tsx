"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Stock } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface StockCardProps {
  stock: Stock;
  index?: number;
}

export default function StockCard({ stock, index = 0 }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group"
    >
      <Link href={`/stock/${stock.symbol}`}>
        <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6 transition-all hover:border-blue-primary hover:shadow-blue-glow cursor-pointer">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-blue-accent group-hover:text-blue-primary transition-colors truncate">
                {stock.symbol}
              </h3>
              <p className="text-xs sm:text-sm text-blue-accent/70 truncate">{stock.name}</p>
            </div>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0 ml-2" />
            ) : (
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 ml-2" />
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xl sm:text-2xl font-bold text-white">
              {formatCurrency(stock.price)}
            </div>
            <div className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span>{formatCurrency(Math.abs(stock.change))}</span>
              <span>({formatPercent(stock.changePercent)})</span>
            </div>
            <div className="text-xs text-blue-accent/60">
              Vol: {stock.volume.toLocaleString()}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


