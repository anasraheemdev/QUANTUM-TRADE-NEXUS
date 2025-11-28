"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AdminTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientBalance: number;
  onTradeSuccess: () => void;
}

export default function AdminTradeModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientBalance,
  onTradeSuccess,
}: AdminTradeModalProps) {
  const { session } = useAuth();
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch stock price when symbol changes
  useEffect(() => {
    if (symbol && symbol.length >= 1) {
      const fetchStockPrice = async () => {
        try {
          const response = await fetch(`/api/stock/${symbol.toUpperCase()}`);
          if (response.ok) {
            const data = await response.json();
            setStockPrice(data.price);
          } else {
            setStockPrice(null);
          }
        } catch (err) {
          setStockPrice(null);
        }
      };
      fetchStockPrice();
    } else {
      setStockPrice(null);
    }
  }, [symbol]);

  const totalCost = stockPrice && quantity ? stockPrice * parseFloat(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!symbol || !quantity) {
      setError("Please fill in all fields");
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    if (type === "buy" && totalCost > clientBalance) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      if (!session) {
        setError("You must be logged in to execute trades");
        setLoading(false);
        return;
      }

      if (!session.access_token) {
        console.error("No access token in session:", session);
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      console.log("Executing trade:", { clientId, symbol, type, quantity: qty });
      console.log("Session token exists:", !!session.access_token);
      console.log("Session expires at:", session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "N/A");
      console.log("Current time:", new Date().toISOString());
      
      // Check if token is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.error("Token expired!");
        setError("Session expired. Please refresh the page and try again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId,
          symbol: symbol.toUpperCase(),
          type,
          quantity: qty,
        }),
      });

      console.log("Trade API response status:", response.status, response.statusText);

      let data;
      try {
        data = await response.json();
        console.log("Trade API response data:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        const text = await response.text();
        console.error("Response text:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error("Trade failed:", { 
          status: response.status, 
          statusText: response.statusText,
          data 
        });
        const errorMsg = data?.error || data?.details || `Trade failed: ${response.status} ${response.statusText}`;
        const fullError = data?.details ? `${data.error}: ${data.details}` : errorMsg;
        console.error("Full error message:", fullError);
        throw new Error(fullError);
      }

      console.log("Trade successful! Response:", data);
      console.log("Updated balance from API:", data.updatedBalance);

      setSuccess(true);
      
      // Call onTradeSuccess immediately to refresh data
      // This will fetch the latest data from the database
      onTradeSuccess();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSymbol("");
        setQuantity("");
        setType("buy");
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Trade execution error:", err);
      const errorMessage = err.message || "Failed to execute trade";
      setError(errorMessage);
      
      // If it's a network error, show a more helpful message
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-dark-card border border-dark-border rounded-lg shadow-xl w-full max-w-md z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-border">
            <div>
              <h2 className="text-xl font-bold text-white">Execute Trade</h2>
              <p className="text-sm text-blue-accent/70 mt-1">
                Trading on behalf of: <span className="text-blue-primary">{clientName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-accent/70 hover:text-blue-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Trade Type */}
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Trade Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("buy")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    type === "buy"
                      ? "bg-green-500/10 border-green-500 text-green-400"
                      : "bg-dark-hover border-dark-border text-blue-accent hover:border-green-500/50"
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setType("sell")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    type === "sell"
                      ? "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-dark-hover border-dark-border text-blue-accent hover:border-red-500/50"
                  }`}
                >
                  <TrendingDown className="h-5 w-5" />
                  Sell
                </button>
              </div>
            </div>

            {/* Stock Symbol */}
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Stock Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary transition-colors"
                required
              />
              {stockPrice && (
                <p className="mt-2 text-sm text-green-400">
                  Current Price: {formatCurrency(stockPrice)}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary transition-colors"
                required
              />
            </div>

            {/* Total Cost */}
            {stockPrice && quantity && (
              <div className="bg-dark-hover border border-dark-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-accent">Total {type === "buy" ? "Cost" : "Value"}:</span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                {type === "buy" && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-blue-accent/70">Client Balance:</span>
                    <span className={totalCost > clientBalance ? "text-red-400" : "text-green-400"}>
                      {formatCurrency(clientBalance)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>Trade executed successfully!</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-blue-accent hover:text-blue-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !symbol || !quantity || !stockPrice}
                className="flex-1 px-4 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : `${type === "buy" ? "Buy" : "Sell"} Stock`}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

