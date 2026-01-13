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

    // Collect data from transactions grouped by month
    const monthMap = {};
    let minMonth = null;
    let maxMonth = null;

    filteredTransactions.forEach((t) => {
      if (!t.trans_date) return;
      const date = new Date(t.trans_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM
      
      // Track min/max months
      const monthDate = new Date(year, month, 1);
      if (!minMonth || monthDate < minMonth) minMonth = new Date(monthDate);
      if (!maxMonth || monthDate > maxMonth) maxMonth = new Date(monthDate);
      
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
      const startD = new Date(filterStartDate);
      const startMonth = new Date(startD.getFullYear(), startD.getMonth(), 1);
      if (!minMonth || startMonth < minMonth) minMonth = startMonth;
    }
    if (filterEndDate) {
      const endD = new Date(filterEndDate);
      const endMonth = new Date(endD.getFullYear(), endD.getMonth(), 1);
      if (!maxMonth || endMonth > maxMonth) maxMonth = endMonth;
    }

    if (!minMonth || !maxMonth) return [];

    // Generate all months between min and max
    const allMonths = [];
    const current = new Date(minMonth);

    while (current <= maxMonth) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap[key];
      
      allMonths.push({
        month: key,
        expenses: existing?.expenses || 0,
        label: `${MONTHS[current.getMonth()]} ${current.getFullYear()}`,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 p-2 sm:p-4 backdrop-blur-sm">
      <div className="my-2 sm:my-8 w-full max-w-5xl rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-800">Spending Analysis</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="border-b border-gray-100 bg-gray-50 px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Filter by Date:</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-xs sm:text-sm">to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {(filterStartDate || filterEndDate) && (
                <button
                  onClick={clearDateFilter}
                  className="rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 border-b border-gray-100 px-3 sm:px-6 py-3 sm:py-4 sm:grid-cols-4">
          <div className="rounded-lg sm:rounded-xl bg-emerald-50 p-2 sm:p-4">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-emerald-600">Total Payments</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-emerald-700">${summary.totalPayments.toFixed(2)}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-red-50 p-2 sm:p-4">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-red-600">Total Expenses</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-red-700">${summary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-4 ${summary.netBalance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide ${summary.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {summary.netBalance >= 0 ? "Overpaid" : "Remaining"}
            </p>
            <p className={`mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold ${summary.netBalance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
              ${Math.abs(summary.netBalance).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-purple-50 p-2 sm:p-4">
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-purple-600">Payment Rate</p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-purple-700">{summary.paymentRate}%</p>
          </div>
        </div>

        {/* Charts Sections */}
        <div className="max-h-[65vh] sm:max-h-[60vh] overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
          
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

              {/* Budget vs Actual */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Monthly Budget vs Actual</h4>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Budget: ${budgetData.budget.toFixed(0)}</span>
                    <span className={`font-semibold ${budgetData.isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
                      {budgetData.isOverBudget ? "Over!" : `$${budgetData.remaining.toFixed(0)} left`}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-5 sm:h-6 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                        budgetData.percentUsed > 90 ? "bg-red-500" : 
                        budgetData.percentUsed > 70 ? "bg-orange-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(budgetData.percentUsed, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-800">
                      ${budgetData.spent.toFixed(0)} ({budgetData.percentUsed.toFixed(0)}%)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-1.5 sm:p-2">
                      <p className="text-[10px] sm:text-xs text-gray-500">Budget</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">${budgetData.budget.toFixed(0)}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-1.5 sm:p-2">
                      <p className="text-[10px] sm:text-xs text-red-500">Spent</p>
                      <p className="text-xs sm:text-sm font-bold text-red-600">${budgetData.spent.toFixed(0)}</p>
                    </div>
                    <div className={`rounded-lg p-1.5 sm:p-2 ${budgetData.isOverBudget ? "bg-red-50" : "bg-emerald-50"}`}>
                      <p className={`text-[10px] sm:text-xs ${budgetData.isOverBudget ? "text-red-500" : "text-emerald-500"}`}>
                        {budgetData.isOverBudget ? "Over" : "Left"}
                      </p>
                      <p className={`text-xs sm:text-sm font-bold ${budgetData.isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
                        ${Math.abs(budgetData.remaining).toFixed(0)}
                      </p>
                    </div>
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

              {/* Chart: Rolling 7-Day Average */}
              <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                <h4 className="mb-2 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">7-Day Rolling Average</h4>
                {rollingAverageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rollingAverageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#9ca3af" tickFormatter={(v) => `$${v.toFixed(0)}`} width={45} />
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "7-Day Avg"]}
                        labelStyle={{ color: "#374151" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <Line type="monotone" dataKey="average" name="7-Day Avg" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">
                    Need at least 7 days of data
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
