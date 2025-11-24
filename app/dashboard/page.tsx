"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PriceTicker from "@/components/PriceTicker";
import PortfolioSummary from "@/components/PortfolioSummary";
import Watchlist from "@/components/Watchlist";
import MarketMovers from "@/components/MarketMovers";
import StockCard from "@/components/StockCard";
import { Stock, Portfolio } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Loading from "@/components/Loading";

export default function DashboardPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stocks").then((res) => res.json()),
      fetch("/api/portfolio").then((res) => res.json()),
    ])
      .then(([stocksData, portfolioData]) => {
        if (stocksData.error) {
          console.error("API Error:", stocksData.error);
          return;
        }
        if (portfolioData.error) {
          console.error("Portfolio API Error:", portfolioData.error);
          return;
        }
        setStocks(stocksData);
        setPortfolio(portfolioData);
      })
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  if (!portfolio) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <PriceTicker stocks={stocks} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-blue-accent/70 text-lg">
                Overview of your portfolio and market activity
              </p>
            </motion.div>

            {/* Portfolio Summary */}
            <div className="mb-8">
              <PortfolioSummary portfolio={portfolio} />
            </div>

            {/* Portfolio Positions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-accent mb-6">Your Positions</h2>
              <div className="rounded-lg border border-dark-border bg-dark-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-hover border-b border-dark-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
                          Symbol
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
                          Shares
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
                          Avg Price
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
                          Current Price
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
                          Value
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-accent">
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
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-semibold text-blue-accent">
                                  {position.symbol}
                                </div>
                                <div className="text-sm text-blue-accent/70">
                                  {position.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-white">{position.shares}</td>
                            <td className="px-6 py-4 text-white">
                              {formatCurrency(position.avgPrice)}
                            </td>
                            <td className="px-6 py-4 text-white">
                              {formatCurrency(position.currentPrice)}
                            </td>
                            <td className="px-6 py-4 text-white">
                              {formatCurrency(position.currentValue)}
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`flex items-center gap-2 font-semibold ${
                                  isPositive ? "text-green-400" : "text-red-400"
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Watchlist portfolio={portfolio} allStocks={stocks} />
              <MarketMovers stocks={stocks} />
            </div>

            {/* Quick Access Stocks */}
            <div>
              <h2 className="text-2xl font-bold text-blue-accent mb-6">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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


