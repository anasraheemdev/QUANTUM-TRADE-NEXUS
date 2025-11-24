"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Stock } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BuySellModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  type: "buy" | "sell";
}

export default function BuySellModal({
  isOpen,
  onClose,
  stock,
  type,
}: BuySellModalProps) {
  const [quantity, setQuantity] = useState<string>("1");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>("");

  if (!stock) return null;

  const qty = parseFloat(quantity) || 0;
  const price = orderType === "market" ? stock.price : parseFloat(limitPrice) || stock.price;
  const total = qty * price;
  const estimatedCost = total;
  const estimatedFee = total * 0.001; // 0.1% fee
  const totalCost = estimatedCost + estimatedFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static UI only - no actual functionality
    alert(`${type === "buy" ? "Buy" : "Sell"} order submitted (UI only - no backend)`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-lg border border-dark-border bg-dark-card shadow-2xl">
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b border-dark-border ${
                type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                <h2 className="text-xl font-bold text-white">
                  {type === "buy" ? "Buy" : "Sell"} {stock.symbol}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-blue-accent hover:bg-dark-hover hover:text-blue-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Stock Info */}
                <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-blue-accent">{stock.symbol}</div>
                      <div className="text-sm text-blue-accent/70">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(stock.price)}
                      </div>
                      <div className={`text-sm ${
                        stock.change >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change.toFixed(2)} ({stock.changePercent >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Type */}
                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">
                    Order Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType("market")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        orderType === "market"
                          ? "bg-blue-gradient text-white shadow-blue-glow"
                          : "bg-dark-hover text-blue-accent hover:text-blue-primary"
                      }`}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("limit")}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                        orderType === "limit"
                          ? "bg-blue-gradient text-white shadow-blue-glow"
                          : "bg-dark-hover text-blue-accent hover:text-blue-primary"
                      }`}
                    >
                      Limit
                    </button>
                  </div>
                </div>

                {/* Limit Price (if limit order) */}
                {orderType === "limit" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-accent mb-2">
                      Limit Price
                    </label>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={stock.price.toFixed(2)}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                    />
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step="1"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20"
                  />
                </div>

                {/* Order Summary */}
                <div className="rounded-lg bg-dark-hover p-4 border border-dark-border space-y-2">
                  <div className="flex justify-between text-sm text-blue-accent/70">
                    <span>Price per share</span>
                    <span className="text-white">{formatCurrency(price)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-accent/70">
                    <span>Quantity</span>
                    <span className="text-white">{qty}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-accent/70">
                    <span>Estimated Cost</span>
                    <span className="text-white">{formatCurrency(estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-accent/70">
                    <span>Estimated Fee</span>
                    <span className="text-white">{formatCurrency(estimatedFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-dark-border">
                    <div className="flex justify-between font-bold text-white">
                      <span>Total</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                    type === "buy"
                      ? "bg-green-500 hover:bg-green-600 shadow-green-500/50"
                      : "bg-red-500 hover:bg-red-600 shadow-red-500/50"
                  }`}
                >
                  {type === "buy" ? "Buy" : "Sell"} {stock.symbol}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


