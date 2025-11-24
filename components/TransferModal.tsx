"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

interface TransferModalProps {
  recipientId: string;
  recipientUniqueId?: string;
  recipientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({
  recipientId,
  recipientUniqueId,
  recipientName,
  onClose,
  onSuccess,
}: TransferModalProps) {
  const { session } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const transferAmount = parseFloat(amount);
    
    if (!transferAmount || transferAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!session) {
      setError("You must be logged in to transfer credits");
      return;
    }

    setIsLoading(true);

    try {
      const token = session.access_token;
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toUserId: recipientId,
          toUniqueId: recipientUniqueId,
          amount: transferAmount,
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transfer failed");
      }

      setSuccess(true);
      
      // Trigger balance update event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        // Also update localStorage to trigger storage event
        localStorage.setItem('balanceUpdate', Date.now().toString());
      }
      
      // Close modal and trigger refresh
      setTimeout(() => {
        onSuccess();
        // Force a hard refresh to ensure balances update
        if (typeof window !== 'undefined') {
          // Small delay to ensure backend has fully processed
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-lg border border-dark-border bg-dark-card p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-accent/70 hover:text-blue-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Send className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transfer Successful!</h3>
              <p className="text-blue-accent/70">
                Credits sent to {recipientName}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Send Credits</h2>
              <p className="text-blue-accent/70 mb-6">
                Transfer credits to <span className="text-blue-primary font-semibold">{recipientName}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-dark-hover border border-dark-border text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for this transfer..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-dark-hover border border-dark-border text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/20 transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-lg border border-dark-border bg-dark-hover text-blue-accent hover:border-blue-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-gradient text-white font-semibold hover:shadow-blue-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

