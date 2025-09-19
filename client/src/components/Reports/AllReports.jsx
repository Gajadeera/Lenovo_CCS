import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useDarkMode } from "../../../context/DarkModeContext";
import axios from "axios";
import Button from "../Common/Button";

function ReportGenerator() {
    const { user: currentUser } = useAuth();
    const { isDark } = useDarkMode();
    const [model, setModel] = useState("Customer");
    const [dateRange, setDateRange] = useState("all");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState(null);
    const [reportHistory, setReportHistory] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("generate");

    const availableModels = [
        "User",
        "Customer",
        "Device",
        "Job",
        "JobUpdate",
        "PartsRequest",
        "ActivityLog",
        "SystemIssue",
        "Report",
        "Notification",
    ];

    const api = axios.create({
        baseURL: "http://localhost:5000",
        headers: { "Content-Type": "application/json" },
    });

    api.interceptors.request.use((config) => {
        if (currentUser?.token) {
            config.headers.Authorization = `Bearer ${currentUser.token}`;
        }
        return config;
    });

    const downloadReport = async (filename) => {
        try {
            const res = await api.get(`/reports/${filename}`, { responseType: "blob" });

            // If it's not a PDF blob, it might be an error JSON
            const contentType = res.headers["content-type"];
            if (contentType && contentType.includes("application/json")) {
                const text = await res.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || "Download failed");
            }

            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setSuccess("Report downloaded successfully");
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to download report");
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const res = await api.get("/reports/history");
                // Get only the first 5 items
                setReportHistory((res.data.data || []).slice(0, 5));
            } catch {
                setError("Failed to fetch report history");
            } finally {
                setLoading(false);
            }
        };
        if (activeTab === "history") fetchHistory();
    }, [activeTab, currentUser]);

    const generateReport = async () => {
        if (!currentUser) return;
        setIsGenerating(true);
        setError(null);
        setSuccess(null);
        try {
            let filters = {};
            if (dateRange === "custom" && customStartDate && customEndDate) {
                filters = {
                    startDate: new Date(customStartDate).toISOString(),
                    endDate: new Date(customEndDate).toISOString(),
                };
            }
            const res = await api.post(`/reports/${model.toLowerCase()}`, {
                filters,
                sort: { createdAt: -1 },
            });
            if (res.data.success) {
                setDownloadInfo({
                    filename: res.data.downloadUrl.split("/").pop(),
                    documentCount: res.data.documentCount,
                    fileSize: res.data.fileSize,
                });
                setSuccess("Report generated successfully");
            }
        } catch {
            setError("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
    };

    // Dark mode classes
    const containerClass = isDark
        ? "bg-gray-800 text-gray-100"
        : "bg-white text-gray-800";

    const inputClass = isDark
        ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-[#52c3cb] focus:border-[#52c3cb]"
        : "bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#52c3cb] focus:border-[#52c3cb]";

    const tableHeaderClass = isDark
        ? "bg-gray-700 text-gray-100"
        : "bg-gray-100 text-gray-800";

    const tableRowClass = isDark
        ? "border-gray-700 hover:bg-gray-700"
        : "border-gray-200 hover:bg-gray-50";

    const tabClass = (tab) =>
        `px-4 py-2 text-sm font-medium ${activeTab === tab
            ? isDark
                ? "text-[#52c3cb] border-b-2 border-[#52c3cb]"
                : "text-[#305777] border-b-2 border-[#305777]"
            : isDark
                ? "text-gray-400 hover:text-[#52c3cb]"
                : "text-gray-500 hover:text-[#305777]"
        } transition-colors duration-300`;

    return (
        <div className={`max-w-5xl mx-auto p-4 rounded-lg shadow ${containerClass}`}>
            <h2 className={`text-xl font-bold text-center mb-4 ${isDark ? 'text-gray-100' : 'text-[#1E4065]'}`}>
                Reports Dashboard
            </h2>

            {success && (
                <div className={`p-3 mb-4 rounded ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'}`}>
                    {success}
                </div>
            )}

            {/* Tabs */}
            <div className={`flex border-b mb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {["generate", "history"].map((tab) => (
                    <button
                        key={tab}
                        className={tabClass(tab)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Generate Tab */}
            {activeTab === "generate" && (
                <div className={`p-4 rounded-lg space-y-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#1E4065]'}`}>
                            Report Type
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className={`block w-full border rounded p-2 text-sm ${inputClass}`}
                        >
                            {availableModels.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#1E4065]'}`}>
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className={`block w-full border rounded p-2 text-sm ${inputClass}`}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">Last Quarter</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {dateRange === "custom" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#1E4065]'}`}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className={`w-full border rounded p-2 text-sm ${inputClass}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-[#1E4065]'}`}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className={`w-full border rounded p-2 text-sm ${inputClass}`}
                                />
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={generateReport}
                        isLoading={isGenerating}
                        variant="primary"
                        size="md"
                        className="w-full"
                    >
                        {isGenerating ? "Generating..." : "Generate Report"}
                    </Button>

                    {downloadInfo && (
                        <div className={`p-3 rounded text-sm text-center ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-[#1E4065]'}`}>
                            <p className="mb-2">
                                {downloadInfo.documentCount} records ({formatSize(downloadInfo.fileSize)})
                            </p>
                            <Button
                                onClick={() => downloadReport(downloadInfo.filename)}
                                variant="primary"
                                size="sm"
                            >
                                Download Report
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "history" && (
                <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    {loading ? (
                        <div className="p-6 text-center">
                            <p className={isDark ? 'text-gray-400' : 'text-[#1E4065]'}>Loading history...</p>
                        </div>
                    ) : reportHistory.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className={isDark ? 'text-gray-400' : 'text-[#1E4065]'}>No reports found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={tableHeaderClass}>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">Type</th>
                                        <th className="p-3 text-left">Records</th>
                                        <th className="p-3 text-left">Size</th>
                                        <th className="p-3 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportHistory.map((r) => (
                                        <tr key={r._id} className={`border-t ${tableRowClass}`}>
                                            <td className="p-3">{new Date(r.generatedAt).toLocaleDateString()}</td>
                                            <td className="p-3">{r.type}</td>
                                            <td className="p-3">{r.documentCount}</td>
                                            <td className="p-3">{r.fileSize ? formatSize(r.fileSize) : "N/A"}</td>
                                            <td className="p-3">
                                                <Button
                                                    onClick={() => downloadReport(r.filePath.split('/').pop())}
                                                    variant="primary"
                                                    size="sm"
                                                >
                                                    Download
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ReportGenerator;