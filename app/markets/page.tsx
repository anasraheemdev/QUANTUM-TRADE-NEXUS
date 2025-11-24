"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PriceTicker from "@/components/PriceTicker";
import StockCard from "@/components/StockCard";
import MarketMovers from "@/components/MarketMovers";
import { Stock } from "@/lib/types";
import { useEffect, useState } from "react";

export default function MarketsPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    fetch("/api/stocks")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }
        setStocks(data);
      })
      .catch((err) => console.error("Failed to fetch stocks:", err));
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <PriceTicker stocks={stocks} />
      <div className="flex pt-0 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="mb-6 sm:mb-8">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2"
              >
                Markets
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-blue-accent/70 text-sm sm:text-base lg:text-lg"
              >
                Explore real-time stock market data and trading opportunities
              </motion.p>
            </div>

            {/* Market Movers */}
            <div className="mb-6 sm:mb-8">
              <MarketMovers stocks={stocks} />
            </div>

            {/* All Stocks Grid */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-accent mb-4 sm:mb-6">All Stocks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {stocks.map((stock, index) => (
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

