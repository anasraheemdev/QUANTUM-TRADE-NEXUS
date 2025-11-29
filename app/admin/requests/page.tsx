"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Check,
  X,
  Clock,
  User,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Loading from "@/components/Loading";

interface AdminRequest {
  id: string;
  user_id: string;
  email: string;
  name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndFetchRequests = async () => {
      if (!session) {
        router.push("/signin?redirect=/admin/requests");
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
        await fetchRequests();
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load admin requests");
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminAndFetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading, router]);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/requests", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const { requests: requestsData } = await response.json();
      setRequests(requestsData || []);
    } catch (err: any) {
      console.error("Error fetching requests:", err);
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!session) return;
    
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve request");
      }

      // Refresh requests
      await fetchRequests();
    } catch (err: any) {
      console.error("Error approving request:", err);
      alert(err.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    if (!session) return;
    
    const rejectionReason = reason || prompt("Enter rejection reason (optional):");
    if (rejectionReason === null) return; // User cancelled
    
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: "reject",
          reason: rejectionReason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject request");
      }

      // Refresh requests
      await fetchRequests();
    } catch (err: any) {
      console.error("Error rejecting request:", err);
      alert(err.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
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

  if (error || !isAdmin) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="flex lg:ml-64" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="text-center bg-dark-card border border-dark-border rounded-lg p-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
              <p className="text-blue-accent/70">{error || "Unauthorized"}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

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
                <Shield className="h-8 w-8 text-blue-primary" />
                <h1 className="text-3xl font-bold text-white">Admin Requests</h1>
              </div>
              <p className="text-blue-accent/70">
                Review and approve or reject admin access requests
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="text-blue-accent/70 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-white">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-blue-accent/70 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-white">{approvedRequests.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <X className="h-6 w-6 text-red-400" />
                  <div>
                    <p className="text-blue-accent/70 text-sm">Rejected</p>
                    <p className="text-2xl font-bold text-white">{rejectedRequests.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Requests Table */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Pending Requests</h2>
              {pendingRequests.length === 0 ? (
                <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
                  <Clock className="h-12 w-12 text-blue-accent/50 mx-auto mb-4" />
                  <p className="text-blue-accent/70">No pending requests</p>
                </div>
              ) : (
                <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Requested At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {pendingRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-dark-hover transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-gradient flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{request.name}</p>
                                  <p className="text-xs text-blue-accent/50">ID: {request.user_id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-accent/50" />
                                <span className="text-blue-accent/70">{request.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-accent/50" />
                                <span className="text-blue-accent/70 text-sm">
                                  {new Date(request.requested_at).toLocaleDateString()} {new Date(request.requested_at).toLocaleTimeString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  disabled={processingId === request.id}
                                  className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  {processingId === request.id ? "Processing..." : "Approve"}
                                </button>
                                <button
                                  onClick={() => handleReject(request.id)}
                                  disabled={processingId === request.id}
                                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* All Requests (Approved/Rejected) */}
            {(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">All Requests</h2>
                <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Requested At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-accent uppercase">
                            Reviewed At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {[...approvedRequests, ...rejectedRequests].map((request) => (
                          <tr key={request.id} className="hover:bg-dark-hover transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-gradient flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{request.name}</p>
                                  <p className="text-xs text-blue-accent/50">ID: {request.user_id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-blue-accent/70">{request.email}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  request.status === 'approved'
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {request.status.toUpperCase()}
                              </span>
                              {request.rejection_reason && (
                                <p className="text-xs text-red-400/70 mt-1">{request.rejection_reason}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70 text-sm">
                              {new Date(request.requested_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-accent/70 text-sm">
                              {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

