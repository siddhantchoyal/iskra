import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  Link as LinkIcon, 
  Filter, 
  Layers,
  Volume2
} from 'lucide-react';
import { DayRecord, LeadQuality, ProofItem } from '../types';
import { renderWithClickableLinks } from '../utils/linkify';

interface ReportsTrackerPageProps {
  records: DayRecord[];
  onSelectDateToEdit: (date: string) => void;
  onDeleteRecord: (date: string) => void;
  onNewDay: () => void;
  isDark: boolean;
}

type DatePreset = 'all' | '7d' | '14d' | '30d' | 'month' | 'custom';

export const ReportsTrackerPage: React.FC<ReportsTrackerPageProps> = ({
  records,
  onSelectDateToEdit,
  onDeleteRecord,
  onNewDay,
  isDark,
}) => {
  const [search, setSearch] = useState<string>('');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Date Range Filtering
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate start/end date based on preset
  const today = new Date();
  const getDaysAgoISO = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Filtered records by date range
  const dateRangeFilteredRecords = useMemo(() => {
    const todayISO = today.toISOString().split('T')[0];

    return records.filter((r) => {
      if (datePreset === '7d') {
        return r.date >= getDaysAgoISO(6) && r.date <= todayISO;
      }
      if (datePreset === '14d') {
        return r.date >= getDaysAgoISO(13) && r.date <= todayISO;
      }
      if (datePreset === '30d') {
        return r.date >= getDaysAgoISO(29) && r.date <= todayISO;
      }
      if (datePreset === 'month') {
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        return r.date >= firstOfMonth && r.date <= todayISO;
      }
      if (datePreset === 'custom') {
        if (customStartDate && r.date < customStartDate) return false;
        if (customEndDate && r.date > customEndDate) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [records, datePreset, customStartDate, customEndDate]);

  // Aggregates for the chosen date range period
  const totalDays = dateRangeFilteredRecords.length;
  const periodReceived = dateRangeFilteredRecords.reduce((acc, curr) => acc + (curr.leadsReceived || 0), 0);
  const periodQualified = dateRangeFilteredRecords.reduce((acc, curr) => acc + (curr.qualifiedLeads || 0), 0);
  const periodOnboarded = dateRangeFilteredRecords.reduce((acc, curr) => acc + (curr.onboardedLeads || 0), 0);

  // Conversion rates for the selected period
  const setterPeriodCvr = periodReceived > 0 ? ((periodQualified / periodReceived) * 100).toFixed(1) : '0.0';
  const callerPeriodCvr = periodQualified > 0 ? ((periodOnboarded / periodQualified) * 100).toFixed(1) : '0.0';
  const overallPeriodCvr = periodReceived > 0 ? ((periodOnboarded / periodReceived) * 100).toFixed(1) : '0.0';

  // Daily averages for the selected period
  const avgReceivedPerDay = totalDays > 0 ? (periodReceived / totalDays).toFixed(1) : '0.0';
  const avgQualifiedPerDay = totalDays > 0 ? (periodQualified / totalDays).toFixed(1) : '0.0';
  const avgOnboardedPerDay = totalDays > 0 ? (periodOnboarded / totalDays).toFixed(1) : '0.0';

  // Secondary text search & quality filter
  const displayedRecords = useMemo(() => {
    return dateRangeFilteredRecords.filter((r) => {
      if (qualityFilter !== 'all' && r.quality !== qualityFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const hasProofMatch = (proofs?: ProofItem[]) => 
        proofs?.some((p) => 
          p.title?.toLowerCase().includes(q) || 
          p.content?.toLowerCase().includes(q) || 
          p.notes?.toLowerCase().includes(q)
        );

      return (
        r.date.includes(q) ||
        r.receivedNotes?.toLowerCase().includes(q) ||
        r.qualifiedNotes?.toLowerCase().includes(q) ||
        r.onboardedNotes?.toLowerCase().includes(q) ||
        hasProofMatch(r.qualifiedProofs) ||
        hasProofMatch(r.onboardedProofs)
      );
    });
  }, [dateRangeFilteredRecords, qualityFilter, search]);

  // Styling helpers
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDark 
    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-750' 
    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const tableHeaderBg = isDark ? 'bg-slate-800/80 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';
  const expandedBg = isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200';

  const getQualityBadge = (q: LeadQuality) => {
    switch (q) {
      case 'Excellent':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>Excellent</span>;
      case 'Good':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isDark ? 'bg-blue-950/60 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>Good</span>;
      case 'Fair':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>Fair</span>;
      case 'Poor':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${isDark ? 'bg-red-950/60 text-red-400 border-red-800' : 'bg-red-100 text-red-800 border-red-200'}`}>Poor</span>;
      default:
        return null;
    }
  };

  // Export to CSV of the currently filtered view
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Leads Received',
      'Lead Quality',
      'Received Notes',
      'Qualified Leads',
      'Setter CVR %',
      'Qualified Proofs Count',
      'Qualified Notes',
      'Onboarded Leads',
      'Caller CVR %',
      'Overall CVR %',
      'Onboarded Proofs Count',
      'Onboarded Notes'
    ];

    const rows = displayedRecords.map((r) => {
      const sCvr = r.leadsReceived > 0 ? ((r.qualifiedLeads / r.leadsReceived) * 100).toFixed(1) + '%' : '0%';
      const cCvr = r.qualifiedLeads > 0 ? ((r.onboardedLeads / r.qualifiedLeads) * 100).toFixed(1) + '%' : '0%';
      const oCvr = r.leadsReceived > 0 ? ((r.onboardedLeads / r.leadsReceived) * 100).toFixed(1) + '%' : '0%';

      return [
        `"${r.date}"`,
        r.leadsReceived,
        `"${r.quality}"`,
        `"${(r.receivedNotes || '').replace(/"/g, '""')}"`,
        r.qualifiedLeads,
        `"${sCvr}"`,
        (r.qualifiedProofs || []).length,
        `"${(r.qualifiedNotes || '').replace(/"/g, '""')}"`,
        r.onboardedLeads,
        `"${cCvr}"`,
        `"${oCvr}"`,
        (r.onboardedProofs || []).length,
        `"${(r.onboardedNotes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `leads_tracker_period_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Helper to render proof items inside expanded row
  const renderProofsInRow = (proofs: ProofItem[] | undefined, stageColor: 'blue' | 'indigo' | 'emerald') => {
    if (!proofs || proofs.length === 0) {
      return <span className={`text-[11px] italic ${textMuted}`}>No proofs attached</span>;
    }

    return (
      <div className="space-y-2 mt-2">
        {proofs.map((item) => (
          <div 
            key={item.id} 
            className={`p-2.5 rounded-lg border text-xs space-y-1 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.type === 'link' && <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                {item.type === 'photo' && <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {item.type === 'audio' && <Volume2 className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                {item.type === 'note' && <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="font-bold truncate">{item.title || item.type}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {item.type}
              </span>
            </div>

            {/* Link item */}
            {item.type === 'link' && (
              <a
                href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-semibold flex items-center gap-1 break-all"
              >
                <span>{item.content}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}

            {/* Photo item */}
            {item.type === 'photo' && (
              <div className="pt-1">
                <a href={item.content} target="_blank" rel="noopener noreferrer" className="block max-w-fit">
                  <img
                    src={item.content}
                    alt={item.title || 'Screenshot'}
                    className="max-h-28 rounded-lg border border-slate-700 object-contain hover:opacity-90 transition"
                  />
                </a>
              </div>
            )}

            {/* Audio item */}
            {item.type === 'audio' && (
              <div className="pt-1">
                <audio controls src={item.content} className="w-full h-8" />
              </div>
            )}

            {/* Note item */}
            {item.type === 'note' && (
              <div className="leading-relaxed">
                {renderWithClickableLinks(item.content)}
              </div>
            )}

            {/* Attached note if exists */}
            {item.type !== 'note' && item.notes && (
              <p className={`text-[11px] pt-1 border-t ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                {renderWithClickableLinks(item.notes)}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. DATE RANGE FILTER CONTROLLER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4 ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-slate-800/60">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm sm:text-base">Filter Reports by Date Range</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onNewDay}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Enter Day</span>
            </button>
          </div>
        </div>

        {/* Preset Range Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '14d', label: 'Last 14 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as { id: DatePreset; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setDatePreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                datePreset === p.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Pickers (shown when 'custom' is selected) */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={textMuted}>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`px-3 py-1.5 rounded-lg font-medium ${inputBg}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={textMuted}>To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`px-3 py-1.5 rounded-lg font-medium ${inputBg}`}
              />
            </div>
          </div>
        )}

        {/* 2. TOP AGGREGATE & AVERAGE SUMMARY OF CHOSEN PERIOD */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Period Aggregate &amp; Conversion Rates ({totalDays} Days Selected)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Stage 1: Received */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-blue-950/20 border-blue-800/60' : 'bg-blue-50/70 border-blue-200'
            }`}>
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wide block mb-1">
                1. Leads Received (Period)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black">{periodReceived}</span>
                <span className={`text-xs font-semibold ${textMuted}`}>
                  {avgReceivedPerDay} avg / day
                </span>
              </div>
            </div>

            {/* Stage 2: Qualified + Setter CVR */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-indigo-950/20 border-indigo-800/60' : 'bg-indigo-50/70 border-indigo-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">
                  2. Qualified Leads (Setter)
                </span>
                <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-bold rounded-full border border-indigo-500/30">
                  {setterPeriodCvr}% CVR
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-indigo-400">{periodQualified}</span>
                <span className={`text-xs font-semibold ${textMuted}`}>
                  {avgQualifiedPerDay} avg / day
                </span>
              </div>
            </div>

            {/* Stage 3: Onboarded + Caller CVR */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                  3. Onboarded Leads (Caller)
                </span>
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/30">
                  {callerPeriodCvr}% CVR
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400">{periodOnboarded}</span>
                <span className="text-xs font-bold text-emerald-400">
                  {overallPeriodCvr}% overall funnel CVR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & QUALITY FILTER BAR */}
      <div className={`p-4 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm">Dates in this Range</h3>
          <span className={`text-xs ${textMuted}`}>({displayedRecords.length} records)</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, proofs, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg ${inputBg}`}
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg font-medium ${inputBg}`}
          >
            <option value="all">All Qualities</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      {/* 4. PERFORMANCE TABLE FOR THE SELECTED DATE RANGE */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-bold uppercase tracking-wider text-[11px] border-b ${tableHeaderBg}`}>
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">1. Received</th>
                <th className="py-3 px-3">Quality</th>
                <th className="py-3 px-3">2. Qualified</th>
                <th className="py-3 px-3">Setter CVR</th>
                <th className="py-3 px-3">3. Onboarded</th>
                <th className="py-3 px-3">Caller CVR</th>
                <th className="py-3 px-3">Overall CVR</th>
                <th className="py-3 px-3">Proofs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No logs found for the selected date range. Click "+ Enter Day" to add one!
                  </td>
                </tr>
              ) : (
                displayedRecords.map((r) => {
                  const sCvr = r.leadsReceived > 0 ? ((r.qualifiedLeads / r.leadsReceived) * 100).toFixed(1) : '0.0';
                  const cCvr = r.qualifiedLeads > 0 ? ((r.onboardedLeads / r.qualifiedLeads) * 100).toFixed(1) : '0.0';
                  const oCvr = r.leadsReceived > 0 ? ((r.onboardedLeads / r.leadsReceived) * 100).toFixed(1) : '0.0';
                  const isExpanded = expandedDate === r.date;
                  const totalProofCount = (r.qualifiedProofs?.length || 0) + (r.onboardedProofs?.length || 0);

                  return (
                    <React.Fragment key={r.date}>
                      <tr 
                        className={`transition cursor-pointer ${rowHover} ${isExpanded ? (isDark ? 'bg-slate-800/40' : 'bg-blue-50/20') : ''}`}
                        onClick={() => setExpandedDate(isExpanded ? null : r.date)}
                      >
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="py-3.5 px-3 font-semibold">
                          {r.leadsReceived}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {getQualityBadge(r.quality)}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-indigo-400">
                          {r.qualifiedLeads}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-indigo-400">
                          {sCvr}%
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-400">
                          {r.onboardedLeads}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-400">
                          {cCvr}%
                        </td>
                        <td className="py-3.5 px-3 font-black">
                          {oCvr}%
                        </td>
                        <td className="py-3.5 px-3">
                          {totalProofCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              {totalProofCount} proof{totalProofCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className={`text-[11px] ${textMuted}`}>&mdash;</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSelectDateToEdit(r.date)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                              title="Edit this day"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(r.date)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                              title="Delete day"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpandedDate(isExpanded ? null : r.date)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                              title="View notes & proofs"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Notes & All Attached Proofs */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className={`p-4 border-b ${expandedBg}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              
                              {/* 1. Received Notes */}
                              <div className={`p-3.5 rounded-xl border space-y-2 ${
                                isDark ? 'bg-slate-900 border-blue-900/60' : 'bg-white border-blue-200'
                              }`}>
                                <span className="font-bold text-blue-400 block text-[11px] uppercase tracking-wide">
                                  1. Inbound &amp; Lead Quality Notes
                                </span>
                                <div className="leading-relaxed">
                                  {r.receivedNotes ? renderWithClickableLinks(r.receivedNotes) : <span className={textMuted}>No notes entered.</span>}
                                </div>
                              </div>

                              {/* 2. Qualified Notes & Proofs */}
                              <div className={`p-3.5 rounded-xl border space-y-2 ${
                                isDark ? 'bg-slate-900 border-indigo-900/60' : 'bg-white border-indigo-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-400 block text-[11px] uppercase tracking-wide">
                                    2. Setter Notes &amp; Proofs
                                  </span>
                                  <span className="text-[10px] text-indigo-400 font-semibold">
                                    {(r.qualifiedProofs || []).length} proofs
                                  </span>
                                </div>
                                <div className="leading-relaxed">
                                  {r.qualifiedNotes ? renderWithClickableLinks(r.qualifiedNotes) : <span className={textMuted}>No notes entered.</span>}
                                </div>
                                {renderProofsInRow(r.qualifiedProofs, 'indigo')}
                              </div>

                              {/* 3. Onboarded Notes & Proofs */}
                              <div className={`p-3.5 rounded-xl border space-y-2 ${
                                isDark ? 'bg-slate-900 border-emerald-900/60' : 'bg-white border-emerald-300'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wide">
                                    3. Caller Notes &amp; Proofs
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-semibold">
                                    {(r.onboardedProofs || []).length} proofs
                                  </span>
                                </div>
                                <div className="leading-relaxed">
                                  {r.onboardedNotes ? renderWithClickableLinks(r.onboardedNotes) : <span className={textMuted}>No notes entered.</span>}
                                </div>
                                {renderProofsInRow(r.onboardedProofs, 'emerald')}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
