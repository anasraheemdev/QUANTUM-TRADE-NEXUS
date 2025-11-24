"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Portfolio } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isPositive = portfolio.totalGain >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-dark-border bg-dark-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-blue-accent/70">Total Value</h3>
          <Wallet className="h-5 w-5 text-blue-primary" />
        </div>
        <div className="text-2xl font-bold text-white">
          {formatCurrency(portfolio.totalValue)}
        </div>
      </motion.div>

      {/* Total Gain/Loss */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-dark-border bg-dark-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-blue-accent/70">Total Gain/Loss</h3>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className={`text-2xl font-bold ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}>
          {formatCurrency(portfolio.totalGain)}
        </div>
        <div className={`text-sm font-medium mt-1 ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}>
          {formatPercent(portfolio.totalGainPercent)}
        </div>
      </motion.div>

      {/* Total Cost */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-dark-border bg-dark-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-blue-accent/70">Total Cost</h3>
          <Wallet className="h-5 w-5 text-blue-accent" />
        </div>
        <div className="text-2xl font-bold text-white">
          {formatCurrency(portfolio.totalCost || portfolio.totalInvested || 0)}
        </div>
      </motion.div>
    </div>
  );
}


