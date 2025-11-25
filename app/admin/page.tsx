"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Loading from "@/components/Loading";
import Link from "next/link";

interface AdminStats {
  totalClients: number;
  totalBalance: number;
  totalInvested: number;
  recentClients: Array<{
    id: string;
    name: string;
    email: string;
    account_balance: number;
    total_invested: number;
    member_since: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!session) {
        router.push("/signin?redirect=/admin");
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

        // Fetch admin stats
        const clientsResponse = await fetch("/api/admin/clients", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!clientsResponse.ok) {
          throw new Error("Failed to fetch clients");
        }

        const responseData = await clientsResponse.json();
        
        if (responseData.error) {
          console.error("Error from API:", responseData.error);
          throw new Error(responseData.error);
        }
        
        const allUsers = responseData.clients || [];
        console.log(`Received ${allUsers.length} users from API`);
        
        // Filter to only show clients (not admins) in stats
        const clients = allUsers.filter((u: any) => u.role === 'client' || !u.role);
        
        const totalBalance = clients.reduce(
          (sum: number, client: any) => sum + (parseFloat(client.account_balance) || 0),
          0
        );
        const totalInvested = clients.reduce(
          (sum: number, client: any) => sum + (parseFloat(client.total_invested) || 0),
          0
        );

        console.log(`Stats: ${clients.length} clients, $${totalBalance} total balance, $${totalInvested} total invested`);

        setStats({
          totalClients: clients.length,
          totalBalance,
          totalInvested,
          recentClients: clients.slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name || 'N/A',
            email: c.email || 'N/A',
            account_balance: parseFloat(c.account_balance) || 0,
            total_invested: parseFloat(c.total_invested) || 0,
            member_since: c.member_since || c.created_at || new Date().toISOString(),
          })),
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminAndFetchData();
    }
  }, [session, authLoading, router]);

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

  if (error || !isAdmin) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-blue-accent/70">{error || "You don't have permission to access this page."}</p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
                  <p className="text-blue-accent/70 mt-1">
                    Manage all client accounts and execute trades
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                  <p className="text-xs text-green-400 font-semibold">
                    Admin Access Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-card border border-dark-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-primary" />
                <span className="text-3xl font-bold text-white">
                  {stats?.totalClients || 0}
                </span>
              </div>
              <p className="text-blue-accent/70 text-sm">Total Clients</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-green-400" />
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(stats?.totalBalance || 0)}
                </span>
              </div>
              <p className="text-blue-accent/70 text-sm">Total Balance</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-card border border-dark-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-purple-400" />
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(stats?.totalInvested || 0)}
                </span>
              </div>
              <p className="text-blue-accent/70 text-sm">Total Invested</p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/clients"
                className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-blue-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Manage Clients
                    </h3>
                    <p className="text-blue-accent/70 text-sm">
                      View and manage all client accounts
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-blue-accent group-hover:text-blue-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link
                href="/markets"
                className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Browse Stocks
                    </h3>
                    <p className="text-blue-accent/70 text-sm">
                      View stocks and execute trades for clients
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-blue-accent group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Clients */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Clients</h2>
            {stats && stats.recentClients.length > 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-hover">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                          Invested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {stats.recentClients.map((client) => (
                        <tr key={client.id} className="hover:bg-dark-hover transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {client.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                            {client.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                            {formatCurrency(client.account_balance || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                            {formatCurrency(client.total_invested || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link
                              href={`/admin/clients/${client.id}`}
                              className="text-blue-primary hover:text-blue-accent transition-colors"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                <p className="text-blue-accent/70">No clients found</p>
                <Link
                  href="/admin/clients"
                  className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                >
                  View All Clients
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
