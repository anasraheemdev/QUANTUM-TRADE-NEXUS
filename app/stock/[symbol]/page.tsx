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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch stock data with timeout
    const stockTimeout = setTimeout(() => {
      if (isMounted && !stock) {
        setError("Stock data is taking longer than expected. Please try again.");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    fetch(`/api/stock/${symbol}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        clearTimeout(stockTimeout);
        if (!isMounted) return;
        
        if (data.error) {
          console.error("API Error:", data.error);
          setError(data.error);
          setLoading(false);
          return;
        }
        setStock(data);
        if (!history) {
          setLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(stockTimeout);
        if (!isMounted) return;
        console.error("Failed to fetch stock:", err);
        setError("Failed to load stock data. Please try again.");
        setLoading(false);
      });

    // Fetch stock history with timeout (optional - don't block page render)
    const historyTimeout = setTimeout(() => {
      if (isMounted && !history) {
        console.warn("History data timeout - continuing without history");
      }
    }, 15000); // 15 second timeout

    fetch(`/api/stock/${symbol}/history?interval=1day&outputsize=30`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        clearTimeout(historyTimeout);
        if (!isMounted) return;
        
        if (data.error) {
          console.error("API Error:", data.error);
          // Don't set error for history - it's optional
          // Create empty history data structure
          setHistory({
            symbol: symbol.toUpperCase(),
            name: stock?.name || symbol.toUpperCase(),
            lineData: [],
            candleData: [],
          });
          return;
        }
        setHistory(data);
        if (stock) {
          setLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(historyTimeout);
        if (!isMounted) return;
        console.error("Failed to fetch history:", err);
        // Don't block page render if history fails - create empty structure
        setHistory({
          symbol: symbol.toUpperCase(),
          name: stock?.name || symbol.toUpperCase(),
          lineData: [],
          candleData: [],
        });
        if (stock) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(stockTimeout);
      clearTimeout(historyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  if (loading && !stock) {
    return <Loading />;
  }

  if (error && !stock) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="flex pt-0 lg:pt-0">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
            <div className="max-w-7xl mx-auto">
              <div className="rounded-lg border border-red-500 bg-dark-card p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">Error Loading Stock</h2>
                <p className="text-sm sm:text-base text-blue-accent/70 mb-4">{error}</p>
                <Link
                  href="/markets"
                  className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-accent hover:text-blue-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Markets</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!stock) {
    return <Loading />;
  }

  const isPositive = stock.change >= 0;

  return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="flex pt-0 lg:pt-0">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full lg:ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-accent hover:text-blue-primary mb-4 sm:mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Markets</span>
            </Link>

            {/* Stock Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{stock.symbol}</h1>
                  <p className="text-sm sm:text-base lg:text-lg text-blue-accent/70">{stock.name}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base font-semibold transition-all shadow-lg shadow-green-500/50"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Buy</span>
                  </button>
                  <button
                    onClick={() => setIsSellModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base font-semibold transition-all shadow-lg shadow-red-500/50"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Sell</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Price Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Current Price</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stock.price)}</div>
                <div
                  className={`flex items-center gap-1 sm:gap-2 mt-2 text-xs sm:text-sm font-medium ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span>
                    {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Market Cap</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {formatLargeNumber(stock.marketCap)}
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Volume</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {formatLargeNumber(stock.volume)}
                </div>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <div className="text-xs sm:text-sm text-blue-accent/70 mb-2">Sector</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-primary">{stock.sector}</div>
              </div>
            </motion.div>

            {/* Charts */}
            {history && history.lineData && history.lineData.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 sm:mb-8"
              >
                <StockChart history={history} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 sm:mb-8"
              >
                <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-blue-accent/70">
                    Chart data is currently unavailable. Please try refreshing the page.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            >
              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-blue-accent mb-3 sm:mb-4">About {stock.name}</h3>
                <p className="text-sm sm:text-base text-blue-accent/70 leading-relaxed">
                  {stock.name} is a leading company in the {stock.sector} sector. The stock has
                  shown {isPositive ? "positive" : "negative"} performance with a current price of{" "}
                  {formatCurrency(stock.price)}. Market capitalization stands at{" "}
                  {formatLargeNumber(stock.marketCap)} with a trading volume of{" "}
                  {formatLargeNumber(stock.volume)} shares.
                </p>
              </div>

              <div className="rounded-lg border border-dark-border bg-dark-card p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-blue-accent mb-3 sm:mb-4">Key Metrics</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-blue-accent/70">52 Week High</span>
                    <span className="text-sm sm:text-base text-white font-semibold">
                      {formatCurrency(stock.price * 1.2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-blue-accent/70">52 Week Low</span>
                    <span className="text-sm sm:text-base text-white font-semibold">
                      {formatCurrency(stock.price * 0.8)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-blue-accent/70">Average Volume</span>
                    <span className="text-sm sm:text-base text-white font-semibold">
                      {formatLargeNumber(stock.volume * 0.9)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-blue-accent/70">P/E Ratio</span>
                    <span className="text-sm sm:text-base text-white font-semibold">28.5</span>
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


