"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import StockChart from "@/components/StockChart";
import BuySellModal from "@/components/BuySellModal";
import { Stock, StockHistory } from "@/lib/types";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Loading from "@/components/Loading";

export default function StockDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const [stock, setStock] = useState<Stock | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  useEffect(() => {
    // Fetch stock data
    fetch(`/api/stock/${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }
        setStock(data);
      })
      .catch((err) => console.error("Failed to fetch stock:", err));

    // Fetch stock history
    fetch(`/api/stock/${symbol}/history?interval=1day&outputsize=30`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }
        setHistory(data);
      })
      .catch((err) => console.error("Failed to fetch history:", err));
  }, [symbol]);

  if (!stock || !history) {
    return <Loading />;
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-accent hover:text-blue-primary mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Markets</span>
            </Link>

            {/* Stock Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{stock.symbol}</h1>
                  <p className="text-blue-accent/70 text-lg">{stock.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-all shadow-lg shadow-green-500/50"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Buy
                  </button>
                  <button
                    onClick={() => setIsSellModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-lg shadow-red-500/50"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Sell
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Price Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <div className="text-sm text-blue-accent/70 mb-2">Current Price</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(stock.price)}</div>
                <div
                  className={`flex items-center gap-2 mt-2 text-sm font-medium ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <div className="text-sm text-blue-accent/70 mb-2">Market Cap</div>
                <div className="text-2xl font-bold text-white">
                  {formatLargeNumber(stock.marketCap)}
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <div className="text-sm text-blue-accent/70 mb-2">Volume</div>
                <div className="text-2xl font-bold text-white">
                  {formatLargeNumber(stock.volume)}
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <div className="text-sm text-blue-accent/70 mb-2">Sector</div>
                <div className="text-2xl font-bold text-blue-primary">{stock.sector}</div>
              </div>
            </motion.div>

            {/* Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <StockChart history={history} />
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <h3 className="text-xl font-bold text-blue-accent mb-4">About {stock.name}</h3>
                <p className="text-blue-accent/70 leading-relaxed">
                  {stock.name} is a leading company in the {stock.sector} sector. The stock has
                  shown {isPositive ? "positive" : "negative"} performance with a current price of{" "}
                  {formatCurrency(stock.price)}. Market capitalization stands at{" "}
                  {formatLargeNumber(stock.marketCap)} with a trading volume of{" "}
                  {formatLargeNumber(stock.volume)} shares.
                </p>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-6">
                <h3 className="text-xl font-bold text-blue-accent mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-accent/70">52 Week High</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(stock.price * 1.2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-accent/70">52 Week Low</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(stock.price * 0.8)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-accent/70">Average Volume</span>
                    <span className="text-white font-semibold">
                      {formatLargeNumber(stock.volume * 0.9)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-accent/70">P/E Ratio</span>
                    <span className="text-white font-semibold">28.5</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <BuySellModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        stock={stock}
        type="buy"
      />
      <BuySellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        stock={stock}
        type="sell"
      />
    </div>
  );
}


