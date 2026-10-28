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
  MessageSquare,
  Star,
  LogOut,
  User,
  Lock,
  ArrowRight,
  Shield,
  BookOpen,
} from 'lucide-react';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
}

export default function Home() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>({
    id: 1,
    name: 'Dr. Rajesh Rao',
    email: 'admin@canteen.pes.edu',
    role: 'ADMIN',
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // App Data State
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackAgg, setFeedbackAgg] = useState<any[]>([]);
  const [feedbackFilterFood, setFeedbackFilterFood] = useState('ALL');

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
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Fetch Core Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAnalytics, resBatches, resDeals, resFeedback] = await Promise.all([
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/batches').then(r => r.json()),
        fetch('/api/deals').then(r => r.json()),
        fetch('/api/feedback').then(r => r.json()),
      ]);
      setAnalytics(resAnalytics);
      setBatches(resBatches.batches || []);
      setDeals(resDeals.deals || []);
      setFeedbackAgg(resFeedback.rootCauses || []);
      setFeedbackList(resFeedback.feedbacks || []);
    } catch (err) {
      console.error('Error loading canteen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Recommendation when parameters change
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

  // Handle Login Submission
  const handleLogin = async (roleOverride?: 'ADMIN' | 'STAFF' | 'STUDENT') => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const payload = roleOverride ? { role: roleOverride } : { email: loginEmail, password: loginPassword };
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please check your credentials.');
      } else {
        setCurrentUser(data.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login error');
    } finally {
      setLoginLoading(false);
    }
  };

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
            : '✅ Daily food record saved successfully with automated waste calculation.',
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
      const selectedDishName = analytics?.highWasteItems?.find((f: any) => f.food_id === parseInt(studentFoodId))?.food_name || 'Canteen Dish';
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_id: studentFoodId,
          food_name: selectedDishName,
          student_id: currentUser?.email?.split('@')[0] || 'PES1UG24CS001',
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

  // Filter feedback for admin view
  const filteredFeedbacks = feedbackFilterFood === 'ALL'
    ? feedbackList
    : feedbackList.filter(fb => String(fb.food_id) === feedbackFilterFood);

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

          {/* User Profile & Role Switcher */}
          {currentUser ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                  {currentUser.role === 'ADMIN' ? 'ADM' : currentUser.role === 'STAFF' ? 'STF' : 'STU'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {currentUser.name}
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                </div>
              </div>

              {/* Quick Switch Roles */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => handleLogin('ADMIN')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
                    currentUser.role === 'ADMIN' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin View
                </button>
                <button
                  onClick={() => handleLogin('STAFF')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
                    currentUser.role === 'STAFF' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Staff View
                </button>
                <button
                  onClick={() => handleLogin('STUDENT')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-medium ${
                    currentUser.role === 'STUDENT' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Student View
                </button>
                <button
                  onClick={() => setCurrentUser(null)}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleLogin('ADMIN')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              Sign In to System
            </button>
          )}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* ============================================================== */}
        {/* IF NOT LOGGED IN: LOGIN SCREEN */}
        {/* ============================================================== */}
        {!currentUser && (
          <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <Utensils className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Sign In to EcoBite</h2>
              <p className="text-xs text-slate-400 mt-1">Select your canteen role to continue</p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Quick Demo Role Cards */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => handleLogin('ADMIN')}
                className="w-full text-left p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Sign In as Admin
                    </div>
                    <div className="text-[11px] text-slate-400">Waste analytics, recommendations & student feedback</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin('STAFF')}
                className="w-full text-left p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Sign In as Canteen Staff
                    </div>
                    <div className="text-[11px] text-slate-400">Daily food entry & surplus clearance publisher</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin('STUDENT')}
                className="w-full text-left p-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 rounded-2xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Sign In as Student
                    </div>
                    <div className="text-[11px] text-slate-400">Browse menu, claim 50% flash deals & submit feedback</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* LOGGED IN USER CONTENT */}
        {/* ============================================================== */}
        {currentUser && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm text-slate-400">Loading canteen statistics...</p>
              </div>
            ) : (
              <>
                {/* ============================================================== */}
                {/* ROLE 1: ADMIN DASHBOARD */}
                {/* ============================================================== */}
                {currentUser.role === 'ADMIN' && (
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
                        <span className="text-[11px] text-emerald-400">Sold to diners</span>
                      </div>

                      <div className="glass-card p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-xs font-medium">Meals Wasted</span>
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-400">{analytics?.kpis?.totalWasted?.toLocaleString() || '345'}</div>
                        <span className="text-[11px] text-red-400 font-mono">Unconsumed meals</span>
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

                    {/* Main Visual Intelligence: Charts */}
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
                              Tracks demand patterns across weekdays to optimize preparation
                            </p>
                          </div>
                          <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-medium">
                            Peak Wastage: Friday (33.2%)
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
                            <strong>Pattern Identified:</strong> Friday wastage reaches <strong>33.2%</strong> (vs <strong>~10%</strong> Mon–Thu).
                            Students leaving campus early for the weekend causes excess food to be wasted unless preparation is scaled down.
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
                                    {cat.waste_rate}% ({cat.total_wasted} plates)
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
                          💡 <strong>Notice:</strong> Lunch drives 71% of total canteen economic loss. Breakfast items have the lowest waste (2.9%).
                        </div>
                      </div>
                    </div>

                    {/* Smart Preparation Recommendation */}
                    <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 shadow-2xl relative overflow-hidden">
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
                            Uses historical day-of-week sales averages to predict how much food to prepare
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
                            <span className="text-xs text-slate-400">Past Average Demand on {simDay}s</span>
                            <div className="text-2xl font-bold text-white">{simData.historical_avg_sold} plates</div>
                            <span className="text-[11px] text-slate-500">Average plates sold</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs text-emerald-400 font-semibold">Recommended Preparation Target</span>
                            <div className="text-2xl font-bold text-emerald-400">
                              {simData.recommended_qty} plates
                            </div>
                            <span className="text-[11px] text-emerald-300/80">Includes 5% buffer for demand spikes</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs text-amber-400 font-semibold">Estimated Money Saved</span>
                            <div className="text-2xl font-bold text-amber-400">
                              ₹{simData.potential_savings_inr?.toLocaleString() || '1,672'}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              By cooking {simData.recommended_qty} instead of standard {simData.typical_canteen_prep} plates
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ========================================================== */}
                    {/* NEW: ADMIN STUDENT FEEDBACK & REASON FOR WASTE (MONGODB) */}
                    {/* ========================================================== */}
                    <div className="glass-panel p-6 rounded-2xl border border-blue-500/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              <MessageSquare className="w-5 h-5" />
                            </span>
                            <h2 className="text-lg font-bold text-white">
                              Student Feedback & Why Food Was Left on Plates
                            </h2>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Direct student ratings and reasons stored in MongoDB (helps chefs fix recipes)
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">Filter by Dish:</span>
                          <select
                            value={feedbackFilterFood}
                            onChange={e => setFeedbackFilterFood(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                          >
                            <option value="ALL">All Dishes ({feedbackList.length})</option>
                            {analytics?.highWasteItems?.map((f: any) => (
                              <option key={f.food_id} value={String(f.food_id)}>
                                {f.food_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Root Cause Cards from MongoDB Aggregation */}
                      <div className="mb-6">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                          Top Reasons Students Discarded Food:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {feedbackAgg?.slice(0, 4).map((agg: any) => (
                            <div key={agg.reason} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-200">{agg.reason}</span>
                                <span className="text-xs bg-red-950 text-red-300 font-mono px-1.5 py-0.5 rounded">
                                  {agg.count} reports
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                Dishes: {agg.dishes?.slice(0, 2).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live Feed of Reviews */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Student Comments & Ratings ({filteredFeedbacks.length} reviews):
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                          {filteredFeedbacks.map((fb: any) => (
                            <div key={fb.id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-xs font-bold text-white">{fb.food_name}</div>
                                  <div className="text-[10px] text-slate-400">By {fb.student_id} • {fb.date}</div>
                                </div>
                                <div className="flex items-center text-amber-400 text-xs font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                                  {fb.rating} / 5
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1">
                                {fb.sensory_tags?.map((t: string) => (
                                  <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                                    {t.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>

                              {/* Written Comment */}
                              {fb.comment && (
                                <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 italic">
                                  "{fb.comment}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Table: Most Wasted Foods Ranking */}
                    <div className="glass-panel p-5 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h2 className="text-base font-semibold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            Most Wasted Food Items
                          </h2>
                          <p className="text-xs text-slate-400">Dishes ranked by food wasted</p>
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
                {/* ROLE 2: STAFF PORTAL */}
                {/* ============================================================== */}
                {currentUser.role === 'STAFF' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Food Entry Form */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                        <div>
                          <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-emerald-400" />
                            Daily Food Entry (Canteen Staff)
                          </h2>
                          <p className="text-xs text-slate-400">
                            Enter quantities prepared and sold. The system calculates food waste automatically.
                          </p>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                          Logged In: {currentUser.name}
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
                              High wastage warning (&gt; 20%)
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
                              Submit Daily Food Record
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
                          List remaining portions at a discount to prevent unconsumed food waste
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
                {/* ROLE 3: STUDENT PORTAL */}
                {/* ============================================================== */}
                {currentUser.role === 'STUDENT' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student Feedback Form */}
                    <div className="glass-panel p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-emerald-400" />
                            Submit Food Feedback
                          </h2>
                          <p className="text-xs text-slate-400">
                            Tell canteen management why food was left on your plate so chefs can adjust preparation
                          </p>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {currentUser.name}
                        </span>
                      </div>

                      {studentSuccess && (
                        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Thank you! Your feedback has been sent directly to the Admin Dashboard.</span>
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
                            Why was food left unfinished?
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
                            placeholder="e.g. Could not finish the biryani because of excessive spice..."
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <Send className="w-4 h-4" />
                          Send Feedback to Canteen Management
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
                          Subsidized meals available before lunch service closes
                        </p>

                        {claimSuccess && (
                          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{claimSuccess}</span>
                          </div>
                        )}

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
                                  onClick={() => {
                                    setClaimSuccess(`Meal claimed! Show token #${deal.deal_id}87 at Canteen Counter 2.`);
                                    setTimeout(() => setClaimSuccess(null), 5000);
                                  }}
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
                        🌱 Claiming surplus food reduces landfill waste and recovers meal costs.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
