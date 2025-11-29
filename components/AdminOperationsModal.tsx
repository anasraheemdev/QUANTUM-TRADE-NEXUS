"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, DollarSign, Shield, Bell, AlertCircle, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { notifyBalanceModification, notifyProfileUpdate, notifyCertificationUpdate } from "@/lib/notifications";

interface AdminOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail: string;
  currentBalance: number;
  onSuccess: () => void;
}

type Operation = "edit" | "balance" | "audit" | "notification" | null;

export default function AdminOperationsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  currentBalance,
  onSuccess,
}: AdminOperationsModalProps) {
  const { session } = useAuth();
  const [activeOperation, setActiveOperation] = useState<Operation>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Edit User Form
  const [editForm, setEditForm] = useState({
    name: clientName,
    email: clientEmail,
    trading_level: "",
  });

  // Modify Balance Form
  const [balanceForm, setBalanceForm] = useState({
    action: "add" as "add" | "subtract" | "set",
    amount: "",
    reason: "",
  });

  // Audit Form
  const [auditForm, setAuditForm] = useState({
    certification_status: "pending" as "pending" | "approved" | "rejected",
    notes: "",
  });

  // Notification Form
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
  });

  if (!isOpen) return null;

  const handleEditUser = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          trading_level: editForm.trading_level || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      // Create notification for profile update
      try {
        const changes: string[] = [];
        if (editForm.name !== clientName) changes.push("name");
        if (editForm.email !== clientEmail) changes.push("email");
        if (editForm.trading_level) changes.push("trading level");
        
        if (changes.length > 0) {
          console.log("🔔 Attempting to create profile update notification");
          const notificationResult = await notifyProfileUpdate(clientId, changes, session.user.id);
          console.log("🔔 Profile notification creation result:", notificationResult);
        }
      } catch (notificationError) {
        console.error("❌ Error creating profile notification (non-fatal):", notificationError);
        // Don't fail the operation if notification fails
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleModifyBalance = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const amount = parseFloat(balanceForm.amount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      // Get current balance first
      const getResponse = await fetch(`/api/admin/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!getResponse.ok) {
        throw new Error("Failed to fetch current balance");
      }

      const { client } = await getResponse.json();
      const currentBal = Number(client.account_balance) || 0;

      let newBalance: number;
      if (balanceForm.action === "add") {
        newBalance = currentBal + amount;
      } else if (balanceForm.action === "subtract") {
        newBalance = Math.max(0, currentBal - amount);
      } else {
        newBalance = amount;
      }

      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          account_balance: newBalance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to modify balance");
      }

      // Record audit log
      await fetch("/api/admin/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          action: "balance_modification",
          details: {
            action: balanceForm.action,
            amount: amount,
            previous_balance: currentBal,
            new_balance: newBalance,
            reason: balanceForm.reason,
          },
        }),
      });

      // Create notification for balance modification
      try {
        console.log("🔔 Attempting to create balance modification notification");
        const notificationResult = await notifyBalanceModification(
          clientId,
          balanceForm.action,
          amount,
          currentBal,
          newBalance,
          balanceForm.reason,
          session.user.id
        );
        console.log("🔔 Balance notification creation result:", notificationResult);
      } catch (notificationError) {
        console.error("❌ Error creating balance notification (non-fatal):", notificationError);
        // Don't fail the operation if notification fails
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to modify balance");
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          action: "certification_update",
          details: {
            certification_status: auditForm.certification_status,
            notes: auditForm.notes,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update certification");
      }

      // Create notification for certification update
      try {
        console.log("🔔 Attempting to create certification notification");
        const notificationResult = await notifyCertificationUpdate(
          clientId,
          auditForm.certification_status,
          auditForm.notes,
          session.user.id
        );
        console.log("🔔 Certification notification creation result:", notificationResult);
      } catch (notificationError) {
        console.error("❌ Error creating certification notification (non-fatal):", notificationError);
        // Don't fail the operation if notification fails
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update certification");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!notificationForm.title || !notificationForm.message) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: clientId,
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send notification");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const renderOperationContent = () => {
    switch (activeOperation) {
      case "edit":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Trading Level
              </label>
              <select
                value={editForm.trading_level}
                onChange={(e) => setEditForm({ ...editForm, trading_level: e.target.value })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              >
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <button
              onClick={handleEditUser}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        );

      case "balance":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Action
              </label>
              <select
                value={balanceForm.action}
                onChange={(e) => setBalanceForm({ ...balanceForm, action: e.target.value as any })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              >
                <option value="add">Add Balance</option>
                <option value="subtract">Subtract Balance</option>
                <option value="set">Set Balance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Amount
              </label>
              <input
                type="number"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })}
                placeholder="Enter reason for balance modification"
                rows={3}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              />
            </div>
            <div className="bg-dark-hover border border-dark-border rounded-lg p-4">
              <p className="text-sm text-blue-accent/70 mb-1">Current Balance:</p>
              <p className="text-xl font-bold text-white">{formatCurrency(currentBalance)}</p>
            </div>
            <button
              onClick={handleModifyBalance}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Modify Balance"}
            </button>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Certification Status
              </label>
              <select
                value={auditForm.certification_status}
                onChange={(e) => setAuditForm({ ...auditForm, certification_status: e.target.value as any })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Notes
              </label>
              <textarea
                value={auditForm.notes}
                onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                placeholder="Enter audit notes"
                rows={4}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              />
            </div>
            <button
              onClick={handleAudit}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Update Certification"}
            </button>
          </div>
        );

      case "notification":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Title
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                placeholder="Notification title"
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Message
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-accent mb-2">
                Type
              </label>
              <select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-primary"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button
              onClick={handleSendNotification}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveOperation("edit")}
              className="flex flex-col items-center gap-2 p-6 bg-dark-hover border border-dark-border rounded-lg hover:border-blue-primary transition-all"
            >
              <Edit className="h-8 w-8 text-blue-primary" />
              <span className="text-white font-medium">Edit User</span>
            </button>
            <button
              onClick={() => setActiveOperation("balance")}
              className="flex flex-col items-center gap-2 p-6 bg-dark-hover border border-dark-border rounded-lg hover:border-blue-primary transition-all"
            >
              <DollarSign className="h-8 w-8 text-green-400" />
              <span className="text-white font-medium">Modify Balance</span>
            </button>
            <button
              onClick={() => setActiveOperation("audit")}
              className="flex flex-col items-center gap-2 p-6 bg-dark-hover border border-dark-border rounded-lg hover:border-blue-primary transition-all"
            >
              <Shield className="h-8 w-8 text-purple-400" />
              <span className="text-white font-medium">Audit & Certification</span>
            </button>
            <button
              onClick={() => setActiveOperation("notification")}
              className="flex flex-col items-center gap-2 p-6 bg-dark-hover border border-dark-border rounded-lg hover:border-blue-primary transition-all"
            >
              <Bell className="h-8 w-8 text-yellow-400" />
              <span className="text-white font-medium">Send Notification</span>
            </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-dark-card border border-dark-border rounded-lg shadow-xl w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-border">
            <div>
              <h2 className="text-xl font-bold text-white">
                {activeOperation === "edit" && "Edit User"}
                {activeOperation === "balance" && "Modify Balance"}
                {activeOperation === "audit" && "Audit & Certification"}
                {activeOperation === "notification" && "Send Notification"}
                {!activeOperation && "Admin Operations"}
              </h2>
              <p className="text-sm text-blue-accent/70 mt-1">
                {!activeOperation && `Managing: ${clientName}`}
                {activeOperation && `Client: ${clientName}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeOperation && (
                <button
                  onClick={() => {
                    setActiveOperation(null);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="px-4 py-2 text-blue-accent hover:text-blue-primary transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={onClose}
                className="text-blue-accent/70 hover:text-blue-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>Operation completed successfully!</span>
              </div>
            )}

            {renderOperationContent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

