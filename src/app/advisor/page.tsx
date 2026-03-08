'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, BarChart3, FileText, Plus, Search, Bell,
  ChevronRight, TrendingUp, Calendar, Mail, Phone,
  Shield, Award, Clock, ArrowLeft, Download, Trash2, X, Upload
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';

// ---- Types ----
interface ClientSnapshot {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    state: string;
    filingStatus: string;
  };
  incomeSources: { annualAmount: number }[];
  assets: { currentValue: number; category: string }[];
  liabilities: { currentBalance: number }[];
  goals: { name: string }[];
  financialHealthScore: { overall: number } | null;
  retirementPlan: { fundedRatio: number } | null;
  cashFlowSummary: { monthlySurplus: number } | null;
  netWorthSummary: { netWorth: number } | null;
}

interface AdvisorClient {
  id: string;
  snapshot: ClientSnapshot;
  planStatus: 'complete' | 'in_progress' | 'needs_review';
  nextAction: string;
  lastUpdated: string;
  notes: string;
}

const ADVISOR_STORAGE_KEY = 'wealthmap-advisor-clients';

// ---- Helpers ----
function loadClients(): AdvisorClient[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADVISOR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveClients(clients: AdvisorClient[]) {
  localStorage.setItem(ADVISOR_STORAGE_KEY, JSON.stringify(clients));
}

function getClientName(c: AdvisorClient): string {
  const p = c.snapshot.personalInfo;
  return `${p.firstName} ${p.lastName}`.trim() || 'Unnamed Client';
}

function getClientAUM(c: AdvisorClient): number {
  return c.snapshot.assets.reduce((s, a) => s + (a.currentValue || 0), 0);
}

function getClientScore(c: AdvisorClient): number {
  return c.snapshot.financialHealthScore?.overall ?? 0;
}

function getInitials(c: AdvisorClient): string {
  const p = c.snapshot.personalInfo;
  return `${(p.firstName?.[0] || '')}${(p.lastName?.[0] || '')}`.toUpperCase() || '?';
}

// Import current user's data from the main WealthMap store
function importFromCurrentUser(): ClientSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('wealthmap-financial-store');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const state = parsed.state;
    if (!state || !state.personalInfo?.firstName) return null;
    return {
      personalInfo: {
        firstName: state.personalInfo.firstName,
        lastName: state.personalInfo.lastName,
        email: state.personalInfo.email,
        phone: state.personalInfo.phone,
        dateOfBirth: state.personalInfo.dateOfBirth,
        state: state.personalInfo.state,
        filingStatus: state.personalInfo.filingStatus,
      },
      incomeSources: state.incomeSources || [],
      assets: state.assets || [],
      liabilities: state.liabilities || [],
      goals: state.goals || [],
      financialHealthScore: state.financialHealthScore || null,
      retirementPlan: state.retirementPlan || null,
      cashFlowSummary: state.cashFlowSummary || null,
      netWorthSummary: state.netWorthSummary || null,
    };
  } catch { return null; }
}

// ---- Sub-components ----
function StatusBadge({ status }: { status: AdvisorClient['planStatus'] }) {
  const config = {
    complete: { label: 'Complete', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    needs_review: { label: 'Needs Review', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{score}</span>;
}

// ---- Add Client Modal ----
function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (client: AdvisorClient) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!firstName.trim()) return;
    const client: AdvisorClient = {
      id: generateId(),
      snapshot: {
        personalInfo: { firstName: firstName.trim(), lastName: lastName.trim(), email, phone, dateOfBirth: '', state, filingStatus: 'single' },
        incomeSources: [],
        assets: [],
        liabilities: [],
        goals: [],
        financialHealthScore: null,
        retirementPlan: null,
        cashFlowSummary: null,
        netWorthSummary: null,
      },
      planStatus: 'in_progress',
      nextAction: 'Complete initial financial questionnaire',
      lastUpdated: new Date().toISOString(),
      notes,
    };
    onAdd(client);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">New Client</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">First Name *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">State</label>
              <input value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 text-sm hover:text-white">Cancel</button>
          <button onClick={handleSubmit} disabled={!firstName.trim()} className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40">
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main ----
export default function AdvisorPortal() {
  const router = useRouter();
  const [clients, setClients] = useState<AdvisorClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<AdvisorClient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setClients(loadClients());
    setMounted(true);
  }, []);

  const persistClients = useCallback((updated: AdvisorClient[]) => {
    setClients(updated);
    saveClients(updated);
  }, []);

  const handleAddClient = useCallback((client: AdvisorClient) => {
    const updated = [...clients, client];
    persistClients(updated);
    setShowAddModal(false);
  }, [clients, persistClients]);

  const handleDeleteClient = useCallback((id: string) => {
    const updated = clients.filter(c => c.id !== id);
    persistClients(updated);
    if (selectedClient?.id === id) setSelectedClient(null);
  }, [clients, selectedClient, persistClients]);

  const handleImportCurrent = useCallback(() => {
    const snapshot = importFromCurrentUser();
    if (!snapshot) return;
    // Check if this client already exists (by name)
    const name = `${snapshot.personalInfo.firstName} ${snapshot.personalInfo.lastName}`.trim();
    const existing = clients.find(c => getClientName(c) === name);
    if (existing) {
      // Update existing client's snapshot
      const updated = clients.map(c => c.id === existing.id ? { ...c, snapshot, lastUpdated: new Date().toISOString(), planStatus: 'complete' as const } : c);
      persistClients(updated);
    } else {
      // Create new client
      const client: AdvisorClient = {
        id: generateId(),
        snapshot,
        planStatus: 'complete',
        nextAction: 'Review generated financial plan',
        lastUpdated: new Date().toISOString(),
        notes: '',
      };
      persistClients([...clients, client]);
    }
  }, [clients, persistClients]);

  const handleUpdateStatus = useCallback((id: string, status: AdvisorClient['planStatus']) => {
    const updated = clients.map(c => c.id === id ? { ...c, planStatus: status, lastUpdated: new Date().toISOString() } : c);
    persistClients(updated);
    if (selectedClient?.id === id) {
      setSelectedClient(updated.find(c => c.id === id) || null);
    }
  }, [clients, selectedClient, persistClients]);

  const handleUpdateNotes = useCallback((id: string, notes: string) => {
    const updated = clients.map(c => c.id === id ? { ...c, notes } : c);
    persistClients(updated);
  }, [clients, persistClients]);

  const handleUpdateNextAction = useCallback((id: string, nextAction: string) => {
    const updated = clients.map(c => c.id === id ? { ...c, nextAction } : c);
    persistClients(updated);
  }, [clients, persistClients]);

  const totalAUM = clients.reduce((sum, c) => sum + getClientAUM(c), 0);
  const avgScore = clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + getClientScore(c), 0) / clients.length) : 0;
  const needsReview = clients.filter(c => c.planStatus === 'needs_review').length;

  const filteredClients = clients.filter(c => {
    const name = getClientName(c).toLowerCase();
    const email = c.snapshot.personalInfo.email?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 theme-dark">
      {/* Top Bar */}
      <div className="glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">WealthMap</span>
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Advisor
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
              {needsReview > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white">Advisor Demo</div>
                <div className="text-xs text-slate-500">CFP, CFA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Advisor Dashboard</h1>
          <p className="text-slate-400">Manage clients, review plans, and track portfolio health.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Clients', value: clients.length.toString(), icon: Users, color: 'text-blue-400' },
            { label: 'Assets Under Mgmt', value: totalAUM >= 1000000 ? `$${(totalAUM / 1000000).toFixed(1)}M` : formatCurrency(totalAUM), icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Avg Health Score', value: avgScore.toString(), icon: Award, color: 'text-amber-400' },
            { label: 'Needs Review', value: needsReview.toString(), icon: Clock, color: 'text-red-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{kpi.label}</span>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Client List */}
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Client Roster</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleImportCurrent}
                className="px-3 py-2 bg-slate-800 text-emerald-400 text-sm rounded-lg flex items-center gap-2 hover:bg-slate-700 border border-slate-700"
                title="Import current user's data as a client"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Client</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">AUM</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Next Action</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-slate-700 flex items-center justify-center text-sm font-semibold text-blue-300">
                          {getInitials(client)}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{getClientName(client)}</div>
                          <div className="text-xs text-slate-500 md:hidden">{client.snapshot.personalInfo.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-sm text-slate-300">{client.snapshot.personalInfo.email || '—'}</div>
                      <div className="text-xs text-slate-500">{client.snapshot.personalInfo.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={client.planStatus} />
                    </td>
                    <td className="px-5 py-4 text-right hidden sm:table-cell">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(getClientAUM(client))}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center hidden lg:table-cell">
                      <ScoreBadge score={getClientScore(client)} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-400">{client.nextAction}</span>
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="p-12 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {clients.length === 0
                  ? 'No clients yet. Add a new client or import current user data.'
                  : 'No clients matching your search.'}
              </p>
            </div>
          )}
        </div>

        {/* Selected Client Detail */}
        {selectedClient && (
          <div className="mt-6 rounded-xl bg-slate-900/50 border border-slate-800 p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">{getClientName(selectedClient)}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteClient(selectedClient.id)}
                  className="px-3 py-2 bg-slate-800 text-red-400 text-sm rounded-lg flex items-center gap-2 hover:bg-red-500/10 border border-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-blue-600"
                >
                  <FileText className="w-4 h-4" />
                  View Full Plan
                </button>
              </div>
            </div>

            {/* Financial summary cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">Net Worth</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(selectedClient.snapshot.netWorthSummary?.netWorth)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">Financial Health Score</div>
                <div className="text-xl font-bold">
                  <ScoreBadge score={getClientScore(selectedClient)} />
                  <span className="text-slate-500 text-sm font-normal"> / 100</span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">Monthly Surplus</div>
                <div className="text-xl font-semibold text-white">
                  {formatCurrency(selectedClient.snapshot.cashFlowSummary?.monthlySurplus)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">Retirement Funded</div>
                <div className="text-xl font-semibold text-white">
                  {Math.round((selectedClient.snapshot.retirementPlan?.fundedRatio ?? 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-2">Plan Status</div>
                <div className="flex gap-2">
                  {(['in_progress', 'needs_review', 'complete'] as const).map(s => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(selectedClient.id, s); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedClient.planStatus === s
                          ? s === 'complete' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : s === 'needs_review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {s === 'in_progress' ? 'In Progress' : s === 'needs_review' ? 'Needs Review' : 'Complete'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-2">Last Updated</div>
                <div className="text-sm text-white">{formatDate(selectedClient.lastUpdated)}</div>
              </div>
            </div>

            {/* Next Action */}
            <div className="mt-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                <Clock className="w-4 h-4" />
                Next Action
              </div>
              <input
                value={selectedClient.nextAction}
                onChange={e => {
                  handleUpdateNextAction(selectedClient.id, e.target.value);
                  setSelectedClient({ ...selectedClient, nextAction: e.target.value });
                }}
                className="w-full bg-transparent text-sm text-slate-300 outline-none"
                placeholder="Describe next action..."
              />
            </div>

            {/* Notes */}
            <div className="mt-4 p-4 rounded-lg bg-slate-800/50">
              <div className="text-xs text-slate-400 mb-2">Advisor Notes</div>
              <textarea
                value={selectedClient.notes}
                onChange={e => {
                  handleUpdateNotes(selectedClient.id, e.target.value);
                  setSelectedClient({ ...selectedClient, notes: e.target.value });
                }}
                rows={3}
                className="w-full bg-transparent text-sm text-slate-300 outline-none resize-none"
                placeholder="Add notes about this client..."
              />
            </div>
          </div>
        )}

        {/* Compliance Note */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/30 border border-slate-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-300 mb-1">FINRA Compliance</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All recommendations generated by WealthMap follow FINRA suitability standards and Regulation Best Interest (Reg BI) guidelines.
                Advisor must review all generated recommendations before presenting to clients. Maintain records per SEC Rule 17a-4.
                All client interactions and plan modifications are logged for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onAdd={handleAddClient} />}
    </div>
  );
}
