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
  payment: "#10b981", // emerald-500
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
      // Use string comparison for YYYY-MM-DD format (avoids timezone issues)
      if (filterStartDate && t.trans_date < filterStartDate) return false;
      if (filterEndDate && t.trans_date > filterEndDate) return false;
      return true;
    });
  }, [transactions, filterStartDate, filterEndDate]);

  // Clear date filter
  const clearDateFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // NEW: Payment vs Expense by Month (grouped bar)
  const paymentVsExpenseData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const monthMap = {};
    let minKey = null;
    let maxKey = null;

    filteredTransactions.forEach((t) => {
      if (!t.trans_date) return;
      
      // Parse date string directly to avoid timezone issues (format: YYYY-MM-DD)
      const dateParts = t.trans_date.split('-');
      if (dateParts.length < 2) return;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10); // 1-12
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      // Track min/max keys as strings (they sort correctly in YYYY-MM format)
      if (!minKey || key < minKey) minKey = key;
      if (!maxKey || key > maxKey) maxKey = key;
      
      if (!monthMap[key]) {
        monthMap[key] = { month: key, payments: 0, expenses: 0 };
      }

      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Payment") {
        monthMap[key].payments += amount;
      } else {
        monthMap[key].expenses += amount;
      }
    });

    if (!minKey || !maxKey) return [];

    // Generate all months between min and max
    const allMonths = [];
    const [minYear, minMonth] = minKey.split('-').map(Number);
    const [maxYear, maxMonth] = maxKey.split('-').map(Number);
    
    let currentYear = minYear;
    let currentMonth = minMonth;

    while (currentYear < maxYear || (currentYear === maxYear && currentMonth <= maxMonth)) {
      const key = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const existing = monthMap[key];
      
      allMonths.push({
        month: key,
        payments: existing?.payments || 0,
        expenses: existing?.expenses || 0,
        label: `${MONTHS[currentMonth - 1]} ${currentYear}`,
        balance: (existing?.payments || 0) - (existing?.expenses || 0),
      });
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return allMonths;
  }, [filteredTransactions]);

  // NEW: Outstanding Balance Over Time (running balance)
  const outstandingBalanceData = useMemo(() => {
    const transactions = filteredTransactions
      .filter((t) => t.trans_date)
      .map((t) => ({
        date: t.trans_date,
        amount: parseFloat(t.amount) || 0,
        type: t.type,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let balance = 0;
    const dateMap = {};

    transactions.forEach((t) => {
      if (t.type === "Payment") {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
      dateMap[t.date] = balance;
    });

    return Object.entries(dateMap).map(([date, bal]) => {
      // Parse date string directly to avoid timezone issues (format: YYYY-MM-DD)
      const dateParts = date.split('-');
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
      const day = parseInt(dateParts[2], 10);
      return {
        date,
        balance: bal,
        label: `${MONTHS[month]} ${day}`,
      };
    });
  }, [filteredTransactions]);

  // 1. Monthly Spending Trend Data - Shows all months in range
  const monthlyData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // Collect data from transactions grouped by month
    const monthMap = {};
    let minKey = null;
    let maxKey = null;

    filteredTransactions.forEach((t) => {
      if (!t.trans_date) return;
      
      // Parse date string directly to avoid timezone issues (format: YYYY-MM-DD)
      const dateParts = t.trans_date.split('-');
      if (dateParts.length < 2) return;
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10); // 1-12
      const key = `${year}-${String(month).padStart(2, '0')}`; // YYYY-MM
      
      // Track min/max keys as strings
      if (!minKey || key < minKey) minKey = key;
      if (!maxKey || key > maxKey) maxKey = key;
      
      if (!monthMap[key]) {
        monthMap[key] = { month: key, expenses: 0 };
      }

      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Expense") {
        monthMap[key].expenses += amount;
      }
    });

    // If filter dates are set, use them as boundaries
    if (filterStartDate) {
      const startParts = filterStartDate.split('-');
      const startKey = `${startParts[0]}-${startParts[1]}`;
      if (!minKey || startKey < minKey) minKey = startKey;
    }
    if (filterEndDate) {
      const endParts = filterEndDate.split('-');
      const endKey = `${endParts[0]}-${endParts[1]}`;
      if (!maxKey || endKey > maxKey) maxKey = endKey;
    }

    if (!minKey || !maxKey) return [];

    // Generate all months between min and max
    const allMonths = [];
    const [minYear, minMonth] = minKey.split('-').map(Number);
    const [maxYear, maxMonth] = maxKey.split('-').map(Number);
    
    let currentYear = minYear;
    let currentMonth = minMonth;

    while (currentYear < maxYear || (currentYear === maxYear && currentMonth <= maxMonth)) {
      const key = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const existing = monthMap[key];
      
      allMonths.push({
        month: key,
        expenses: existing?.expenses || 0,
        label: `${MONTHS[currentMonth - 1]} ${currentYear}`,
      });
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return allMonths;
  }, [filteredTransactions, filterStartDate, filterEndDate]);

  // 2. Day of Week Analysis Data
  // Helper to get day of week from YYYY-MM-DD string (0=Sun, 6=Sat)
  const getDayOfWeek = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Use UTC to avoid timezone shifts
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCDay();
  };

  const dayOfWeekData = useMemo(() => {
    const dayTotals = Array(7).fill(null).map((_, i) => ({
      day: DAYS_OF_WEEK[i],
      amount: 0,
      count: 0,
    }));

    filteredTransactions.forEach((t) => {
      if (!t.trans_date || t.type !== "Expense") return;
      const dayIndex = getDayOfWeek(t.trans_date);
      dayTotals[dayIndex].amount += parseFloat(t.amount) || 0;
      dayTotals[dayIndex].count += 1;
    });

    // Calculate average
    dayTotals.forEach((d) => {
      d.average = d.count > 0 ? d.amount / d.count : 0;
    });

    return dayTotals;
  }, [filteredTransactions]);

  // 3. Spending by Category Data
  const categoryData = useMemo(() => {
    const categoryMap = {};

    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense") return;
      // Group by category field
      const category = t.category || "Other";
      
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, value: 0, count: 0 };
      }
      categoryMap[category].value += parseFloat(t.amount) || 0;
      categoryMap[category].count += 1;
    });

    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
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
    const result = sortedDates.map((dateStr) => {
      // Parse date string directly to avoid timezone issues
      const dateParts = dateStr.split('-');
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed for MONTHS array
      const day = parseInt(dateParts[2], 10);
      const dayOfWeek = getDayOfWeek(dateStr);
      
      return {
        date: dateStr,
        dayOfWeek,
        amount: dayMap[dateStr],
        intensity: dayMap[dateStr] / maxAmount,
        label: `${MONTHS[month]} ${day}`,
      };
    });

    return { days: result, maxAmount };
  }, [filteredTransactions]);

  // Summary statistics
  const summary = useMemo(() => {
    let totalPayments = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Payment") {
        totalPayments += amount;
      } else {
        totalExpenses += amount;
      }
    });

    const netBalance = totalPayments - totalExpenses;
    const paymentRate = totalExpenses > 0 ? ((totalPayments / totalExpenses) * 100).toFixed(1) : 0;

    return { totalPayments, totalExpenses, netBalance, paymentRate };
  }, [filteredTransactions]);

  // Top 10 individual expenses (largest single transactions)
  const top10Expenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "Expense")
      .map((t) => ({
        description: (t.description || "Unknown").substring(0, 25) + (t.description?.length > 25 ? "..." : ""),
        amount: parseFloat(t.amount) || 0,
        date: t.trans_date,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredTransactions]);

  // Cumulative spending over time
  const cumulativeData = useMemo(() => {
    const expenses = filteredTransactions
      .filter((t) => t.type === "Expense" && t.trans_date)
      .map((t) => ({
        date: t.trans_date,
        amount: parseFloat(t.amount) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let cumulative = 0;
    const result = [];
    const dateMap = {};

    expenses.forEach((e) => {
      cumulative += e.amount;
      dateMap[e.date] = cumulative;
    });

    Object.entries(dateMap).forEach(([dateStr, total]) => {
      // Parse date string directly to avoid timezone issues
      const dateParts = dateStr.split('-');
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed for MONTHS array
      const day = parseInt(dateParts[2], 10);
      result.push({
        date: dateStr,
        total,
        label: `${MONTHS[month]} ${day}`,
      });
    });

    return result;
  }, [filteredTransactions]);

  // Expense distribution (histogram buckets)
  const expenseDistribution = useMemo(() => {
    const buckets = [
      { range: "$0-10", min: 0, max: 10, count: 0 },
      { range: "$10-25", min: 10, max: 25, count: 0 },
      { range: "$25-50", min: 25, max: 50, count: 0 },
      { range: "$50-100", min: 50, max: 100, count: 0 },
      { range: "$100-250", min: 100, max: 250, count: 0 },
      { range: "$250-500", min: 250, max: 500, count: 0 },
      { range: "$500+", min: 500, max: Infinity, count: 0 },
    ];

    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense") return;
      const amount = parseFloat(t.amount) || 0;
      for (const bucket of buckets) {
        if (amount >= bucket.min && amount < bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    return buckets;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4 backdrop-blur-sm" style={{ backgroundColor: 'var(--modal-overlay)' }}>
      <div className="my-2 sm:my-8 w-full max-w-5xl rounded-xl sm:rounded-2xl border shadow-2xl transition-colors duration-300" style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--card-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 sm:px-6 py-3 sm:py-4" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>Spending Analysis</h2>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
            style={{ color: 'var(--muted-light)' }}
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="border-b px-3 sm:px-6 py-2 sm:py-3" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--table-header-bg)' }}>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Filter by Date:</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="flex-1 sm:flex-none rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              />
              <span className="text-xs sm:text-sm" style={{ color: 'var(--muted-light)' }}>to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="flex-1 sm:flex-none rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--foreground)' }}
              />
              {(filterStartDate || filterEndDate) && (
                <button
                  onClick={clearDateFilter}
                  className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 border-b px-3 sm:px-6 py-3 sm:py-4 sm:grid-cols-4" style={{ borderColor: 'var(--card-border)' }}>
          <div 
            className="rounded-lg sm:rounded-xl p-2 sm:p-4 border-2"
            style={{ backgroundColor: 'transparent', borderColor: '#059669' }}
          >
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: '#059669' }}>Total Payments</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold" style={{ color: '#059669' }}>${summary.totalPayments.toFixed(2)}</p>
          </div>
          <div 
            className="rounded-lg sm:rounded-xl p-2 sm:p-4 border-2"
            style={{ backgroundColor: 'transparent', borderColor: '#dc2626' }}
          >
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: '#dc2626' }}>Total Expenses</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold" style={{ color: '#dc2626' }}>${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div 
            className="rounded-lg sm:rounded-xl p-2 sm:p-4 border-2"
            style={{ 
              backgroundColor: 'transparent', 
              borderColor: summary.netBalance >= 0 ? '#2563eb' : '#ea580c' 
            }}
          >
            <p 
              className="text-[10px] sm:text-xs font-medium uppercase tracking-wide"
              style={{ color: summary.netBalance >= 0 ? '#2563eb' : '#ea580c' }}
            >
              {summary.netBalance >= 0 ? "Overpaid" : "Remaining"}
            </p>
            <p 
              className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold"
              style={{ color: summary.netBalance >= 0 ? '#2563eb' : '#ea580c' }}
            >
              ${Math.abs(summary.netBalance).toFixed(2)}
            </p>
          </div>
          <div 
            className="rounded-lg sm:rounded-xl p-2 sm:p-4 border-2"
            style={{ backgroundColor: 'transparent', borderColor: '#9333ea' }}
          >
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: '#9333ea' }}>Payment Rate</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold" style={{ color: '#9333ea' }}>{summary.paymentRate}%</p>
          </div>
        </div>

        {/* Charts Sections */}
        <div className="max-h-[65vh] sm:max-h-[60vh] overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
          
          {/* Section 0: Payment Analysis (NEW) */}
          <div>
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-100">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Payment Analysis</h3>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              
              {/* Payment Coverage Rate Gauge */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Payment Coverage Rate</h4>
                <div className="flex flex-col items-center justify-center py-4">
                  {/* Gauge Circle */}
                  <div className="relative h-32 w-32 sm:h-40 sm:w-40">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={
                          parseFloat(summary.paymentRate) >= 100 ? "#10b981" :
                          parseFloat(summary.paymentRate) >= 75 ? "#3b82f6" :
                          parseFloat(summary.paymentRate) >= 50 ? "#f59e0b" : "#ef4444"
                        }
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(parseFloat(summary.paymentRate), 100) * 2.51} 251`}
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl sm:text-3xl font-bold ${
                        parseFloat(summary.paymentRate) >= 100 ? "text-emerald-600" :
                        parseFloat(summary.paymentRate) >= 75 ? "text-blue-600" :
                        parseFloat(summary.paymentRate) >= 50 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {summary.paymentRate}%
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">Coverage</span>
                    </div>
                  </div>
                  
                  {/* Status Message */}
                  <div 
                    className="mt-3 sm:mt-4 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-center border-2"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: parseFloat(summary.paymentRate) >= 100 ? '#059669' :
                                   parseFloat(summary.paymentRate) >= 75 ? '#2563eb' :
                                   parseFloat(summary.paymentRate) >= 50 ? '#f59e0b' : '#dc2626'
                    }}
                  >
                    <p 
                      className="text-xs sm:text-sm font-medium"
                      style={{
                        color: parseFloat(summary.paymentRate) >= 100 ? '#059669' :
                               parseFloat(summary.paymentRate) >= 75 ? '#2563eb' :
                               parseFloat(summary.paymentRate) >= 50 ? '#d97706' : '#dc2626'
                      }}
                    >
                      {parseFloat(summary.paymentRate) >= 100 ? "Fully covered! 🎉" :
                       parseFloat(summary.paymentRate) >= 75 ? "Almost there!" :
                       parseFloat(summary.paymentRate) >= 50 ? "Making progress" : "Needs attention"}
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      ${summary.totalPayments.toFixed(2)} of ${summary.totalExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment vs Expense by Month */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Payment vs Expense by Month</h4>
                {paymentVsExpenseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={paymentVsExpenseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#9ca3af" interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} width={45} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="payments" name="Payments" fill={COLORS.payment} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill={COLORS.expense} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No data available
                  </div>
                )}
              </div>

              {/* Outstanding Balance Over Time */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Outstanding Balance Over Time</h4>
                {outstandingBalanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={outstandingBalanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} width={50} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, value >= 0 ? "Surplus" : "Deficit"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        name="Balance" 
                        stroke="#3b82f6" 
                        fill="url(#balanceGradient)"
                        strokeWidth={2}
                      />
                      {/* Zero line reference */}
                      <Line type="monotone" dataKey={() => 0} stroke="#9ca3af" strokeDasharray="3 3" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No data available
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Section 1: Category/Description Analysis */}
          <div>
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-purple-100">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Category/Description Analysis</h3>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {/* Chart: Spending by Category */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Spending by Category</h4>
                {categoryData.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center">
                    <ResponsiveContainer width="100%" height={180} className="sm:!w-[60%]">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.sources[index % COLORS.sources.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `$${value.toFixed(2)}`}
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full sm:w-[40%] mt-2 sm:mt-0 space-y-1 sm:space-y-2">
                      {categoryData.slice(0, 9).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: COLORS.sources[index % COLORS.sources.length] }}
                          />
                          <span className="truncate text-[10px] sm:text-xs text-gray-600" title={entry.name}>{entry.name}</span>
                          <span className="ml-auto flex-shrink-0 text-[10px] sm:text-xs font-medium text-gray-800">
                            ${entry.value.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[180px] items-center justify-center text-gray-400 text-sm">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Top 10 Expenses (List) */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Top 10 Expenses</h4>
                {top10Expenses.length > 0 ? (
                  <div className="space-y-1.5 sm:space-y-2 max-h-[200px] overflow-y-auto">
                    {top10Expenses.map((expense, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 sm:gap-3 rounded-lg bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2"
                      >
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] sm:text-xs font-bold text-red-600">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs sm:text-sm text-gray-700" title={expense.description}>
                            {expense.description}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{expense.date}</p>
                        </div>
                        <span className="flex-shrink-0 text-sm sm:text-base font-bold text-red-600">
                          ${expense.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No expense data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Budgeting & Goals */}
          <div>
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-100">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Budgeting & Goals</h3>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {/* Spending Insights */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Spending Insights</h4>
                <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-3">
                  {/* Average Daily Spending */}
                  <div className="rounded-lg bg-gray-50 p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Avg. Daily</p>
                    <p className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-gray-800">
                      ${heatmapData.days.length > 0 
                        ? (summary.totalExpenses / heatmapData.days.length).toFixed(2) 
                        : "0.00"}
                    </p>
                  </div>
                  
                  {/* Average Monthly Spending */}
                  <div className="rounded-lg bg-gray-50 p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Avg. Monthly</p>
                    <p className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-gray-800">
                      ${monthlyData.length > 0 
                        ? (monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length).toFixed(2) 
                        : "0.00"}
                    </p>
                  </div>
                  
                  {/* Highest Spending Day of Week */}
                  <div className="rounded-lg bg-gray-50 p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Top Day</p>
                    <p className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-gray-800">
                      {dayOfWeekData.reduce((max, d) => d.amount > max.amount ? d : max, dayOfWeekData[0])?.day || "-"}
                    </p>
                  </div>
                  
                  {/* Transaction Count */}
                  <div className="rounded-lg bg-gray-50 p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">Transactions</p>
                    <p className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-gray-800">
                      {filteredTransactions.filter(t => t.type === "Expense").length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart: Daily Spending Heatmap */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Daily Spending Intensity</h4>
                {heatmapData.days.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {/* Heatmap Legend */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                      <span>Less</span>
                      <div className="flex gap-0.5 sm:gap-1">
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                          <div
                            key={intensity}
                            className="h-3 w-3 sm:h-4 sm:w-4 rounded"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-right">Max: ${heatmapData.maxAmount.toFixed(0)}</span>
                    </div>
                    
                    {/* Heatmap Grid - Show last 28 days in 4 rows of 7 */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="text-center text-[8px] sm:text-[10px] font-medium text-gray-400">
                          {day.slice(0, 1)}
                        </div>
                      ))}
                      {heatmapData.days.slice(-28).map((day, i) => (
                        <div
                          key={day.date}
                          className="group relative h-6 sm:h-8 rounded transition-transform hover:scale-110"
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
                    <div className="mt-2 sm:mt-4 space-y-1">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-500">Top Spending Days:</p>
                      {[...heatmapData.days]
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 3)
                        .map((day) => (
                          <div key={day.date} className="flex justify-between text-[10px] sm:text-xs">
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

              {/* Expense Distribution (Histogram) */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Expense Distribution</h4>
                {expenseDistribution.some((b) => b.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={expenseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" tick={{ fontSize: 8 }} stroke="#9ca3af" interval={0} angle={-30} textAnchor="end" height={40} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" allowDecimals={false} width={30} />
                      <Tooltip
                        formatter={(value) => [`${value} transactions`, "Count"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="count" name="Transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No expense data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Trends & Predictions */}
          <div>
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Trends & Predictions</h3>
            </div>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              {/* Chart: Monthly Spending Trend */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Monthly Spending Trend</h4>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#9ca3af" interval={0} angle={-45} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} width={45} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Expenses"
                        stroke={COLORS.expense}
                        fill={COLORS.expense}
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No data available
                  </div>
                )}
              </div>

              {/* Chart: Day of Week Analysis */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Spending by Day of Week</h4>
                {dayOfWeekData.some((d) => d.amount > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} width={45} />
                      <Tooltip
                        formatter={(value, name) => [`$${value.toFixed(2)}`, name === "amount" ? "Total" : "Average"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="amount" name="Total Spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Chart: Cumulative Spending */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Cumulative Spending</h4>
                {cumulativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v.toFixed(0)}`} width={45} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "Running Total"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Area type="monotone" dataKey="total" name="Running Total" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    No expense data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center sm:justify-end border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg bg-gray-100 px-6 py-2.5 sm:py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
