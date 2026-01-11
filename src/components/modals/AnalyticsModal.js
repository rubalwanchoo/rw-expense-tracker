"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Color palette for charts
const COLORS = {
  income: "#10b981", // emerald-500
  expense: "#ef4444", // red-500
  sources: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6", "#6366f1", "#84cc16", "#f97316"],
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AnalyticsModal({ isOpen, onClose, transactions = [] }) {
  // Date range filter state (local to this modal)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return transactions;
    }

    return transactions.filter((t) => {
      if (!t.trans_date) return true;
      const transDate = new Date(t.trans_date);
      if (filterStartDate && transDate < new Date(filterStartDate)) return false;
      if (filterEndDate && transDate > new Date(filterEndDate)) return false;
      return true;
    });
  }, [transactions, filterStartDate, filterEndDate]);

  // Clear date filter
  const clearDateFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // 1. Monthly Spending Trend Data - Shows all months in range
  const monthlyData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // First, collect data from transactions
    const monthMap = {};
    let minDate = null;
    let maxDate = null;

    filteredTransactions.forEach((t) => {
      if (!t.trans_date) return;
      const date = new Date(t.trans_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      // Track min/max dates
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
      
      if (!monthMap[key]) {
        monthMap[key] = { month: key, income: 0, expenses: 0, label: "" };
      }

      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Income") {
        monthMap[key].income += amount;
      } else {
        monthMap[key].expenses += amount;
      }
    });

    // If filter dates are set, use them as boundaries
    if (filterStartDate) {
      const startD = new Date(filterStartDate);
      if (!minDate || startD < minDate) minDate = startD;
    }
    if (filterEndDate) {
      const endD = new Date(filterEndDate);
      if (!maxDate || endD > maxDate) maxDate = endD;
    }

    if (!minDate || !maxDate) return [];

    // Generate all months between min and max
    const allMonths = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const existing = monthMap[key];
      
      allMonths.push({
        month: key,
        income: existing?.income || 0,
        expenses: existing?.expenses || 0,
        label: `${MONTHS[current.getMonth()]} ${String(current.getFullYear()).slice(2)}`,
      });
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    return allMonths;
  }, [filteredTransactions, filterStartDate, filterEndDate]);

  // 2. Day of Week Analysis Data
  const dayOfWeekData = useMemo(() => {
    const dayTotals = Array(7).fill(null).map((_, i) => ({
      day: DAYS_OF_WEEK[i],
      amount: 0,
      count: 0,
    }));

    filteredTransactions.forEach((t) => {
      if (!t.trans_date || t.type !== "Expense") return;
      const date = new Date(t.trans_date);
      const dayIndex = date.getDay();
      dayTotals[dayIndex].amount += parseFloat(t.amount) || 0;
      dayTotals[dayIndex].count += 1;
    });

    // Calculate average
    dayTotals.forEach((d) => {
      d.average = d.count > 0 ? d.amount / d.count : 0;
    });

    return dayTotals;
  }, [filteredTransactions]);

  // Helper function to normalize merchant names for grouping
  const normalizeMerchantName = (name) => {
    if (!name) return "Unknown";
    
    const upperName = name.toUpperCase();
    
    // Special case: Group all Amazon-related merchants together
    // Matches: AMAZON, AMZN, AMAZON.COM, AMAZON PRIME, AMZN MKTP, etc.
    if (upperName.includes("AMAZON") || upperName.includes("AMZN")) {
      return "Amazon";
    }
    
    let normalized = name
      .toUpperCase()
      .trim()
      // Remove URL paths first (anything after /)
      .replace(/\/.*$/g, "")
      // Remove www. prefix
      .replace(/^WWW\./gi, "")
      // Remove http/https prefix
      .replace(/^HTTPS?:\/\//gi, "")
      // Remove domain extensions (anywhere in string, not just at end)
      .replace(/\.(COM|NET|ORG|IO|CO|US|GOV|CA|UK|DE|FR|ES|IT|AU|NZ|IN|JP|CN|BR|MX)\b/gi, "")
      // Remove common suffixes/prefixes
      .replace(/\s*(INC|LLC|CORP|CO|LTD|INCORPORATED|CORPORATION)\.?\s*$/gi, "")
      // Remove country/region suffixes
      .replace(/\s+(USA|US|UK|CA|CANADA|ONLINE|DIGITAL|ECOM|WEB)$/gi, "")
      // Remove "INSIDE" patterns (e.g., "SEPHORA INSIDE JCP")
      .replace(/\s+INSIDE\s+.*/gi, "")
      // Remove store numbers like #1234, *1234, Store 1234
      .replace(/[#*]\s*\d+/g, "")
      .replace(/\s+STORE\s*#?\d*/gi, "")
      .replace(/\s+STR\s*#?\d*/gi, "")
      .replace(/\s+LOC\s*#?\d*/gi, "")
      .replace(/\s+STO\s*#?\d*/gi, "")
      // Remove location/city info after dash, comma, or standalone
      .replace(/\s*[-,]\s*[A-Z]{2}\s*\d*$/gi, "") // e.g., "- NY 10001"
      .replace(/\s*[-,]\s*[A-Z\s]+,?\s*[A-Z]{2}$/gi, "") // e.g., "- New York, NY"
      .replace(/\s+[A-Z]{2}\s*\d{5}$/gi, "") // e.g., "NY 10001" at end
      // Remove transaction IDs/dates patterns
      .replace(/\s+\d{4,}/g, "") // Remove number sequences 4+ digits
      .replace(/\s+\d{2}\/\d{2}/g, "") // Remove date patterns like 01/15
      .replace(/\s+\d{2}-\d{2}/g, "") // Remove date patterns like 01-15
      // Remove payment method indicators
      .replace(/\s+(VISA|MASTERCARD|AMEX|DEBIT|CREDIT|CARD|PAYMENT|PAY|PURCHASE|POS|ACH)\s*$/gi, "")
      // Remove trailing special characters and numbers
      .replace(/[\s\-_*#\.]+$/g, "")
      .replace(/\s+\d+$/g, "")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim();
    
    // If the name is too long, try to extract just the first meaningful word(s)
    // Many merchants have patterns like "SEPHORA USA INC NEW YORK"
    const words = normalized.split(" ");
    if (words.length > 2) {
      // Keep only first 2 words for very long names
      normalized = words.slice(0, 2).join(" ");
    }
    
    // Title case the result
    normalized = normalized
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    // Final cleanup - limit length for display
    if (normalized.length > 20) {
      normalized = normalized.substring(0, 17) + "...";
    }
    
    return normalized || "Unknown";
  };

  // 3. Spending by Merchant Data (grouped by normalized description)
  const merchantData = useMemo(() => {
    const merchantMap = {};

    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense") return;
      // Normalize merchant name for grouping
      const merchant = normalizeMerchantName(t.description);
      
      if (!merchantMap[merchant]) {
        merchantMap[merchant] = { name: merchant, value: 0, count: 0 };
      }
      merchantMap[merchant].value += parseFloat(t.amount) || 0;
      merchantMap[merchant].count += 1;
    });

    return Object.values(merchantMap).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // 4. Daily Spending Heatmap Data (last 30 days by default, or filtered range)
  const heatmapData = useMemo(() => {
    const dayMap = {};

    filteredTransactions.forEach((t) => {
      if (!t.trans_date || t.type !== "Expense") return;
      const dateKey = t.trans_date; // YYYY-MM-DD
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = 0;
      }
      dayMap[dateKey] += parseFloat(t.amount) || 0;
    });

    // Get all unique dates sorted
    const sortedDates = Object.keys(dayMap).sort();
    
    // Find max for color scaling
    const maxAmount = Math.max(...Object.values(dayMap), 1);

    // Create calendar-like grid (last 35 days for 5 weeks)
    const result = sortedDates.map((date) => {
      const d = new Date(date);
      return {
        date,
        dayOfWeek: d.getDay(),
        amount: dayMap[date],
        intensity: dayMap[date] / maxAmount,
        label: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      };
    });

    return { days: result, maxAmount };
  }, [filteredTransactions]);

  // Summary statistics
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Income") {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    return { totalIncome, totalExpenses, netSavings, savingsRate };
  }, [filteredTransactions]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Spending Analysis</h2>
              <p className="text-sm text-gray-500">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} analyzed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Filter by Date:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button
                onClick={clearDateFilter}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Total Income</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">${summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">Total Expenses</p>
            <p className="mt-1 text-2xl font-bold text-red-700">${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className={`rounded-xl p-4 ${summary.netSavings >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <p className={`text-xs font-medium uppercase tracking-wide ${summary.netSavings >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              Net {summary.netSavings >= 0 ? "Savings" : "Deficit"}
            </p>
            <p className={`mt-1 text-2xl font-bold ${summary.netSavings >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              ${Math.abs(summary.netSavings).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-purple-600">Savings Rate</p>
            <p className="mt-1 text-2xl font-bold text-purple-700">{summary.savingsRate}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart 1: Monthly Spending Trend */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Monthly Spending Trend</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke={COLORS.income}
                      fill={COLORS.income}
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke={COLORS.expense}
                      fill={COLORS.expense}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </div>

            {/* Chart 2: Day of Week Analysis */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Spending by Day of Week</h3>
              {dayOfWeekData.some((d) => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value, name) => [`$${value.toFixed(2)}`, name === "amount" ? "Total" : "Average"]}
                      labelStyle={{ color: "#374151" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="amount" name="Total Spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-gray-400">
                  No expense data available
                </div>
              )}
            </div>

            {/* Chart 3: Spending by Merchant */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Spending by Merchant</h3>
              {merchantData.length > 0 ? (
                <div className="flex items-center">
                  <ResponsiveContainer width="60%" height={250}>
                    <PieChart>
                      <Pie
                        data={merchantData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {merchantData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.sources[index % COLORS.sources.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `$${value.toFixed(2)}`}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-[40%] space-y-2">
                    {merchantData.slice(0, 6).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS.sources[index % COLORS.sources.length] }}
                        />
                        <span className="truncate text-xs text-gray-600" title={entry.name}>{entry.name}</span>
                        <span className="ml-auto flex-shrink-0 text-xs font-medium text-gray-800">
                          ${entry.value.toFixed(0)}
                        </span>
                      </div>
                    ))}
                    {merchantData.length > 6 && (
                      <p className="text-xs text-gray-400">+{merchantData.length - 6} more</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-gray-400">
                  No expense data available
                </div>
              )}
            </div>

            {/* Chart 4: Daily Spending Heatmap */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Daily Spending Intensity</h3>
              {heatmapData.days.length > 0 ? (
                <div className="space-y-3">
                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                        <div
                          key={intensity}
                          className="h-4 w-4 rounded"
                          style={{
                            backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                          }}
                        />
                      ))}
                    </div>
                    <span>More (Max: ${heatmapData.maxAmount.toFixed(0)})</span>
                  </div>
                  
                  {/* Heatmap Grid - Show last 28 days in 4 rows of 7 */}
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="text-center text-[10px] font-medium text-gray-400">
                        {day}
                      </div>
                    ))}
                    {heatmapData.days.slice(-28).map((day, i) => (
                      <div
                        key={day.date}
                        className="group relative h-8 rounded transition-transform hover:scale-110"
                        style={{
                          backgroundColor: day.amount > 0 
                            ? `rgba(239, 68, 68, ${Math.max(0.15, day.intensity)})`
                            : "#f3f4f6",
                        }}
                        title={`${day.label}: $${day.amount.toFixed(2)}`}
                      >
                        <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                          {day.label}: ${day.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top spending days */}
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-medium text-gray-500">Top Spending Days:</p>
                    {[...heatmapData.days]
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 3)
                      .map((day) => (
                        <div key={day.date} className="flex justify-between text-xs">
                          <span className="text-gray-600">{day.label}</span>
                          <span className="font-medium text-red-600">${day.amount.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-gray-400">
                  No expense data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
