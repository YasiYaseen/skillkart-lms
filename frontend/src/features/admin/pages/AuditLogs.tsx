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
      return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (action.includes("DEACTIVATED") || action.includes("DELETED")) {
      return "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    return "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Admin Audit Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track and monitor administrative actions and security events across the platform.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <FunnelIcon className="w-4 h-4 text-slate-400" /> Filters:
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
        >
          <option value="">All Actions</option>
          <option value="USER_ACTIVATED">USER_ACTIVATED</option>
          <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
          <option value="COURSE_MODERATED">COURSE_MODERATED</option>
        </select>

        <select
          value={selectedTargetType}
          onChange={(e) => setSelectedTargetType(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
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
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <ShieldCheckIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No audit logs found</p>
            <p className="text-[11px] text-slate-400">Actions taken by administrators will be recorded here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.admin?.name || "Unknown Admin"}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">{log.admin?.email}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                            <span className="text-slate-400 font-normal">[{log.targetType}]</span>{" "}
                            {log.targetName || log.targetId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.targetId}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {log.ipAddress || "—"}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
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
                        <tr className="bg-slate-50 dark:bg-slate-850">
                          <td colSpan={6} className="p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Event Payload & Details:
                              </div>
                              <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre-wrap">
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
