"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  User,
  Mail,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  Edit,
  RefreshCw,
} from "lucide-react";
import Loading from "@/components/Loading";
import Link from "next/link";
import AdminTradeModal from "@/components/AdminTradeModal";

interface ClientData {
  client: {
    id: string;
    name: string;
    email: string;
    account_balance: number;
    total_invested: number;
    trading_level: string;
    member_since: string;
    unique_user_id?: string;
  };
  positions: Array<{
    id: string;
    symbol: string;
    quantity: number;
    average_price: number;
    current_price: number;
  }>;
  transactions: Array<{
    id: string;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
    total_amount: number;
    created_at: string;
  }>;
}

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);

  const clientId = params.clientId as string;

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!session) {
        router.push("/signin?redirect=/admin/clients");
        return;
      }

      try {
        // Check if user is admin
        const adminCheck = await fetch("/api/admin/check", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const adminData = await adminCheck.json();
        if (!adminData.isAdmin) {
          setError("Unauthorized: Admin access required");
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        await fetchClientData();
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load client data");
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminAndFetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading, router, clientId]);

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch client data");
      }

      const clientData = await response.json();
      console.log("Client data received:", clientData);
      
      // Ensure data structure is correct
      if (!clientData.client) {
        throw new Error("Invalid client data structure");
      }
      
      setData(clientData);
    } catch (err: any) {
      console.error("Error fetching client data:", err);
      setError(err.message || "Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <Loading />
        </div>
      </>
    );
  }

  if (error || !isAdmin || !data) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                <p className="text-blue-accent/70">{error || "Client not found"}</p>
                <Link
                  href="/admin/clients"
                  className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                >
                  Back to Clients
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { client, positions, transactions } = data;
  const portfolioValue = positions.reduce(
    (sum, pos) => sum + pos.quantity * pos.current_price,
    0
  );

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/clients"
              className="inline-flex items-center gap-2 text-blue-accent hover:text-blue-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{client.name || "Client"}</h1>
                <p className="text-blue-accent/70">{client.email}</p>
                {client.unique_user_id && (
                  <p className="text-sm text-blue-accent/50 mt-1">
                    ID: {client.unique_user_id}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowTradeModal(true)}
                className="px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all flex items-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                Execute Trade
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                <span className="text-blue-accent/70 text-sm">Account Balance</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(client.account_balance || 0)}
              </p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-purple-400" />
                <span className="text-blue-accent/70 text-sm">Total Invested</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(client.total_invested || 0)}
              </p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-blue-primary" />
                <span className="text-blue-accent/70 text-sm">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(portfolioValue)}
              </p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="h-6 w-6 text-yellow-400" />
                <span className="text-blue-accent/70 text-sm">Trading Level</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {client.trading_level || "Beginner"}
              </p>
            </div>
          </div>

          {/* Portfolio Positions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Portfolio Positions</h2>
            {positions.length === 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                <p className="text-blue-accent/70">No positions yet</p>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-hover">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Avg Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {positions.map((position) => {
                        const value = position.quantity * position.current_price;
                        const gain = value - position.quantity * position.average_price;
                        const gainPercent = (gain / (position.quantity * position.average_price)) * 100;

                        return (
                          <tr key={position.id} className="hover:bg-dark-hover transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                              {position.symbol}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70">
                              {position.quantity.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70">
                              {formatCurrency(position.average_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              {formatCurrency(position.current_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-white">{formatCurrency(value)}</p>
                                <p className={`text-xs ${gain >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {gain >= 0 ? "+" : ""}
                                  {formatCurrency(gain)} ({formatPercent(gainPercent)})
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                <p className="text-blue-accent/70">No transactions yet</p>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-hover">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-dark-hover transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70 text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === "buy"
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                            {transaction.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70">
                            {transaction.quantity.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">
                            {formatCurrency(transaction.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <AdminTradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          clientId={client.id}
          clientName={client.name || client.email}
          clientBalance={client.account_balance || 0}
          onTradeSuccess={() => {
            fetchClientData();
          }}
        />
      )}
    </div>
    </> 
  );
}
