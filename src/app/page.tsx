'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  TrendingDown,
  AlertTriangle,
  Leaf,
  DollarSign,
  Calendar,
  CheckCircle2,
  ChefHat,
  Layers,
  RefreshCw,
  Sliders,
  Tag,
  Send,
  Plus,
  Minus,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  const [activeRole, setActiveRole] = useState<'admin' | 'staff' | 'student'>('admin');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  // Staff Form State
  const [staffFoodId, setStaffFoodId] = useState('1');
  const [staffMealType, setStaffMealType] = useState('LUNCH');
  const [staffPrepared, setStaffPrepared] = useState(100);
  const [staffSold, setStaffSold] = useState(75);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffNotice, setStaffNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Smart Prep Simulator State
  const [simFoodId, setSimFoodId] = useState(1);
  const [simDay, setSimDay] = useState('Friday');
  const [simData, setSimData] = useState<any>(null);

  // Student Feedback State
  const [studentFoodId, setStudentFoodId] = useState('1');
  const [studentRating, setStudentRating] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>(['too_spicy']);
  const [studentComment, setStudentComment] = useState('');
  const [studentSuccess, setStudentSuccess] = useState(false);

  // Initial Data Fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAnalytics, resBatches, resDeals] = await Promise.all([
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/batches').then(r => r.json()),
        fetch('/api/deals').then(r => r.json()),
      ]);
      setAnalytics(resAnalytics);
      setBatches(resBatches.batches || []);
      setDeals(resDeals.deals || []);
    } catch (err) {
      console.error('Error loading canteen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch recommendation when sim params change
  useEffect(() => {
    const fetchRec = async () => {
      try {
        const res = await fetch(`/api/recommendation?food_id=${simFoodId}&day_of_week=${simDay}`);
        const data = await res.json();
        setSimData(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRec();
  }, [simFoodId, simDay]);

  // Handle Staff Batch Submission
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffSubmitting(true);
    setStaffNotice(null);

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_id: staffFoodId,
          meal_type: staffMealType,
          quantity_prepared: staffPrepared,
          quantity_sold: staffSold,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStaffNotice({
          type: 'error',
          message: data.error || 'Invalid entry: Quantity sold cannot exceed quantity prepared.',
        });
      } else {
        setStaffNotice({
          type: 'success',
          message: data.triggeredAlert
            ? `⚠️ Record saved! ${data.triggeredAlert.message}`
            : '✅ Daily record saved successfully.',
        });
        fetchData();
      }
    } catch (err: any) {
      setStaffNotice({ type: 'error', message: err.message });
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Handle Student Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_id: studentFoodId,
          food_name: analytics?.highWasteItems?.find((f: any) => f.food_id === parseInt(studentFoodId))?.food_name || 'Canteen Item',
          rating: studentRating,
          sensory_tags: selectedTags,
          comment: studentComment,
        }),
      });
      if (res.ok) {
        setStudentSuccess(true);
        setStudentComment('');
        fetchData();
        setTimeout(() => setStudentSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  // Staff Waste calculations on-the-fly
  const staffWasted = Math.max(0, staffPrepared - staffSold);
  const staffWastePct = staffPrepared > 0 ? ((staffWasted / staffPrepared) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Main Navigation Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">EcoBite</h1>
              <p className="text-sm text-slate-400">College Canteen Food Waste Tracker</p>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveRole('admin')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'admin'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>

            <button
              onClick={() => setActiveRole('staff')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'staff'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Staff Portal</span>
            </button>

            <button
              onClick={() => setActiveRole('student')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'student'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Student Feedback & Deals</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading canteen statistics...</p>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* TAB 1: ADMIN DASHBOARD */}
            {/* ============================================================== */}
            {activeRole === 'admin' && (
              <div className="space-y-6">
                {/* 6 Key Performance Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Meals Prepared</span>
                      <Utensils className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics?.kpis?.totalPrepared?.toLocaleString() || '1,850'}</div>
                    <span className="text-[11px] text-blue-400">Total plates prepared</span>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Meals Sold</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics?.kpis?.totalSold?.toLocaleString() || '1,505'}</div>
                    <span className="text-[11px] text-emerald-400">Sold to students & staff</span>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Meals Wasted</span>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-red-400">{analytics?.kpis?.totalWasted?.toLocaleString() || '345'}</div>
                    <span className="text-[11px] text-red-400 font-mono">Unconsumed food</span>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Waste Rate</span>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-amber-400">{analytics?.kpis?.wasteRate || '18.6'}%</div>
                    <span className="text-[11px] text-slate-400">Target: &lt; 10%</span>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Money Lost</span>
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">₹{analytics?.kpis?.financialLossINR?.toLocaleString() || '12,075'}</div>
                    <span className="text-[11px] text-slate-400">Cost of discarded food</span>
                  </div>

                  <div className="glass-card p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-xs font-medium">Canteen Eco Score</span>
                      <Leaf className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="text-lg font-bold text-teal-300 truncate">{analytics?.kpis?.ecoRating || 'A'}</div>
                    <span className="text-[11px] text-teal-400">{analytics?.kpis?.carbonFootprintKg || '724'} kg CO₂ saved</span>
                  </div>
                </div>

                {/* Main Visual Intelligence: Charts & Anomaly Discovery */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart 1: Day of Week Pattern (The Friday Discovery) */}
                  <div className="lg:col-span-2 glass-panel p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          Food Wastage by Day of the Week
                        </h2>
                        <p className="text-xs text-slate-400">
                          Tracks wastage trends across the week to adjust preparation schedules
                        </p>
                      </div>
                      <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">
                        Highest Wastage: Friday
                      </span>
                    </div>

                    {/* Interactive CSS Bar Chart */}
                    <div className="grid grid-cols-5 gap-3 pt-4 pb-2 items-end min-h-[220px]">
                      {analytics?.dayOfWeekTrends?.map((d: any) => {
                        const isFriday = d.day === 'Friday';
                        const heightPct = Math.min(100, Math.max(15, d.waste_rate * 2.5));
                        return (
                          <div key={d.day} className="flex flex-col items-center gap-2 group">
                            <span className="text-xs font-mono font-semibold text-slate-300">
                              {d.waste_rate}%
                            </span>
                            <div className="w-full bg-slate-800/80 rounded-t-lg h-40 flex items-end p-1 relative overflow-hidden">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded transition-all duration-500 ${
                                  isFriday
                                    ? 'bg-gradient-to-t from-red-600 to-rose-400 shadow-lg shadow-red-500/30'
                                    : 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                                }`}
                              ></div>
                            </div>
                            <span className={`text-xs font-medium ${isFriday ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                              {d.day}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">₹{d.loss_inr || d.financial_loss_inr}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Pattern Identified:</strong> Friday food wastage averages <strong>33.2%</strong> compared to <strong>~10%</strong> on Monday–Thursday.
                        Students leaving campus early causes excess prepared meals to be discarded.
                      </span>
                    </div>
                  </div>

                  {/* Chart 2: Category Breakdown */}
                  <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-400" />
                        Food Waste by Category
                      </h2>
                      <p className="text-xs text-slate-400 mb-4">Comparison across meal types</p>

                      <div className="space-y-3">
                        {analytics?.categorySummary?.map((cat: any) => (
                          <div key={cat.category} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-medium">{cat.category}</span>
                              <span className="font-mono text-slate-400">
                                {cat.waste_rate}% ({cat.total_wasted} meals)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, cat.waste_rate * 2.8)}%` }}
                                className={`h-full rounded-full ${
                                  cat.waste_rate > 20
                                    ? 'bg-red-500'
                                    : cat.waste_rate > 10
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-400">
                      💡 <strong>Note:</strong> Lunch accounts for the majority of wastage. Breakfast items consistently have the lowest wastage (2.9%).
                    </div>
                  </div>
                </div>

                {/* Smart Preparation Recommendation */}
                <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Sliders className="w-5 h-5" />
                        </span>
                        <h2 className="text-lg font-bold text-white">
                          Food Preparation Recommendation
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Suggests recommended food preparation quantities based on past demand for each weekday
                      </p>
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={simFoodId}
                        onChange={e => setSimFoodId(parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                      >
                        {analytics?.highWasteItems?.map((f: any) => (
                          <option key={f.food_id} value={f.food_id}>
                            {f.food_name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={simDay}
                        onChange={e => setSimDay(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday (High Waste Day)</option>
                      </select>
                    </div>
                  </div>

                  {/* Recommendation Results */}
                  {simData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400">Average Sold on {simDay}s</span>
                        <div className="text-2xl font-bold text-white">{simData.historical_avg_sold} plates</div>
                        <span className="text-[11px] text-slate-500">Based on past records</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-emerald-400 font-semibold">Recommended Preparation</span>
                        <div className="text-2xl font-bold text-emerald-400">
                          {simData.recommended_qty} plates
                        </div>
                        <span className="text-[11px] text-emerald-300/80">Includes a small buffer for demand spikes</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-amber-400 font-semibold">Estimated Money Saved</span>
                        <div className="text-2xl font-bold text-amber-400">
                          ₹{simData.potential_savings_inr?.toLocaleString() || '1,672'}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          By cooking {simData.recommended_qty} instead of {simData.typical_canteen_prep} plates
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table: Most Wasted Foods Ranking */}
                <div className="glass-panel p-5 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Most Wasted Food Items
                      </h2>
                      <p className="text-xs text-slate-400">Items ranked by total food wasted</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Ranked by Waste %</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                          <th className="py-3 px-3">Food Item</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3 text-right">Prepared</th>
                          <th className="py-3 px-3 text-right">Sold</th>
                          <th className="py-3 px-3 text-right">Wasted</th>
                          <th className="py-3 px-3 text-right">Waste Rate</th>
                          <th className="py-3 px-3 text-right">Money Lost</th>
                          <th className="py-3 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {analytics?.highWasteItems?.map((item: any) => (
                          <tr key={item.food_id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3 font-semibold text-white">
                              {item.food_name}
                            </td>
                            <td className="py-3 px-3 text-slate-300">{item.category}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-mono">{item.prepared}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-mono">{item.sold}</td>
                            <td className="py-3 px-3 text-right font-bold text-red-400 font-mono">{item.wasted}</td>
                            <td className="py-3 px-3 text-right font-bold font-mono">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  item.waste_rate_pct > 25
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : item.waste_rate_pct > 15
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {item.waste_rate_pct}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-yellow-400 font-mono">₹{item.loss_inr}</td>
                            <td className="py-3 px-3 text-center">
                              {item.waste_rate_pct > 20 ? (
                                <span className="inline-flex items-center text-[10px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full border border-red-700/50">
                                  High Waste
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                                  Acceptable
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: STAFF PORTAL */}
            {/* ============================================================== */}
            {activeRole === 'staff' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Food Entry Form */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-emerald-400" />
                        Daily Food Entry (Staff Portal)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Enter quantities prepared and sold. The system calculates wastage automatically.
                      </p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                      Staff: Ramesh Kumar
                    </span>
                  </div>

                  {staffNotice && (
                    <div
                      className={`p-4 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                        staffNotice.type === 'error'
                          ? 'bg-red-950/60 border border-red-800 text-red-200'
                          : 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                      }`}
                    >
                      {staffNotice.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span>{staffNotice.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleBatchSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Food Item
                        </label>
                        <select
                          value={staffFoodId}
                          onChange={e => setStaffFoodId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500"
                        >
                          {analytics?.highWasteItems?.map((f: any) => (
                            <option key={f.food_id} value={f.food_id}>
                              {f.food_name} ({f.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Meal Period
                        </label>
                        <select
                          value={staffMealType}
                          onChange={e => setStaffMealType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500"
                        >
                          <option value="BREAKFAST">BREAKFAST (Morning)</option>
                          <option value="LUNCH">LUNCH (Afternoon)</option>
                          <option value="SNACKS">SNACKS (Evening)</option>
                          <option value="DINNER">DINNER (Night)</option>
                        </select>
                      </div>
                    </div>

                    {/* Numeric Stepper Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-2">Quantity Prepared (Plates)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStaffPrepared(p => Math.max(0, p - 5))}
                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={staffPrepared}
                            onChange={e => setStaffPrepared(parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-slate-900 border border-slate-700 text-white font-bold text-lg rounded-lg py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => setStaffPrepared(p => p + 5)}
                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-2">Quantity Sold (Plates)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStaffSold(s => Math.max(0, s - 5))}
                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={staffSold}
                            onChange={e => setStaffSold(parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-slate-900 border border-slate-700 text-white font-bold text-lg rounded-lg py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => setStaffSold(s => s + 5)}
                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Calculated Waste Feedback Display */}
                    <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400">Calculated Wastage:</span>
                        <div className="text-slate-200 font-medium">
                          Wasted: <span className="text-red-400 font-bold">{staffWasted} plates</span> (
                          <span className="text-amber-400 font-bold">{staffWastePct}%</span>)
                        </div>
                      </div>

                      {parseFloat(staffWastePct) >= 20.0 && (
                        <span className="text-[11px] bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded-full animate-pulse">
                          High wastage detected (&gt; 20%)
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={staffSubmitting}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-2"
                    >
                      {staffSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving Daily Record...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit Food Record
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Flash Surplus Deals Panel */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-5 h-5 text-amber-400" />
                      <h2 className="text-base font-bold text-white">Remaining Surplus Meals</h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Active clearance deals for remaining portions to prevent end-of-day waste
                    </p>

                    <div className="space-y-3">
                      {deals.map(deal => (
                        <div key={deal.deal_id} className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-white">{deal.food_name}</span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Remaining: <span className="text-amber-400 font-semibold">{deal.surplus_qty} plates</span>
                              </div>
                            </div>
                            <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded">
                              {deal.discount_percent}% OFF
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                            <span className="text-slate-400 line-through">₹{deal.original_price}</span>
                            <span className="text-emerald-400 font-bold font-mono text-sm">₹{deal.flash_price}</span>
                            <span className="text-[10px] text-slate-500">Until: {deal.expires_at}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                    Remaining food after 3:45 PM is forwarded to hostel mess.
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: STUDENT FEEDBACK & DEALS */}
            {/* ============================================================== */}
            {activeRole === 'student' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Feedback Form */}
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-emerald-400" />
                        Student Food Feedback
                      </h2>
                      <p className="text-xs text-slate-400">
                        Tell us if something wasn't right so the canteen can improve recipes and portion sizes
                      </p>
                    </div>
                  </div>

                  {studentSuccess && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Thank you! Your feedback has been recorded for the kitchen staff.</span>
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Select Food Item</label>
                      <select
                        value={studentFoodId}
                        onChange={e => setStudentFoodId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                      >
                        {analytics?.highWasteItems?.map((f: any) => (
                          <option key={f.food_id} value={f.food_id}>
                            {f.food_name} ({f.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Rating ({studentRating} / 5 Stars)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStudentRating(star)}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                              studentRating >= star
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                          >
                            ★ {star}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sensory Tag Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        What was the issue with the food?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'too_spicy', label: '🌶️ Too Spicy' },
                          { id: 'portion_too_large', label: '📏 Portion Too Large' },
                          { id: 'cold', label: '❄️ Served Cold' },
                          { id: 'oily', label: '🛢️ Too Oily' },
                          { id: 'salty', label: '🧂 Oversalted' },
                          { id: 'bland', label: '🥣 Bland Taste' },
                        ].map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              selectedTags.includes(tag.id)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Comments</label>
                      <textarea
                        rows={3}
                        value={studentComment}
                        onChange={e => setStudentComment(e.target.value)}
                        placeholder="e.g. Could not finish the biryani because it was too spicy..."
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                    >
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </button>
                  </form>
                </div>

                {/* Active Campus Flash Surplus Deals */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-5 h-5 text-amber-400" />
                      <h2 className="text-base font-bold text-white">Discounted Surplus Meals</h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Subsidized meals available before afternoon lunch service closes
                    </p>

                    <div className="space-y-4">
                      {deals.map(deal => (
                        <div
                          key={deal.deal_id}
                          className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-bold text-white">{deal.food_name}</span>
                              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                {deal.surplus_qty} plates remaining
                              </p>
                            </div>
                            <span className="bg-emerald-500 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                              50% OFF
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                            <div>
                              <span className="text-xs text-slate-500 line-through mr-2">₹{deal.original_price}</span>
                              <span className="text-xl font-bold font-mono text-emerald-300">₹{deal.flash_price}</span>
                            </div>
                            <button
                              onClick={() => alert(`Meal claimed! Show token #${deal.deal_id}98 at Canteen Counter.`)}
                              className="bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                            >
                              Claim Meal Token
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                    🌱 124 discounted meals claimed this semester, preventing food waste.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
