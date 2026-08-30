import React, { useEffect, useState, useCallback } from "react";
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

interface AuditLogItem {
  _id: string;
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetType: "user" | "course" | "enrollment" | "system";
  targetId: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedTargetType, setSelectedTargetType] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAction) params.append("action", selectedAction);
      if (selectedTargetType) params.append("targetType", selectedTargetType);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAction, selectedTargetType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("ACTIVATED") || action.includes("APPROVED")) {
      return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (action.includes("DEACTIVATED") || action.includes("DELETED")) {
      return "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Admin Audit Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and monitor administrative actions and security events across the platform.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <FunnelIcon className="w-4 h-4" /> Filters:
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Actions</option>
          <option value="USER_ACTIVATED">USER_ACTIVATED</option>
          <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
          <option value="COURSE_MODERATED">COURSE_MODERATED</option>
        </select>

        <select
          value={selectedTargetType}
          onChange={(e) => setSelectedTargetType(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Target Types</option>
          <option value="user">User</option>
          <option value="course">Course</option>
          <option value="enrollment">Enrollment</option>
          <option value="system">System</option>
        </select>

        {(selectedAction || selectedTargetType) && (
          <button
            type="button"
            onClick={() => {
              setSelectedAction("");
              setSelectedTargetType("");
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No audit logs found</p>
            <p className="text-xs text-gray-400 mt-1">Actions taken by administrators will be recorded here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Admin</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {log.admin?.name || "Unknown Admin"}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-[11px]">{log.admin?.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                            <span className="text-gray-400 font-normal">[{log.targetType}]</span>{" "}
                            {log.targetName || log.targetId}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">{log.targetId}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-gray-400">
                          {log.ipAddress || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            {isExpanded ? "Hide" : "View"}
                            <ChevronDownIcon
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && log.details && (
                        <tr className="bg-gray-50/80 dark:bg-gray-900/50">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                Event Payload & Details:
                              </div>
                              <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
