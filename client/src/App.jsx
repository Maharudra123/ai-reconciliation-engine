import { useState, useEffect } from "react";
import { fetchReconciliationReport } from "./services/api";
import {
  Activity,
  AlertCircle,
  Bot,
  DollarSign,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW: State for our active filter
  const [activeFilter, setActiveFilter] = useState("All");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchReconciliationReport();
      setReport(response.data);
    } catch (err) {
      setError(
        "Failed to connect to the reconciliation engine. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Helper for clean badge styling
  const getBadgeStyle = (type) => {
    if (type === "Matched")
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (type === "Rounding Error")
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (type === "Timing Gap")
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (type === "Duplicate Entry")
      return "bg-red-500/10 text-red-400 border-red-500/20";
    if (type === "Orphaned Refund")
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  // NEW: Flatten all backend data into one unified array for the table
  const getUnifiedTableData = () => {
    if (!report) return [];
    const data = [];

    report.matched?.forEach((tx) =>
      data.push({
        id: tx.id,
        type: "Matched",
        details: "Perfectly reconciled on both ledgers.",
        amount: tx.amount,
      }),
    );
    report.roundingErrors?.forEach((err) =>
      data.push({
        id: err.platformTx.id,
        type: "Rounding Error",
        details: `Expected ${formatCurrency(err.platformTx.amount)}, Bank settled ${formatCurrency(err.platformTx.amount - err.difference)}`,
        amount: err.platformTx.amount,
      }),
    );
    report.timingGaps?.forEach((err) =>
      data.push({
        id: err.platformTx.id,
        type: "Timing Gap",
        details: `Recorded ${new Date(err.platformTx.timestamp).toLocaleDateString()}, Settled next month.`,
        amount: err.platformTx.amount,
      }),
    );
    report.duplicates?.forEach((err) =>
      data.push({
        id: err.platformTx.id,
        type: "Duplicate Entry",
        details: `Bank processed this transaction ${err.bankRecords.length} times.`,
        amount: err.platformTx.amount,
      }),
    );
    report.orphanedRefunds?.forEach((err) =>
      data.push({
        id: err.transaction.id,
        type: "Orphaned Refund",
        details: `Parent ID (${err.transaction.parent_id}) missing from database.`,
        amount: err.transaction.amount,
      }),
    );

    return data;
  };

  const tableData = getUnifiedTableData();

  // NEW: Filter logic
  const filteredData = tableData.filter((row) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Anomalies") return row.type !== "Matched";
    return row.type === activeFilter;
  });

  const filterOptions = [
    "All",
    "Anomalies",
    "Matched",
    "Rounding Error",
    "Timing Gap",
    "Duplicate Entry",
    "Orphaned Refund",
  ];

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-gray-400 font-medium">
          Running Deterministic Engine & AI Analysis...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-950/50 border border-red-500/50 p-6 rounded-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">System Error</h2>
          <p className="text-red-200/80 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="text-indigo-500" />
            Reconciliation Engine
          </h1>
          <p className="text-gray-400 mt-1">January 2024 • Month-End Audit</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Re-Run Audit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 font-medium">Platform Total</p>
            <div className="p-2 bg-gray-800 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-300" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">
            {formatCurrency(report.summary.totalPlatformVolume)}
          </h3>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 font-medium">Bank Settled Total</p>
            <div className="p-2 bg-gray-800 rounded-lg">
              <FileText className="w-5 h-5 text-gray-300" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">
            {formatCurrency(report.summary.totalBankVolume)}
          </h3>
        </div>
        <div className="bg-gray-900 border border-red-900/30 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 font-medium">Net Discrepancy</p>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-red-400">
            {formatCurrency(report.summary.netDifference)}
          </h3>
        </div>
      </div>

      {/* Virtual CFO AI Panel */}
      <div className="bg-indigo-950/20 border border-indigo-500/30 p-8 rounded-2xl mb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Smart AI CFO Insights
          </h2>
        </div>
        <div className="space-y-4 text-indigo-100/80 leading-relaxed">
          {report.aiInsights.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* FILTERABLE DATA TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-10">
        {/* Table Header & Filter Bar */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Transaction Log</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap border
                  ${
                    activeFilter === f
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950/50 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Status / Issue</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">System Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr
                    key={`${row.id}-${i}`}
                    className="hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4 font-mono text-gray-400 flex items-center gap-2">
                      {row.type === "Matched" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {row.id}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(row.type)}`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{row.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
