"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Search,
  ArrowRight,
  AlertCircle,
  User,
  DollarSign,
} from "lucide-react";
import Loading from "@/components/Loading";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string;
  account_balance: number;
  total_invested: number;
  member_since: string;
  trading_level: string;
  unique_user_id?: string;
}

export default function AdminClientsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [allUsersData, setAllUsersData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchClients = async () => {
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

        // Fetch clients
        const clientsResponse = await fetch("/api/admin/clients", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!clientsResponse.ok) {
          throw new Error("Failed to fetch clients");
        }

        const { clients: allUsers } = await clientsResponse.json();
        console.log('Admin clients API returned:', allUsers?.length || 0, 'users');
        console.log('All users data:', JSON.stringify(allUsers, null, 2));
        
        if (!allUsers || allUsers.length === 0) {
          console.warn('No users returned from API');
          setClients([]);
          return;
        }
        
        // Filter to only show clients (not admins)
        // Handle cases where role might be null, undefined, or 'client'
        const clientsData = (allUsers || []).filter((u: any) => {
          // Log each user's role for debugging
          const role = u.role?.toLowerCase?.() || u.role || 'null';
          console.log('User:', u.email, 'Role:', role, 'Raw role:', u.role);
          
          // Explicitly check: if role is 'admin' (case-insensitive), exclude it
          // Include everything else: 'client', null, undefined, empty string, etc.
          const isAdmin = role === 'admin';
          const isClient = !isAdmin;
          
          if (!isClient) {
            console.log('❌ Filtered out admin user:', u.email, 'role:', u.role);
          } else {
            console.log('✅ Including client:', u.email, 'role:', u.role || 'null/undefined (treated as client)');
          }
          return isClient;
        });
        console.log('Filtered to', clientsData.length, 'clients out of', allUsers.length, 'total users');
        
        // Store all users for debugging
        setAllUsersData(allUsers);
        
        // If no clients found, log all users for debugging
        if (clientsData.length === 0 && allUsers.length > 0) {
          console.warn('⚠️ No clients found after filtering!');
          console.warn('All users with their roles:', allUsers.map((u: any) => ({
            email: u.email,
            role: u.role || 'NULL/UNDEFINED',
            name: u.name,
            id: u.id
          })));
          console.warn('Role breakdown:', {
            admins: allUsers.filter((u: any) => (u.role?.toLowerCase?.() || u.role) === 'admin').length,
            clients: allUsers.filter((u: any) => {
              const role = u.role?.toLowerCase?.() || u.role;
              return role !== 'admin' && role !== 'ADMIN';
            }).length,
            nullOrUndefined: allUsers.filter((u: any) => !u.role || u.role === '').length
          });
        }
        
        setClients(clientsData);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminAndFetchClients();
    }
  }, [session, authLoading, router]);

  // Use all users if showAllUsers is true and no clients found
  const usersToDisplay = (showAllUsers && clients.length === 0 && allUsersData.length > 0) 
    ? allUsersData 
    : clients;

  const filteredClients = usersToDisplay.filter(
    (client: any) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.unique_user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  href="/admin"
                  className="mt-4 inline-block px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-blue-glow transition-all"
                >
                  Go to Admin Portal
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
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-primary" />
              <h1 className="text-3xl font-bold text-white">Client Management</h1>
            </div>
            <p className="text-blue-accent/70">
              Manage all client accounts and trading activities
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-accent/50" />
              <input
                type="text"
                placeholder="Search clients by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white placeholder-blue-accent/50 focus:outline-none focus:border-blue-primary transition-colors"
              />
            </div>
          </div>

          {/* Debug Toggle - Show all users if no clients */}
          {clients.length === 0 && allUsersData.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-semibold mb-1">No clients found after filtering</p>
                  <p className="text-yellow-400/70 text-sm">
                    Total users fetched: {allUsersData.length} | 
                    Showing: {showAllUsers ? 'All Users' : 'Clients Only'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
                >
                  {showAllUsers ? 'Show Clients Only' : 'Show All Users'}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-blue-primary" />
                <div>
                  <p className="text-blue-accent/70 text-sm">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{clients.length}</p>
                  {allUsersData.length > 0 && (
                    <p className="text-xs text-blue-accent/50 mt-1">
                      ({allUsersData.length} total users)
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-blue-accent/70 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(
                      clients.reduce((sum, c) => sum + (c.account_balance || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-purple-400" />
                <div>
                  <p className="text-blue-accent/70 text-sm">Total Invested</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(
                      clients.reduce((sum, c) => sum + (c.total_invested || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clients Table */}
          <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-hover">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                      Client
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
                      Level
                    </th>
                    {showAllUsers && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                        Role
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={showAllUsers ? 7 : 6} className="px-6 py-8 text-center text-blue-accent/70">
                        {searchQuery ? (
                          "No clients found matching your search."
                        ) : (
                          <div>
                            <p className="mb-2">No clients found.</p>
                            <p className="text-xs text-blue-accent/50">
                              Total users fetched: {clients.length}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-dark-hover transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {client.name || "N/A"}
                            </p>
                            {client.unique_user_id && (
                              <p className="text-xs text-blue-accent/50">
                                {client.unique_user_id}
                              </p>
                            )}
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-accent/70">
                          {client.trading_level || "Beginner"}
                        </td>
                        {showAllUsers && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              client.role === 'admin' 
                                ? 'bg-red-500/10 text-red-400' 
                                : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {client.role || 'client'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="text-blue-primary hover:text-blue-accent transition-colors flex items-center gap-1"
                          >
                            Manage <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
