import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  Database,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  Brain,
  BarChart3,
  Clock,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import {
  AnalystQueryResponse,
  SuggestedQuestion,
  ChartData,
  TableData,
} from '../types';
import { PALETTE, useChartStyles, CustomChartTooltip } from '../components/charts/ChartTheme';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  queryText: string;
  response?: AnalystQueryResponse;
  error?: string;
}

export const AIAnalystView: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingStep, setThinkingStep] = useState<string>('Analyzing query intent...');
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chartStyles = useChartStyles();

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Load initial suggestions and welcome message
  useEffect(() => {
    const initData = async () => {
      try {
        const suggestions = await api.getAnalystSuggestions();
        setSuggestedQuestions(suggestions);
      } catch (err) {
        console.warn('Failed to fetch suggestions from backend, using canonical set', err);
        setSuggestedQuestions([
          {
            category: 'Attrition Deep-Dive',
            question: 'Why did churn increase this quarter?',
            description: 'Investigates month-to-month contracts, onboarding drop-off, and support friction.',
          },
          {
            category: 'Segmentation',
            question: 'Which customer segment has the highest churn?',
            description: 'Compares quantitative RFM clusters and identifies high-attrition groups.',
          },
          {
            category: 'Revenue Protection',
            question: 'How much revenue is currently at risk?',
            description: 'Quantifies ARR/MRR exposed to cancellation and breaks down by root driver.',
          },
          {
            category: 'Product Strategy',
            question: 'Which plans have the highest retention?',
            description: 'Ranks subscription tiers by retention rate, ARPU, and account longevity.',
          },
          {
            category: 'Account Watchlist',
            question: 'Show me high-value customers at risk.',
            description: 'Ranks active Enterprise accounts by ARR at risk with ML risk factors and playbooks.',
          },
        ]);
      }

      // Initial Assistant greeting
      setMessages([
        {
          id: 'welcome-0',
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          queryText: '',
          response: {
            query: 'System Welcome',
            intent: 'EXECUTIVE_KPIS',
            answer:
              'Welcome to the **Customer360 AI Analyst**. I provide authoritative, verified answers grounded strictly in our curated analytical marts and production machine learning models.\n\nI **never invent statistics** and operate via strict analytical tools to protect data integrity. How can I help you investigate customer behavior, churn, or revenue risk today?',
            supporting_metrics: [
              { name: 'Grounding Architecture', value: 'Curated Marts (dbt)', benchmark: 'Zero Hallucination' },
              { name: 'Predictive Engine', value: 'XGBoost + SHAP', benchmark: 'ROC-AUC: 0.999' },
              { name: 'Safety Guardrail', value: 'Approved Tools Only', benchmark: 'Arbitrary SQL Blocked' },
            ],
            relevant_segment_or_filter: 'Total Active Subscriber Portfolio',
            data_timestamp: new Date().toISOString(),
            sources: ['main_marts.mart_customer_360', 'main_marts.mart_customer_segments', 'ml/artifacts/customer_churn_predictions.parquet'],
            is_model_interpretation: false,
            suggested_followups: [
              'Why did churn increase this quarter?',
              'Which customer segment has the highest churn?',
              'How much revenue is currently at risk?',
              'Which plans have the highest retention?',
              'Show me high-value customers at risk.',
            ],
          },
        },
      ]);
    };

    initData();
  }, []);

  // Send question handler
  const handleSendQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isThinking) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: MessageItem = {
      id: userMessageId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      queryText: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsThinking(true);
    setThinkingStep('Detecting analytical intent...');

    // Simulate progressive analytical pipeline states
    const timer1 = setTimeout(() => setThinkingStep('Querying verified DuckDB marts...'), 350);
    const timer2 = setTimeout(() => setThinkingStep('Synthesizing grounded explanation & metrics...'), 700);

    try {
      const response = await api.askAnalyst(trimmed);
      clearTimeout(timer1);
      clearTimeout(timer2);

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        queryText: trimmed,
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const errorMessage: MessageItem = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        queryText: trimmed,
        error: err.message || 'Failed to process inquiry with analytical layer.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearHistory = () => {
    setMessages((prev) => prev.slice(0, 1));
  };

  // Helper to format text with markdown bolding
  const renderFormattedText = (text: string) => {
    const parts = text.split('\n\n');
    return (
      <div className="space-y-3">
        {parts.map((p, idx) => (
          <p
            key={idx}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: p
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-slate-700 dark:text-slate-300">$1</em>')
                .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[11px]">$1</code>'),
            }}
          />
        ))}
      </div>
    );
  };

  // Render chart component dynamically based on ChartData
  const renderChart = (chart: ChartData) => {
    if (!chart.data || chart.data.length === 0) return null;

    return (
      <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e2d4d]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              {chart.title}
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            {chart.chart_type} visual
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chart.chart_type === 'line' ? (
              <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                <XAxis dataKey="label" stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} />
                <YAxis stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : chart.chart_type === 'donut' ? (
              <PieChart>
                <Tooltip content={<CustomChartTooltip />} />
                <Pie
                  data={chart.data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {chart.data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart
                data={chart.data}
                layout={chart.chart_type === 'bar' ? 'vertical' : 'horizontal'}
                margin={{ top: 10, right: 20, left: chart.chart_type === 'bar' ? 40 : 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} />
                {chart.chart_type === 'bar' ? (
                  <>
                    <XAxis type="number" stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} />
                    <YAxis dataKey="label" type="category" stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} width={90} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="label" stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} />
                    <YAxis stroke={chartStyles.axisTextColor} tick={{ fill: chartStyles.axisTextColor, fontSize: 10 }} />
                  </>
                )}
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chart.data.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={
                        entry.category === 'Critical' || entry.label.toLowerCase().includes('monthly')
                          ? '#ef4444'
                          : entry.category === 'High'
                          ? '#f59e0b'
                          : PALETTE[index % PALETTE.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render structured table
  const renderTable = (table: TableData) => {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-[#1e2d4d]">
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#11192e] border-b border-slate-200 dark:border-[#1e2d4d] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {table.title}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {table.rows.length} rows returned
          </span>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-slate-50 dark:bg-[#0c1220] text-slate-500 uppercase font-mono text-[9px] sticky top-0">
              <tr>
                {table.columns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-b border-slate-200 dark:border-[#1e2d4d]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1e2d4d]">
              {table.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-[#141f38] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2d4d]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                AI Customer Intelligence Analyst
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  Verified Analytics
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ask natural-language questions grounded strictly in validated Customer360 marts and trained ML models. Zero hallucinations guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Status Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              SQL Injection Guard Active
            </span>
          </div>
          <button
            onClick={clearHistory}
            title="Clear Chat History"
            className="p-2 rounded-lg bg-slate-100 dark:bg-[#0e1526] hover:bg-slate-200 dark:hover:bg-[#17233d] border border-slate-200 dark:border-[#1e2d4d] text-slate-500 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Inquiries Carousel / Grid */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Suggested Executive Inquiries
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Click to execute verified analysis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(q.question)}
              disabled={isThinking}
              className="text-left p-3 rounded-lg bg-white dark:bg-[#121b2f] hover:bg-blue-50 dark:hover:bg-[#172542] border border-slate-200 dark:border-[#1e2d4d] hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium mb-1">
                <span>{q.category}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-1">
                "{q.question}"
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {q.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Stream Window */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* User Query Message */}
            {msg.sender === 'user' ? (
              <div className="max-w-2xl rounded-2xl rounded-tr-sm p-4 bg-blue-600 text-white shadow-sm space-y-1">
                <div className="flex items-center justify-between gap-4 text-[10px] text-blue-200">
                  <span className="font-semibold uppercase tracking-wider">You (Executive)</span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">{msg.queryText}</p>
              </div>
            ) : (
              /* Assistant Response Message */
              <div className="w-full max-w-4xl rounded-2xl rounded-tl-sm p-5 bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-4 text-xs">
                {/* Assistant Message Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1e2d4d]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Customer360 AI Analyst
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Provenance & Filter Pills */}
                  {msg.response && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Model Interpretation vs Hard Fact Badge */}
                      {msg.response.is_model_interpretation ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <Brain className="w-3 h-3" /> Machine Learning Model Interpretation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Database className="w-3 h-3" /> Verified Financial Mart (Ground Truth)
                        </span>
                      )}

                      {/* Relevant Filter Tag */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-[#17223b] text-slate-600 dark:text-slate-300 font-mono">
                        <Filter className="w-2.5 h-2.5 text-slate-400" />
                        {msg.response.relevant_segment_or_filter}
                      </span>
                    </div>
                  )}
                </div>

                {/* Narrative Answer Content */}
                {msg.response && (
                  <div className="text-slate-800 dark:text-slate-200 text-xs">
                    {renderFormattedText(msg.response.answer)}
                  </div>
                )}

                {/* Error Display if Any */}
                {msg.error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{msg.error}</span>
                  </div>
                )}

                {/* Supporting Metrics Cards Grid */}
                {msg.response && msg.response.supporting_metrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                    {msg.response.supporting_metrics.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-[#121b2f] border border-slate-200 dark:border-[#1e2d4d]"
                      >
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                          {m.name}
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
                          {m.value}
                        </span>
                        {m.benchmark && (
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-mono block mt-0.5 truncate">
                            {m.benchmark}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Chart Visualization (if present) */}
                {msg.response && msg.response.chart && renderChart(msg.response.chart)}

                {/* Embedded Table Matrix (if present) */}
                {msg.response && msg.response.table && renderTable(msg.response.table)}

                {/* Sources & Methodology References Footer */}
                {msg.response && (
                  <div className="pt-3 border-t border-slate-200 dark:border-[#1e2d4d] space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold uppercase tracking-wider text-[9px]">Verified Sources:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {msg.response.sources.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">
                          Timestamp: {new Date(msg.response.data_timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Statistical Limitations Note */}
                    {msg.response.limitations && (
                      <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-amber-700 dark:text-amber-300/90 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                        <p className="leading-normal">{msg.response.limitations}</p>
                      </div>
                    )}

                    {/* Follow-up Prompts */}
                    {msg.response.suggested_followups && msg.response.suggested_followups.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Follow-up Inquiries:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.response.suggested_followups.map((f, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSendQuery(f)}
                              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#121c33] hover:bg-blue-50 dark:hover:bg-[#1a294d] border border-slate-200 dark:border-[#1e2d4d] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[11px] font-medium"
                            >
                              "{f}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy Response Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => copyToClipboard(msg.response!.answer, msg.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading / Thinking State */}
        {isThinking && (
          <div className="w-full max-w-xl rounded-2xl rounded-tl-sm p-4 bg-white dark:bg-[#0e1526] border border-slate-200 dark:border-[#1e2d4d] shadow-sm space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>{thinkingStep}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#121b2f] h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Verifying metrics against DuckDB analytical marts...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Bar */}
      <div className="sticky bottom-4 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-[#0e1526] border border-slate-300 dark:border-[#1e2d4d] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
        >
          <input
            type="text"
            placeholder="Ask a question about churn drivers, segment retention, at-risk ARR, or high-value accounts..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isThinking}
            className="w-full px-5 py-4 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50 pr-28"
          />
          <button
            type="submit"
            disabled={isThinking || !inputQuery.trim()}
            className="absolute right-2.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Customer360 AI Analyst executes strict parameterized queries on curated dbt marts. Arbitrary SQL execution is strictly disabled.
        </p>
      </div>
    </div>
  );
};
