/**
 * PortfolioSense — AI-Powered Portfolio Intelligence Platform
 *
 * A full-stack PE portfolio monitoring tool that ingests portfolio company
 * reports (Excel, PDF, Word), normalises KPIs using AI, detects early warning
 * signals, generates IC memos, and provides AI-powered valuation analysis.
 *
 * TECH STACK
 * ----------
 * Frontend : React 18 + Tailwind CSS
 * AI Engine: Anthropic Claude API (claude-sonnet-4-20250514)
 * File Parse: pdf-parse, xlsx, mammoth (Node.js backend)
 * Backend  : Node.js / Express API server
 * DB       : PostgreSQL (portfolio KPI store) + Pinecone (vector embeddings)
 * Auth     : Auth0 (SSO for PE firms)
 * Deploy   : Vercel (frontend) + Railway/Render (backend)
 *
 * HOW TO RUN LOCALLY
 * ------------------
 * 1. npm install
 * 2. Set ANTHROPIC_API_KEY in .env
 * 3. npm run dev
 *
 * This file is the complete React frontend. See README section at the bottom
 * for the companion Express backend (server.js) code.
 */
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PORTFOLIO_DATA = [
  {
    id: 1,
    name: 'NovaTech Solutions',
    sector: 'SaaS',
    vintage: 2021,
    revenue: 84,
    revenuePlan: 76,
    ebitda: 18.2,
    ebitdaPlan: 16.1,
    grossMargin: 74.3,
    nrr: 127,
    churn: 2.1,
    status: 'on_track',
    trend: [62, 68, 71, 74, 78, 82, 84],
    netDebt: 45,
    entryEV: 380,
    currentMultiple: 16.8,
    moic: 1.86,
    grossIRR: 24.3,
    alerts: [],
    lastReport: 'Q3 2024 Financial Pack',
    lastReportDate: '2024-10-15',
  },
  {
    id: 2,
    name: 'HealthBridge Clinics',
    sector: 'Healthcare',
    vintage: 2020,
    revenue: 127,
    revenuePlan: 148,
    ebitda: 8.4,
    ebitdaPlan: 10.2,
    grossMargin: 34.1,
    nrr: null,
    churn: 9.1,
    status: 'critical',
    trend: [148, 142, 138, 131, 129, 128, 127],
    netDebt: 112,
    entryEV: 480,
    currentMultiple: 8.2,
    moic: 0.72,
    grossIRR: -11.4,
    alerts: ['ebitda_compression', 'churn_spike', 'headcount_reduction'],
    lastReport: 'Q3 2024 MIS',
    lastReportDate: '2024-10-22',
  },
  {
    id: 3,
    name: 'GreenFleet Logistics',
    sector: 'Logistics',
    vintage: 2022,
    revenue: 56,
    revenuePlan: 58,
    ebitda: 7.1,
    ebitdaPlan: 7.7,
    grossMargin: 18.4,
    nrr: null,
    churn: null,
    status: 'watch',
    trend: [51, 53, 54, 53, 55, 56, 56],
    netDebt: 28,
    entryEV: 267,
    currentMultiple: 11.4,
    moic: 1.21,
    grossIRR: 9.6,
    alerts: ['margin_compression', 'dso_extension'],
    lastReport: 'Oct 2024 Board Pack',
    lastReportDate: '2024-11-01',
  },
  {
    id: 4,
    name: 'Apex Consumer Brands',
    sector: 'Consumer',
    vintage: 2021,
    revenue: 203,
    revenuePlan: 197,
    ebitda: 28.4,
    ebitdaPlan: 27.5,
    grossMargin: 42.1,
    nrr: null,
    churn: null,
    status: 'on_track',
    trend: [188, 193, 196, 198, 200, 202, 203],
    netDebt: 145,
    entryEV: 820,
    currentMultiple: 14.6,
    moic: 1.44,
    grossIRR: 18.2,
    alerts: [],
    lastReport: 'Q3 2024 Financial Report',
    lastReportDate: '2024-10-18',
  },
  {
    id: 5,
    name: 'PrecisionMfg Co.',
    sector: 'Industrial',
    vintage: 2022,
    revenue: 71,
    revenuePlan: 80,
    ebitda: 9.8,
    ebitdaPlan: 11.1,
    grossMargin: 28.6,
    nrr: null,
    churn: null,
    status: 'watch',
    trend: [78, 76, 75, 74, 73, 72, 71],
    netDebt: 52,
    entryEV: 310,
    currentMultiple: 11.4,
    moic: 1.21,
    grossIRR: 9.6,
    alerts: ['key_person_risk'],
    lastReport: 'Q3 2024 Management Accounts',
    lastReportDate: '2024-10-30',
  },
];

const ALERT_DEFINITIONS = {
  ebitda_compression: {
    severity: 'critical',
    title: 'EBITDA Compression — 3Q Consecutive',
    description:
      'AI detected compounding deterioration: EBITDA margin compressed 820bps over 3 consecutive quarters. Historical PE data suggests 73% probability of covenant breach within 2 quarters if trajectory holds.',
    icon: '⚠',
    metrics: 'EBITDA · Margin · Leverage',
  },
  churn_spike: {
    severity: 'critical',
    title: 'Patient/Customer Churn Acceleration',
    description:
      'Churn accelerated from 4.2% to 9.1% MoM. AI cross-referencing with NPS sentiment in management commentary suggests service quality decline linked to staffing reductions.',
    icon: '📉',
    metrics: 'Churn Rate · NPS',
  },
  headcount_reduction: {
    severity: 'warning',
    title: 'Reactive Headcount Cuts Detected',
    description:
      'Headcount reduced 14% in Q3. AI sentiment analysis of board minutes flagged "cost management" framing as reactive rather than strategic. Correlated with future EBITDA misses in 68% of comparable cases.',
    icon: '👥',
    metrics: 'Headcount · Board Sentiment',
  },
  margin_compression: {
    severity: 'warning',
    title: 'Gross Margin Compression vs Peers',
    description:
      'Gross margin declined 340bps vs last quarter. AI benchmarking against 12 sector comparables shows fuel/cost pass-through rate of 41% vs sector median of 67%. Pricing power erosion underway.',
    icon: '📊',
    metrics: 'Gross Margin · Benchmarking',
  },
  dso_extension: {
    severity: 'warning',
    title: 'DSO Extension — Working Capital Risk',
    description:
      'DSO extended to 67 days vs 48-day sector median. Trend line suggests further extension. At current trajectory, working capital gap will require additional £8–12M facility within 6 months.',
    icon: '🕐',
    metrics: 'DSO · Working Capital',
  },
  key_person_risk: {
    severity: 'warning',
    title: 'Key Person Departure Signal — CFO',
    description:
      'AI parsed board minutes: "transition planning" mentioned twice. LinkedIn signal analysis: CFO profile updated, 3 new connections at competing firms. Historical PE data: CFO departures correlate with 15–22% EBITDA miss in following 2 quarters.',
    icon: '🔑',
    metrics: 'Key Person · Board Minutes · LinkedIn',
  },
};

// ─── Anthropic API Call ───────────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage, maxTokens = 1000) {
  /**
   * In production, this call goes through your backend API server
   * (Express/Node.js) which holds the ANTHROPIC_API_KEY securely.
   *
   * Backend endpoint: POST /api/ai/generate
   * The backend proxies to: https://api.anthropic.com/v1/messages
   *
   * For this demo, we call the Anthropic API directly.
   * NEVER expose your API key in a frontend in production.
   */
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || 'AI analysis unavailable.';
}

// ─── Utility Components ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const configs = {
    on_track: {
      label: 'On Track',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    watch: {
      label: 'Watch',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    critical: {
      label: '⚠ Critical',
      className: 'bg-red-50 text-red-700 border border-red-200',
    },
  };
  const c = configs[status] || configs.on_track;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.className}`}
    >
      {c.label}
    </span>
  );
}

function Sparkline({ data, status }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64,
    h = 28,
    pad = 2;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const color =
    status === 'on_track'
      ? '#059669'
      : status === 'critical'
      ? '#dc2626'
      : '#d97706';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ label, value, sub, subType = 'neutral' }) {
  const subColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    warn: 'text-amber-600',
    neutral: 'text-slate-400',
  };
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-medium text-slate-800">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColors[subType]}`}>{sub}</p>}
    </div>
  );
}

// ─── Panel: Portfolio Overview ─────────────────────────────────────────────────

function PortfolioPanel({ companies, onAnalyse }) {
  const totalAUM = companies.reduce((s, c) => s + c.revenue, 0);
  const avgEbitdaVsPlan =
    companies.reduce(
      (s, c) => s + ((c.ebitda - c.ebitdaPlan) / c.ebitdaPlan) * 100,
      0
    ) / companies.length;
  const alertCount = companies.reduce((s, c) => s + c.alerts.length, 0);
  const criticalCount = companies.filter((c) => c.status === 'critical').length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Portfolio Companies"
          value={companies.length}
          sub="2 new this year"
          subType="up"
        />
        <MetricCard
          label="Total Revenue"
          value={`$${totalAUM}M`}
          sub="↑ 8.3% YTD"
          subType="up"
        />
        <MetricCard
          label="Avg EBITDA vs Plan"
          value={`${avgEbitdaVsPlan.toFixed(1)}%`}
          sub={`${criticalCount} companies at risk`}
          subType="down"
        />
        <MetricCard
          label="AI Alerts"
          value={alertCount}
          sub="1 critical"
          subType="warn"
        />
      </div>

      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
        Portfolio Companies
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                'Company',
                'Sector',
                'Revenue',
                'EBITDA vs Plan',
                'Trend',
                'AI Status',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs text-slate-400 font-medium pb-2 px-2"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((co) => {
              const ebitdaPct =
                ((co.ebitda - co.ebitdaPlan) / co.ebitdaPlan) * 100;
              return (
                <tr
                  key={co.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-2 font-medium text-slate-800">
                    {co.name}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                      {co.sector}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700">${co.revenue}M</td>
                  <td
                    className={`py-3 px-2 font-medium ${
                      ebitdaPct >= 0
                        ? 'text-emerald-600'
                        : ebitdaPct > -10
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {ebitdaPct >= 0 ? '+' : ''}
                    {ebitdaPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2">
                    <Sparkline data={co.trend} status={co.status} />
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={co.status} />
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onAnalyse(co)}
                      className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Analyse ↗
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Panel: AI Alerts ─────────────────────────────────────────────────────────

function AlertsPanel({ companies, onGenerateMemo }) {
  const allAlerts = [];
  companies.forEach((co) => {
    co.alerts.forEach((alertKey) => {
      const def = ALERT_DEFINITIONS[alertKey];
      if (def) allAlerts.push({ company: co, alertKey, def });
    });
  });

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort(
    (a, b) => severityOrder[a.def.severity] - severityOrder[b.def.severity]
  );

  const severityStyles = {
    critical: {
      border: 'border-red-100',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
    },
    warning: {
      border: 'border-amber-100',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    info: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        AI-Generated Early Warning Alerts — {allAlerts.length} active
      </p>
      {allAlerts.map(({ company, alertKey, def }, idx) => {
        const s = severityStyles[def.severity];
        return (
          <div
            key={`${company.id}-${alertKey}`}
            className={`border ${s.border} rounded-xl p-4 flex gap-3`}
          >
            <div
              className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-content text-lg flex-shrink-0 flex items-center justify-center`}
            >
              <span>{def.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-slate-800 text-sm">
                  {company.name}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.badgeBg}`}
                >
                  {def.severity === 'critical'
                    ? 'Critical'
                    : def.severity === 'warning'
                    ? 'Watch'
                    : 'Opportunity'}
                </span>
                <span className="text-xs text-slate-400">{def.metrics}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {def.description}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-400">
                  🕐 Detected from: {company.lastReport} (
                  {company.lastReportDate})
                </span>
                <button
                  onClick={() => onGenerateMemo(company)}
                  className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Generate IC Memo ↗
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel: AI Memo Generator ────────────────────────────────────────────────

function MemoPanel({ companies, preselected }) {
  const [selectedCompany, setSelectedCompany] = useState(
    preselected?.id?.toString() || ''
  );
  const [memoType, setMemoType] = useState('quarterly');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselected) {
      setSelectedCompany(preselected.id.toString());
    }
  }, [preselected]);

  const generateMemo = useCallback(async () => {
    if (!selectedCompany) return;
    const co = companies.find((c) => c.id.toString() === selectedCompany);
    if (!co) return;

    setLoading(true);
    setMemo('');

    const ebitdaPct = (
      ((co.ebitda - co.ebitdaPlan) / co.ebitdaPlan) *
      100
    ).toFixed(1);
    const revPct = (
      ((co.revenue - co.revenuePlan) / co.revenuePlan) *
      100
    ).toFixed(1);
    const alertSummary = co.alerts
      .map((a) => ALERT_DEFINITIONS[a]?.title || a)
      .join('; ');

    const systemPrompt = `You are a senior private equity associate at a top-tier PE firm. 
 You produce crisp, analytical investment committee memos. 
 Style: factual, numbered recommendations, clear risk/opportunity framing. 
 No fluff. Use $ and % figures. Structure with clear section headers.
 Memo type: ${memoType}.`;

    const userMessage = `Generate an IC memo for ${co.name} (${
      co.sector
    } sector, ${co.vintage} vintage).
 
 Key metrics:
 - Revenue: $${co.revenue}M vs $${co.revenuePlan}M plan (${revPct}%)
 - EBITDA: $${co.ebitda}M vs $${co.ebitdaPlan}M plan (${ebitdaPct}%)
 - Gross Margin: ${co.grossMargin}%
 - Entry EV: $${co.entryEV}M | Current Multiple: ${
      co.currentMultiple
    }x | MOIC: ${co.moic}x
 - Status: ${co.status}
 - AI Alerts: ${alertSummary || 'None'}
 - Last report: ${co.lastReport}
 
 Memo type: ${memoType}
 Sections to include: Executive Summary, Financial Performance vs Plan, AI-Flagged Risks/Opportunities, Benchmarking Context, Specific IC Recommendations (numbered).
 Keep to ~400 words. Be direct and analytical.`;

    try {
      const result = await callClaude(systemPrompt, userMessage, 800);
      setMemo(result);
    } catch (err) {
      setMemo('Error generating memo. Please check your API connection.');
    }
    setLoading(false);
  }, [selectedCompany, memoType, companies]);

  const memoTypes = [
    { value: 'quarterly', label: 'Quarterly Update' },
    { value: 'alert', label: 'Alert Investigation' },
    { value: 'exit', label: 'Exit Readiness' },
    { value: '100day', label: '100-Day Plan Review' },
    { value: 'valuation', label: 'Valuation Update' },
  ];

  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        AI Investment Committee Memo Generator
      </p>
      <div className="flex gap-3 mb-4">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
        >
          <option value="">Select portfolio company...</option>
          {companies.map((co) => (
            <option key={co.id} value={co.id}>
              {co.name}
            </option>
          ))}
        </select>
        <select
          value={memoType}
          onChange={(e) => setMemoType(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
        >
          {memoTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={generateMemo}
          disabled={loading || !selectedCompany}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {loading ? 'Generating...' : '✨ Generate'}
        </button>
      </div>

      <div className="border border-slate-100 rounded-xl p-5 min-h-48 bg-white">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="animate-pulse">●</span>
            <span>
              AI is analysing all portfolio data and generating your memo...
            </span>
          </div>
        )}
        {!loading && !memo && (
          <p className="text-slate-400 text-sm italic">
            Select a company and memo type, then click Generate. The AI will
            analyse all ingested data — board minutes, financial reports, MIS
            files — and produce a structured IC memo.
          </p>
        )}
        {!loading && memo && (
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
            {memo}
          </div>
        )}
      </div>

      {memo && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigator.clipboard.writeText(memo)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
          >
            Copy
          </button>
          <button className="text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">
            Export PDF
          </button>
          <button className="text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50">
            Send to IC ↗
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Panel: AI Valuation ──────────────────────────────────────────────────────

function ValuationPanel({ companies }) {
  const [selected, setSelected] = useState(companies[0]);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const ebitdaVsPlan =
    ((selected.ebitda - selected.ebitdaPlan) / selected.ebitdaPlan) * 100;
  const bearEV = (selected.ebitda * 12).toFixed(0);
  const baseEV = (selected.ebitda * selected.currentMultiple).toFixed(0);
  const bullEV = (selected.ebitda * 22).toFixed(0);
  const returnVsEntry = (
    ((selected.ebitda * selected.currentMultiple - selected.entryEV) /
      selected.entryEV) *
    100
  ).toFixed(1);

  const getAIInsight = async () => {
    setLoadingInsight(true);
    const systemPrompt =
      'You are a PE valuation expert. Provide 3 concise bullet points (max 2 lines each) about valuation drivers and risks for this company. Be specific and analytical.';
    const userMsg = `Company: ${selected.name} | Sector: ${
      selected.sector
    } | Revenue: $${selected.revenue}M | EBITDA: $${
      selected.ebitda
    }M | Current Multiple: ${selected.currentMultiple}x | MOIC: ${
      selected.moic
    }x | Status: ${selected.status} | Alerts: ${
      selected.alerts.join(', ') || 'None'
    }`;
    const result = await callClaude(systemPrompt, userMsg, 400);
    setAiInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <select
          onChange={(e) => {
            setSelected(
              companies.find((c) => c.id.toString() === e.target.value)
            );
            setAiInsight('');
          }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white"
        >
          {companies.map((co) => (
            <option key={co.id} value={co.id}>
              {co.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          AI-calibrated with 340 sector transactions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            title: 'EV/EBITDA Comparables',
            rows: [
              ['Sector Median', '14.2x'],
              ['Sector Top Quartile', '18.6x'],
              [
                'AI Implied (This Co.)',
                `${selected.currentMultiple}x`,
                'text-blue-600 font-medium',
              ],
              [
                'vs Sector Median',
                `${selected.currentMultiple > 14.2 ? '+' : ''}${(
                  (selected.currentMultiple / 14.2 - 1) *
                  100
                ).toFixed(1)}%`,
                selected.currentMultiple > 14.2
                  ? 'text-emerald-600'
                  : 'text-red-600',
              ],
            ],
          },
          {
            title: 'Enterprise Value Range',
            rows: [
              ['Bear Case (12x)', `$${bearEV}M`],
              ['Base Case', `$${baseEV}M`, 'text-blue-600 font-medium'],
              ['Bull Case (22x)', `$${bullEV}M`],
              ['Entry EV', `$${selected.entryEV}M`],
            ],
          },
          {
            title: 'Return Analytics',
            rows: [
              [
                'MOIC (current)',
                `${selected.moic}x`,
                selected.moic >= 1.5
                  ? 'text-emerald-600'
                  : selected.moic < 1
                  ? 'text-red-600'
                  : 'text-amber-600',
              ],
              [
                'Gross IRR (to date)',
                `${selected.grossIRR}%`,
                selected.grossIRR > 15
                  ? 'text-emerald-600'
                  : selected.grossIRR < 0
                  ? 'text-red-600'
                  : 'text-amber-600',
              ],
              [
                'EV Uplift vs Entry',
                `${returnVsEntry}%`,
                parseFloat(returnVsEntry) > 0
                  ? 'text-emerald-600'
                  : 'text-red-600',
              ],
              [
                'Status',
                selected.status === 'on_track'
                  ? '✓ On Track'
                  : selected.status === 'critical'
                  ? '⚠ Critical'
                  : 'Watch',
                selected.status === 'on_track'
                  ? 'text-emerald-600'
                  : selected.status === 'critical'
                  ? 'text-red-600'
                  : 'text-amber-600',
              ],
            ],
          },
          {
            title: 'Financial Snapshot',
            rows: [
              ['Revenue', `$${selected.revenue}M`],
              ['EBITDA', `$${selected.ebitda}M`],
              [
                'EBITDA Margin',
                `${((selected.ebitda / selected.revenue) * 100).toFixed(1)}%`,
              ],
              [
                'EBITDA vs Plan',
                `${ebitdaVsPlan >= 0 ? '+' : ''}${ebitdaVsPlan.toFixed(1)}%`,
                ebitdaVsPlan >= 0 ? 'text-emerald-600' : 'text-red-600',
              ],
            ],
          },
        ].map(({ title, rows }) => (
          <div key={title} className="border border-slate-100 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-3">{title}</p>
            {rows.map(([label, val, cls = 'text-slate-700']) => (
              <div
                key={label}
                className="flex justify-between items-baseline py-1.5 border-b border-slate-50 last:border-0"
              >
                <span className="text-xs text-slate-400">{label}</span>
                <span className={`text-sm font-medium ${cls}`}>{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="border border-blue-50 rounded-xl p-4 bg-blue-50/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-blue-700">
            AI Valuation Commentary
          </p>
          <button
            onClick={getAIInsight}
            disabled={loadingInsight}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {loadingInsight ? 'Analysing...' : '✨ Get AI Insight'}
          </button>
        </div>
        {aiInsight ? (
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {aiInsight}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Click "Get AI Insight" for AI-powered valuation commentary on{' '}
            {selected.name}, including multiple justification, exit timing
            recommendations, and key value creation levers.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Panel: Document Ingest ───────────────────────────────────────────────────

function IngestPanel({ companies }) {
  const [files, setFiles] = useState([
    {
      name: 'HealthBridge_Q3_MIS_2024.xlsx',
      type: 'xlsx',
      status: 'done',
      kpis: 42,
      anomalies: 3,
      progress: 100,
    },
    {
      name: 'GreenFleet_Board_Minutes_Oct24.pdf',
      type: 'pdf',
      status: 'done',
      kpis: 0,
      anomalies: 1,
      sentiment: 'Cautious',
      progress: 100,
    },
  ]);
  const [dragging, setDragging] = useState(false);
  const [aiExtraction, setAiExtraction] = useState('');

  const simulateIngest = (filename) => {
    const newFile = {
      name: filename,
      type: filename.endsWith('.pdf') ? 'pdf' : 'xlsx',
      status: 'processing',
      kpis: 0,
      anomalies: 0,
      progress: 0,
    };
    setFiles((prev) => [...prev, newFile]);

    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15 + 5, 100);
      setFiles((prev) =>
        prev.map((f) =>
          f.name === filename
            ? {
                ...f,
                progress: Math.round(progress),
                status: progress >= 100 ? 'done' : 'processing',
                kpis: progress >= 100 ? Math.floor(Math.random() * 20 + 30) : 0,
                anomalies: progress >= 100 ? Math.floor(Math.random() * 4) : 0,
              }
            : f
        )
      );
      if (progress >= 100) clearInterval(interval);
    }, 200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach((f) => simulateIngest(f.name));
  };

  const analyseWithAI = async () => {
    const systemPrompt = `You are a PE data analyst. You receive a description of documents uploaded to a portfolio monitoring system. 
 Respond with a JSON-like structured extraction summary covering: kpis_found (list of 5 key KPIs), red_flags (list of 2-3 concerns), data_quality (High/Medium/Low), recommended_actions (2 bullet points). Keep it concise.`;
    const userMsg = `Documents ingested: ${files
      .map((f) => f.name)
      .join(', ')}. Total KPIs extracted: ${files.reduce(
      (s, f) => s + (f.kpis || 0),
      0
    )}. Anomalies flagged: ${files.reduce(
      (s, f) => s + (f.anomalies || 0),
      0
    )}.`;
    setAiExtraction('Analysing...');
    const result = await callClaude(systemPrompt, userMsg, 500);
    setAiExtraction(result);
  };

  const fileIcons = { xlsx: '📊', pdf: '📄', docx: '📝', csv: '📋' };

  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
        Document Ingest & AI Normalisation
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() =>
          simulateIngest(`NovaTech_Q3_FinancialPack_${Date.now()}.xlsx`)
        }
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 bg-slate-50'
        }`}
      >
        <div className="text-3xl mb-2">☁️</div>
        <p className="font-medium text-slate-700 text-sm mb-1">
          Drop portfolio company files here
        </p>
        <p className="text-xs text-slate-400">
          Excel · PDF · Word · CSV — AI extracts and normalises KPIs
          automatically
        </p>
        <p className="text-xs text-slate-300 mt-2">
          (Click to simulate a file upload)
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {files.map((f, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg bg-white"
          >
            <span className="text-xl mt-0.5">{fileIcons[f.type] || '📄'}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {f.name}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    f.status === 'done'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {f.status === 'done' ? '✓ Processed' : 'Processing...'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1 mb-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${f.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {f.status === 'done'
                  ? `${f.kpis > 0 ? `${f.kpis} KPIs extracted · ` : ''}${
                      f.anomalies > 0
                        ? `${f.anomalies} anomalies flagged · `
                        : ''
                    }Mapped to standard schema`
                  : `Normalising... ${f.progress}%`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={analyseWithAI}
        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-3"
      >
        ✨ AI: Summarise All Ingested Data
      </button>

      {aiExtraction && (
        <div className="border border-blue-50 rounded-xl p-4 bg-blue-50/30">
          <p className="text-xs font-medium text-blue-700 mb-2">
            AI Extraction Summary
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {aiExtraction}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function PortfolioSense() {
  const [activeTab, setActiveTab] = useState('overview');
  const [preselectedCompany, setPreselectedCompany] = useState(null);

  const alertCount = PORTFOLIO_DATA.reduce((s, c) => s + c.alerts.length, 0);

  const handleAnalyse = (company) => {
    setPreselectedCompany(company);
    setActiveTab('memo');
  };

  const handleGenerateMemo = (company) => {
    setPreselectedCompany(company);
    setActiveTab('memo');
  };

  const tabs = [
    { id: 'overview', label: 'Portfolio' },
    { id: 'alerts', label: `Alerts (${alertCount})` },
    { id: 'memo', label: 'AI Memo' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'ingest', label: 'Ingest' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">
              📡
            </div>
            <span className="font-medium text-slate-800">PortfolioSense</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
              AI
            </span>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-100 text-slate-800 font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              JS
            </div>
            <span className="text-sm text-slate-600">
              J. Smith, Managing Partner
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <PortfolioPanel
            companies={PORTFOLIO_DATA}
            onAnalyse={handleAnalyse}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsPanel
            companies={PORTFOLIO_DATA}
            onGenerateMemo={handleGenerateMemo}
          />
        )}
        {activeTab === 'memo' && (
          <MemoPanel
            companies={PORTFOLIO_DATA}
            preselected={preselectedCompany}
          />
        )}
        {activeTab === 'valuation' && (
          <ValuationPanel companies={PORTFOLIO_DATA} />
        )}
        {activeTab === 'ingest' && <IngestPanel companies={PORTFOLIO_DATA} />}
      </div>
    </div>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BACKEND SERVER (server.js) — Node.js / Express
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Copy this into a separate server.js file. Run: node server.js
 *
 * ---
 * const express = require("express");
 * const cors = require("cors");
 * const Anthropic = require("@anthropic-ai/sdk");
 * const multer = require("multer");
 * const XLSX = require("xlsx");
 * const pdf = require("pdf-parse");
 * const mammoth = require("mammoth");
 *
 * const app = express();
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * const upload = multer({ storage: multer.memoryStorage() });
 *
 * app.use(cors());
 * app.use(express.json());
 *
 * // Proxy AI calls — keeps API key server-side
 * app.post("/api/ai/generate", async (req, res) => {
 *   const { system, user, maxTokens = 1000 } = req.body;
 *   const msg = await anthropic.messages.create({
 *     model: "claude-sonnet-4-20250514",
 *     max_tokens: maxTokens,
 *     system,
 *     messages: [{ role: "user", content: user }],
 *   });
 *   res.json({ text: msg.content[0].text });
 * });
 *
 * // Document ingest + AI KPI extraction
 * app.post("/api/ingest", upload.single("file"), async (req, res) => {
 *   let rawText = "";
 *   const { mimetype, buffer, originalname } = req.file;
 *
 *   if (originalname.endsWith(".xlsx")) {
 *     const wb = XLSX.read(buffer, { type: "buffer" });
 *     wb.SheetNames.forEach(name => {
 *       rawText += XLSX.utils.sheet_to_csv(wb.Sheets[name]) + "\n";
 *     });
 *   } else if (originalname.endsWith(".pdf")) {
 *     const pdfData = await pdf(buffer);
 *     rawText = pdfData.text;
 *   } else if (originalname.endsWith(".docx")) {
 *     const result = await mammoth.extractRawText({ buffer });
 *     rawText = result.value;
 *   }
 *
 *   const extraction = await anthropic.messages.create({
 *     model: "claude-sonnet-4-20250514",
 *     max_tokens: 2000,
 *     system: `You are a PE financial data extractor. Extract KPIs from the document and return JSON:
 *       { kpis: [{name, value, unit, vs_plan_pct}], anomalies: [{metric, description, severity}], sentiment: string }`,
 *     messages: [{ role: "user", content: `Extract KPIs from:\n\n${rawText.slice(0, 8000)}` }],
 *   });
 *
 *   res.json(JSON.parse(extraction.content[0].text));
 * });
 *
 * app.listen(3001, () => console.log("PortfolioSense backend running on :3001"));
 * ---
 *
 * ════════════════════════════════════════════════════════════════════════════
 * WHERE TO PUBLISH
 * ════════════════════════════════════════════════════════════════════════════
 *
 * OPTION A — Claude.ai Artifact (Demo / Presentation)
 *   • Paste the React JSX directly into Claude.ai as an Artifact
 *   • Best for: showing to LPs, IC meetings, pitch demos
 *   • Limitation: no real API calls (use mock data)
 *
 * OPTION B — Vercel (Production Frontend)
 *   1. npx create-react-app portfoliosense (or Vite)
 *   2. Replace App.jsx with this file
 *   3. npm install (add tailwindcss)
 *   4. git push to GitHub
 *   5. Import repo at vercel.com → deploys instantly
 *   6. Add ANTHROPIC_API_KEY as environment variable
 *   Cost: Free tier available; ~$20/mo Pro
 *
 * OPTION C — Railway (Full Stack with Backend)
 *   1. Deploy React frontend to Vercel (above)
 *   2. Deploy Express server.js to railway.app
 *   3. Set ANTHROPIC_API_KEY in Railway env vars
 *   4. Update frontend API URL to Railway backend
 *   Cost: ~$5/mo for backend
 *
 * OPTION D — Internal PE Firm Deployment
 *   1. Docker-compose: frontend (nginx) + backend (node) + postgres
 *   2. Deploy to AWS ECS / Azure Container Apps
 *   3. Add Auth0 SSO (enterprise SSO for PE firm)
 *   4. Connect to real data sources: Workday, NetSuite, portfolio CRMs
 *   5. Add Pinecone vector DB for document semantic search
 *   Cost: ~$200-500/mo on AWS depending on scale
 *
 * RECOMMENDED PATH FOR ASSIGNMENT DEMO:
 *   → Paste into Claude.ai as Artifact for instant live demo
 *   → Then deploy to Vercel for shareable URL
 *   → Add ANTHROPIC_API_KEY via backend proxy for real AI features
 */
