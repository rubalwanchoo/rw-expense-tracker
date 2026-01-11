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

  // Helper function to get the start of the week (Sunday) for a date
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper function to format week label
  const formatWeekLabel = (date) => {
    const month = MONTHS[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // 1. Weekly Spending Trend Data - Shows all weeks in range
  const weeklyData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // First, collect data from transactions grouped by week
    const weekMap = {};
    let minDate = null;
    let maxDate = null;

    filteredTransactions.forEach((t) => {
      if (!t.trans_date) return;
      const date = new Date(t.trans_date);
      const weekStart = getWeekStart(date);
      const key = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD of week start
      
      // Track min/max dates
      if (!minDate || weekStart < minDate) minDate = new Date(weekStart);
      if (!maxDate || weekStart > maxDate) maxDate = new Date(weekStart);
      
      if (!weekMap[key]) {
        weekMap[key] = { week: key, expenses: 0, weekStart: new Date(weekStart) };
      }

      const amount = parseFloat(t.amount) || 0;
      if (t.type === "Expense") {
        weekMap[key].expenses += amount;
      }
    });

    // If filter dates are set, use them as boundaries
    if (filterStartDate) {
      const startD = getWeekStart(new Date(filterStartDate));
      if (!minDate || startD < minDate) minDate = startD;
    }
    if (filterEndDate) {
      const endD = getWeekStart(new Date(filterEndDate));
      if (!maxDate || endD > maxDate) maxDate = endD;
    }

    if (!minDate || !maxDate) return [];

    // Generate all weeks between min and max
    const allWeeks = [];
    const current = new Date(minDate);

    while (current <= maxDate) {
      const key = current.toISOString().split('T')[0];
      const existing = weekMap[key];
      
      allWeeks.push({
        week: key,
        expenses: existing?.expenses || 0,
        label: formatWeekLabel(current),
      });
      
      // Move to next week
      current.setDate(current.getDate() + 7);
    }

    return allWeeks;
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

  // Word frequency from descriptions
  const wordCloudData = useMemo(() => {
    const wordMap = {};
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "is", "was", "are", "been", "be", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "our", "their", "mine", "yours", "hers", "ours", "theirs"]);

    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense" || !t.description) return;
      const words = t.description.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
      words.forEach((word) => {
        if (word.length > 2 && !stopWords.has(word)) {
          wordMap[word] = (wordMap[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filteredTransactions]);

  // Rolling 7-day average spending
  const rollingAverageData = useMemo(() => {
    const expensesByDate = {};
    
    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense" || !t.trans_date) return;
      const date = t.trans_date;
      expensesByDate[date] = (expensesByDate[date] || 0) + (parseFloat(t.amount) || 0);
    });

    const sortedDates = Object.keys(expensesByDate).sort();
    if (sortedDates.length < 7) return [];

    const result = [];
    for (let i = 6; i < sortedDates.length; i++) {
      let sum = 0;
      for (let j = i - 6; j <= i; j++) {
        sum += expensesByDate[sortedDates[j]] || 0;
      }
      const avg = sum / 7;
      const date = new Date(sortedDates[i]);
      result.push({
        date: sortedDates[i],
        average: avg,
        label: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
      });
    }

    return result;
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

    Object.entries(dateMap).forEach(([date, total]) => {
      const d = new Date(date);
      result.push({
        date,
        total,
        label: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
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

  // Monthly budget tracking (default budget of $1000, can be customized later)
  const [monthlyBudget] = useState(2000);
  const budgetData = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    let currentMonthSpending = 0;
    filteredTransactions.forEach((t) => {
      if (t.type !== "Expense" || !t.trans_date) return;
      if (t.trans_date.startsWith(currentMonth)) {
        currentMonthSpending += parseFloat(t.amount) || 0;
      }
    });

    const percentUsed = monthlyBudget > 0 ? (currentMonthSpending / monthlyBudget) * 100 : 0;
    const remaining = monthlyBudget - currentMonthSpending;

    return {
      budget: monthlyBudget,
      spent: currentMonthSpending,
      remaining,
      percentUsed: Math.min(percentUsed, 100),
      isOverBudget: currentMonthSpending > monthlyBudget,
    };
  }, [filteredTransactions, monthlyBudget]);

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

        {/* Charts Sections */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6 space-y-8">
          
          {/* Section 1: Trends & Predictions */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Trends & Predictions</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Chart: Weekly Spending Trend */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Weekly Spending Trend</h4>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
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
                  <div className="flex h-[250px] items-center justify-center text-gray-400">
                    No data available
                  </div>
                )}
              </div>

              {/* Chart: Day of Week Analysis */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Spending by Day of Week</h4>
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

              {/* Chart: Rolling 7-Day Average */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">7-Day Rolling Average</h4>
                {rollingAverageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={rollingAverageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "7-Day Avg"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Line type="monotone" dataKey="average" name="7-Day Avg" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-gray-400">
                    Need at least 7 days of data
                  </div>
                )}
              </div>

              {/* Chart: Cumulative Spending */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Cumulative Spending</h4>
                {cumulativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "Running Total"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Area type="monotone" dataKey="total" name="Running Total" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-gray-400">
                    No expense data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Category/Description Analysis */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Category/Description Analysis</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Chart: Spending by Merchant */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Spending by Merchant</h4>
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

              {/* Top 10 Expenses (Horizontal Bar) */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Top 10 Expenses</h4>
                {top10Expenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={top10Expenses} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="description" tick={{ fontSize: 9 }} stroke="#9ca3af" width={100} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="amount" name="Amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-gray-400">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Word Cloud from Descriptions */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Frequent Keywords</h4>
                {wordCloudData.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center items-center min-h-[200px]">
                    {wordCloudData.map((item, index) => {
                      const maxCount = wordCloudData[0]?.count || 1;
                      const size = 0.7 + (item.count / maxCount) * 0.8;
                      const opacity = 0.5 + (item.count / maxCount) * 0.5;
                      return (
                        <span
                          key={item.word}
                          className="inline-block px-2 py-1 rounded-lg transition-transform hover:scale-110"
                          style={{
                            fontSize: `${size}rem`,
                            color: COLORS.sources[index % COLORS.sources.length],
                            opacity,
                            fontWeight: item.count > maxCount * 0.5 ? 600 : 400,
                          }}
                          title={`${item.word}: ${item.count} times`}
                        >
                          {item.word}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400">
                    No keywords found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Budgeting & Goals */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Budgeting & Goals</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Chart: Daily Spending Heatmap */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Daily Spending Intensity</h4>
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

              {/* Budget vs Actual */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Monthly Budget vs Actual</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget: ${budgetData.budget.toFixed(0)}</span>
                    <span className={`font-semibold ${budgetData.isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
                      {budgetData.isOverBudget ? "Over Budget!" : `${budgetData.remaining.toFixed(0)} remaining`}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                        budgetData.percentUsed > 90 ? "bg-red-500" : 
                        budgetData.percentUsed > 70 ? "bg-orange-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(budgetData.percentUsed, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                      ${budgetData.spent.toFixed(0)} ({budgetData.percentUsed.toFixed(0)}%)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-sm font-bold text-gray-800">${budgetData.budget.toFixed(0)}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2">
                      <p className="text-xs text-red-500">Spent</p>
                      <p className="text-sm font-bold text-red-600">${budgetData.spent.toFixed(0)}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${budgetData.isOverBudget ? "bg-red-50" : "bg-emerald-50"}`}>
                      <p className={`text-xs ${budgetData.isOverBudget ? "text-red-500" : "text-emerald-500"}`}>
                        {budgetData.isOverBudget ? "Over" : "Left"}
                      </p>
                      <p className={`text-sm font-bold ${budgetData.isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
                        ${Math.abs(budgetData.remaining).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expense Distribution (Histogram) */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Expense Distribution</h4>
                {expenseDistribution.some((b) => b.count > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={expenseDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value} transactions`, "Count"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Bar dataKey="count" name="Transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-gray-400">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Spending Insights */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-4 text-base font-semibold text-gray-700">Spending Insights</h4>
                <div className="space-y-4">
                  {/* Average Daily Spending */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg. Daily Spending</p>
                    <p className="mt-1 text-xl font-bold text-gray-800">
                      ${heatmapData.days.length > 0 
                        ? (summary.totalExpenses / heatmapData.days.length).toFixed(2) 
                        : "0.00"}
                    </p>
                  </div>
                  
                  {/* Average Weekly Spending */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg. Weekly Spending</p>
                    <p className="mt-1 text-xl font-bold text-gray-800">
                      ${weeklyData.length > 0 
                        ? (weeklyData.reduce((sum, w) => sum + w.expenses, 0) / weeklyData.length).toFixed(2) 
                        : "0.00"}
                    </p>
                  </div>
                  
                  {/* Highest Spending Day of Week */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Highest Spending Day</p>
                    <p className="mt-1 text-xl font-bold text-gray-800">
                      {dayOfWeekData.reduce((max, d) => d.amount > max.amount ? d : max, dayOfWeekData[0])?.day || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${dayOfWeekData.reduce((max, d) => d.amount > max.amount ? d : max, dayOfWeekData[0])?.amount.toFixed(2) || "0.00"} total
                    </p>
                  </div>
                  
                  {/* Transaction Count */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Transactions</p>
                    <p className="mt-1 text-xl font-bold text-gray-800">
                      {filteredTransactions.filter(t => t.type === "Expense").length}
                    </p>
                  </div>
                </div>
              </div>
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
