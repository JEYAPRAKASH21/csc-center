import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Bill } from '../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Download, 
  CreditCard, 
  Award,
  BarChart3,
  Flame,
  CheckCircle2,
  Trash2,
  LineChart,
  BarChart2
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { bills, clearAllBills } = useApp();

  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; amount: number; x: number; y: number } | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Accurate Date calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);
  const thisYearStr = todayStr.substring(0, 4);

  // Timeframe filtered bills
  const todayBills = useMemo(() => bills.filter((b) => b.date.startsWith(todayStr)), [bills, todayStr]);
  const monthBills = useMemo(() => bills.filter((b) => b.date.startsWith(thisMonthStr)), [bills, thisMonthStr]);
  const yearBills = useMemo(() => bills.filter((b) => b.date.startsWith(thisYearStr)), [bills, thisYearStr]);

  // Revenue Totals
  const dailyRevenue = useMemo(() => todayBills.reduce((sum, b) => sum + b.totalAmount, 0), [todayBills]);
  const monthlyRevenue = useMemo(() => monthBills.reduce((sum, b) => sum + b.totalAmount, 0), [monthBills]);
  const yearlyRevenue = useMemo(() => yearBills.reduce((sum, b) => sum + b.totalAmount, 0), [yearBills]);

  // Top Selling Item Calculation
  const mostSoldItemStats = useMemo(() => {
    const qtyMap: Record<string, number> = {};
    const revMap: Record<string, number> = {};

    bills.forEach((b) => {
      b.items.forEach((item) => {
        qtyMap[item.name] = (qtyMap[item.name] || 0) + item.quantity;
        revMap[item.name] = (revMap[item.name] || 0) + item.totalPrice;
      });
    });

    let topName = 'No Sales Yet';
    let maxQty = 0;
    let maxRev = 0;

    Object.entries(qtyMap).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        topName = name;
        maxRev = revMap[name] || 0;
      }
    });

    return { name: topName, count: maxQty, revenue: maxRev };
  }, [bills]);

  // Dynamic Chart Data based on selected timeframe
  const chartData = useMemo(() => {
    if (timeframe === 'daily') {
      const hours = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
      const hourTotals = hours.map((h, i) => {
        const hourNum = 7 + i;
        const totalForHour = todayBills
          .filter((b) => new Date(b.date).getHours() === hourNum)
          .reduce((sum, b) => sum + b.totalAmount, 0);
        return { label: h, amount: totalForHour };
      });
      const maxAmt = Math.max(...hourTotals.map((d) => d.amount), 100);
      return hourTotals.map((d) => ({
        ...d,
        heightPct: Math.min(100, Math.max(5, Math.round((d.amount / maxAmt) * 100))),
      }));
    } else if (timeframe === 'monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayTotals = [];
      for (let day = 1; day <= daysInMonth; day += 2) {
        const dayPrefix = `${thisMonthStr}-${day < 10 ? '0' + day : day}`;
        const totalForDay = bills
          .filter((b) => b.date.startsWith(dayPrefix))
          .reduce((sum, b) => sum + b.totalAmount, 0);
        dayTotals.push({ label: `Day ${day}`, amount: totalForDay });
      }
      const maxAmt = Math.max(...dayTotals.map((d) => d.amount), 100);
      return dayTotals.map((d) => ({
        ...d,
        heightPct: Math.min(100, Math.max(5, Math.round((d.amount / maxAmt) * 100))),
      }));
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthTotals = months.map((m, i) => {
        const monthPrefix = `${thisYearStr}-${(i + 1) < 10 ? '0' + (i + 1) : i + 1}`;
        const totalForMonth = bills
          .filter((b) => b.date.startsWith(monthPrefix))
          .reduce((sum, b) => sum + b.totalAmount, 0);
        return { label: m, amount: totalForMonth };
      });
      const maxAmt = Math.max(...monthTotals.map((d) => d.amount), 100);
      return monthTotals.map((d) => ({
        ...d,
        heightPct: Math.min(100, Math.max(5, Math.round((d.amount / maxAmt) * 100))),
      }));
    }
  }, [timeframe, todayBills, bills, thisMonthStr, thisYearStr, now]);

  const maxChartAmount = useMemo(() => Math.max(...chartData.map(d => d.amount), 100), [chartData]);

  // Generate SVG path for line/area graph
  const svgGraphPoints = useMemo(() => {
    const width = 800;
    const height = 180;
    const padding = 20;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const points = chartData.map((d, index) => {
      const x = padding + (index / Math.max(1, chartData.length - 1)) * effectiveWidth;
      const y = height - padding - (d.amount / maxChartAmount) * effectiveHeight;
      return { x, y, label: d.label, amount: d.amount };
    });

    const linePathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const firstPt = points[0] || { x: padding, y: height - padding };
    const lastPt = points[points.length - 1] || { x: width - padding, y: height - padding };
    const areaPathD = `${linePathD} L ${lastPt.x} ${height - padding} L ${firstPt.x} ${height - padding} Z`;

    return { points, linePathD, areaPathD, width, height };
  }, [chartData, maxChartAmount]);

  // Export Sales Report CSV
  const exportCSVReport = () => {
    const headers = ['Bill Number,Date,Customer Name,Phone,Items Count,Subtotal,Discount,Total Amount,Payment Method,Status'];
    const rows = bills.map((b) =>
      `"${b.billNumber}","${new Date(b.date).toLocaleString('en-IN')}","${b.customerName}","${b.customerPhone}",${b.items.length},${b.subtotal},${b.discount},${b.totalAmount},"${b.paymentMethod}","${b.paymentStatus}"`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSC_Revenue_Analytics_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Payment Breakdown
  const cashRevenue = useMemo(() => bills.filter((b) => b.paymentMethod === 'cash').reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const upiRevenue = useMemo(() => bills.filter((b) => b.paymentMethod === 'upi').reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const creditRevenue = useMemo(() => bills.filter((b) => b.paymentMethod === 'credit').reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const totalRevenueAll = useMemo(() => cashRevenue + upiRevenue + creditRevenue || 1, [cashRevenue, upiRevenue, creditRevenue]);

  const cashPct = Math.round((cashRevenue / totalRevenueAll) * 100);
  const upiPct = Math.round((upiRevenue / totalRevenueAll) * 100);
  const creditPct = Math.round((creditRevenue / totalRevenueAll) * 100);

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-1">
      {/* ACCURATE REVENUE METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Revenue Card */}
        <div className="bg-[#121827] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">DAILY REVENUE (TODAY)</p>
            <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">₹{dailyRevenue}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{todayBills.length} transaction(s)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="bg-[#121827] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">MONTHLY REVENUE</p>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">₹{monthlyRevenue}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{monthBills.length} transaction(s)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Yearly Revenue Card */}
        <div className="bg-[#121827] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">YEARLY REVENUE</p>
            <p className="text-2xl font-extrabold text-csc-400 font-mono mt-1">₹{yearlyRevenue}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{yearBills.length} transaction(s)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-csc-600/10 border border-csc-500/20 flex items-center justify-center text-csc-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-[#121827] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">TOTAL TRANSACTIONS</p>
            <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">{bills.length}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Lifetime Bills Processed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* GRAPH & CHART SECTION WITH GRAPH TYPE SWITCHER */}
      <div className="bg-[#121827] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" /> Interactive Sales Revenue Graph & Chart
            </h3>
            <p className="text-xs text-slate-400">
              Visualizing revenue trends for {timeframe} timeframe (Max: ₹{maxChartAmount})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Graph Type Switcher (Line/Area vs Bar) */}
            <div className="flex bg-[#0b0f19] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setChartType('area')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  chartType === 'area' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" /> Trend Graph
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  chartType === 'bar' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Bar Chart
              </button>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex bg-[#0b0f19] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'daily' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'monthly' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeframe('yearly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'yearly' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              onClick={exportCSVReport}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1b2336] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>

            {/* Delete All Analytics Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all analytics and sales data? This will reset all revenue metrics to ₹0.')) {
                  clearAllBills();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition"
              title="Reset all revenue analytics data to zero"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All Analytics
            </button>
          </div>
        </div>

        {/* Dynamic Graph Rendering */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" />
              <span className="capitalize">{timeframe} Sales Revenue {chartType === 'area' ? 'Trend Curve (₹)' : 'Bar Breakdown (₹)'}</span>
            </div>
            {hoveredPoint && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs px-2.5 py-0.5 rounded-lg">
                {hoveredPoint.label}: ₹{hoveredPoint.amount}
              </span>
            )}
          </div>

          {/* RENDER MODE 1: SMOOTH SVG TREND AREA GRAPH */}
          {chartType === 'area' ? (
            <div className="relative bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 overflow-hidden">
              <svg viewBox={`0 0 ${svgGraphPoints.width} ${svgGraphPoints.height}`} className="w-full h-52 overflow-visible">
                <defs>
                  <linearGradient id="amberAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Y Grid Lines */}
                <line x1="20" y1="20" x2="780" y2="20" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="20" y1="90" x2="780" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="20" y1="160" x2="780" y2="160" stroke="#334155" />

                {/* Filled Area under Curve */}
                <path d={svgGraphPoints.areaPathD} fill="url(#amberAreaGradient)" />

                {/* Glowing Smooth Line Curve */}
                <path
                  d={svgGraphPoints.linePathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />

                {/* Interactive Data Points */}
                {svgGraphPoints.points.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      className="fill-amber-400 stroke-[#0b0f19] stroke-2 group-hover:r-7 transition-all duration-150"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {pt.amount > 0 && (
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        className="fill-amber-300 font-mono text-[9px] font-bold"
                      >
                        ₹{pt.amount}
                      </text>
                    )}
                  </g>
                ))}
              </svg>

              {/* X-Axis Labels */}
              <div className="flex justify-between items-center px-4 pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                {chartData.map((d, i) => (
                  <span key={i} className="truncate max-w-[40px] text-center">{d.label}</span>
                ))}
              </div>
            </div>
          ) : (
            /* RENDER MODE 2: VERTICAL BAR GRAPH */
            <div className="h-56 w-full flex items-end justify-between gap-2 px-2 pt-6 border-b border-slate-800 bg-[#0b0f19] rounded-2xl p-4">
              {chartData.map((d, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Amount Badge on Top of Bar */}
                  {d.amount > 0 && (
                    <span className="text-[9px] font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition">
                      ₹{d.amount}
                    </span>
                  )}
                  <div className="w-full bg-[#121827] rounded-t-md h-full flex items-end overflow-hidden p-0.5 border border-slate-800">
                    <div
                      style={{ height: `${d.heightPct}%` }}
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t group-hover:brightness-125 transition-all duration-300 min-h-[4px] shadow-lg shadow-amber-500/20"
                      title={`${d.label}: ₹${d.amount}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400 transition truncate max-w-[40px]">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT SHARE & MOST SOLD ITEM STATISTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Sold Item Statistics */}
        <div className="bg-[#121827] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> Most Sold Item (Top Selling Service)
          </h3>

          <div className="bg-[#0b0f19] p-5 rounded-2xl border border-slate-800 space-y-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOP SELLING ITEM</p>
            <p className="text-xl font-extrabold text-amber-400">{mostSoldItemStats.name}</p>
            <div className="flex justify-center items-center gap-6 pt-2 font-mono text-xs">
              <div className="bg-[#151c2e] px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px]">Total Sold: </span>
                <span className="font-bold text-white">{mostSoldItemStats.count} units</span>
              </div>
              <div className="bg-[#151c2e] px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px]">Total Revenue: </span>
                <span className="font-bold text-emerald-400">₹{mostSoldItemStats.revenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Mode Revenue Share */}
        <div className="bg-[#121827] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Mode Revenue Share
          </h3>

          <div className="space-y-3">
            <div className="h-4 w-full bg-[#0b0f19] rounded-full overflow-hidden flex p-0.5 border border-slate-800">
              <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 h-full rounded-l transition-all" title={`Cash: ${cashPct}%`} />
              <div style={{ width: `${upiPct}%` }} className="bg-csc-500 h-full transition-all" title={`UPI: ${upiPct}%`} />
              <div style={{ width: `${creditPct}%` }} className="bg-rose-500 h-full rounded-r transition-all" title={`Credit: ${creditPct}%`} />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Cash</p>
                <p className="font-mono font-bold text-emerald-400 mt-1">₹{cashRevenue}</p>
                <p className="text-[9px] text-slate-500 font-mono">{cashPct}% share</p>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">UPI QR</p>
                <p className="font-mono font-bold text-csc-400 mt-1">₹{upiRevenue}</p>
                <p className="text-[9px] text-slate-500 font-mono">{upiPct}% share</p>
              </div>

              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Credit / Khata</p>
                <p className="font-mono font-bold text-rose-400 mt-1">₹{creditRevenue}</p>
                <p className="text-[9px] text-slate-500 font-mono">{creditPct}% share</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
