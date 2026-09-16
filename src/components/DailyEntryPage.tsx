import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Paperclip,
  ExternalLink,
  ImageIcon,
  Mic,
  FileText,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { DayRecord, LeadQuality, ProofItem } from '../types';
import { renderWithClickableLinks } from '../utils/linkify';
import { ProofModal } from './ProofModal';
import { getLocalTodayISO } from '../utils/storage';

interface DailyEntryPageProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  record: DayRecord;
  onSave: (record: DayRecord) => void;
  onGoToTracker: () => void;
  isDark: boolean;
}

export const DailyEntryPage: React.FC<DailyEntryPageProps> = ({
  currentDate,
  onDateChange,
  record,
  onSave,
  onGoToTracker,
  isDark,
}) => {
  const [leadsReceived, setLeadsReceived] = useState<number>(record.leadsReceived || 0);
  const [quality, setQuality] = useState<LeadQuality>(record.quality || 'Good');
  const [receivedNotes, setReceivedNotes] = useState<string>(record.receivedNotes || '');

  const [qualifiedLeads, setQualifiedLeads] = useState<number>(record.qualifiedLeads || 0);
  const [qualifiedProofs, setQualifiedProofs] = useState<ProofItem[]>(record.qualifiedProofs || []);
  const [qualifiedNotes, setQualifiedNotes] = useState<string>(record.qualifiedNotes || '');

  const [onboardedLeads, setOnboardedLeads] = useState<number>(record.onboardedLeads || 0);
  const [onboardedProofs, setOnboardedProofs] = useState<ProofItem[]>(record.onboardedProofs || []);
  const [onboardedNotes, setOnboardedNotes] = useState<string>(record.onboardedNotes || '');

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Dirty flag: ONLY becomes true when the user actually edits something on the screen.
  // This strictly prevents uninitialized forms or background prop updates from overwriting the cloud!
  const isDirtyRef = useRef(false);
  const prevDateRef = useRef(currentDate);

  // Modal open states
  const [isSetterProofModalOpen, setIsSetterProofModalOpen] = useState(false);
  const [isCallerProofModalOpen, setIsCallerProofModalOpen] = useState(false);

  // Keep a ref of all fields for instant flushing
  const latestDataRef = useRef({
    date: currentDate,
    leadsReceived,
    quality,
    receivedNotes,
    qualifiedLeads,
    qualifiedProofs,
    qualifiedNotes,
    onboardedLeads,
    onboardedProofs,
    onboardedNotes,
  });

  latestDataRef.current = {
    date: currentDate,
    leadsReceived,
    quality,
    receivedNotes,
    qualifiedLeads,
    qualifiedProofs,
    qualifiedNotes,
    onboardedLeads,
    onboardedProofs,
    onboardedNotes,
  };

  const flushSave = (overrideDate?: string) => {
    // CRITICAL: Never flush or save if the user hasn't made actual edits!
    if (!isDirtyRef.current) return;
    isDirtyRef.current = false;

    const d = latestDataRef.current;
    const targetDate = overrideDate || d.date;
    const updated: DayRecord = {
      date: targetDate,
      leadsReceived: Number(d.leadsReceived) || 0,
      quality: d.quality,
      receivedNotes: d.receivedNotes.trim(),
      qualifiedLeads: Number(d.qualifiedLeads) || 0,
      qualifiedProofs: d.qualifiedProofs,
      qualifiedNotes: d.qualifiedNotes.trim(),
      onboardedLeads: Number(d.onboardedLeads) || 0,
      onboardedProofs: d.onboardedProofs,
      onboardedNotes: d.onboardedNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // User edit handlers that mark the form as dirty
  const handleLeadsReceivedChange = (val: number) => {
    isDirtyRef.current = true;
    setLeadsReceived(val);
  };
  const handleQualityChange = (val: LeadQuality) => {
    isDirtyRef.current = true;
    setQuality(val);
  };
  const handleReceivedNotesChange = (val: string) => {
    isDirtyRef.current = true;
    setReceivedNotes(val);
  };
  const handleQualifiedLeadsChange = (val: number) => {
    isDirtyRef.current = true;
    setQualifiedLeads(val);
  };
  const handleQualifiedNotesChange = (val: string) => {
    isDirtyRef.current = true;
    setQualifiedNotes(val);
  };
  const handleOnboardedLeadsChange = (val: number) => {
    isDirtyRef.current = true;
    setOnboardedLeads(val);
  };
  const handleOnboardedNotesChange = (val: string) => {
    isDirtyRef.current = true;
    setOnboardedNotes(val);
  };

  // Sync state whenever record or currentDate changes
  useEffect(() => {
    // If we are navigating away from a previous date, flush pending edits for that date first
    if (prevDateRef.current && prevDateRef.current !== currentDate) {
      if (isDirtyRef.current) {
        flushSave(prevDateRef.current);
      }
      isDirtyRef.current = false;
      prevDateRef.current = currentDate;
    }

    // When a fresh or updated record arrives from Firestore or props,
    // update form fields as long as user does not have active unsaved edits
    if (!isDirtyRef.current) {
      setLeadsReceived(record.leadsReceived || 0);
      setQuality(record.quality || 'Good');
      setReceivedNotes(record.receivedNotes || '');

      setQualifiedLeads(record.qualifiedLeads || 0);
      setQualifiedProofs(record.qualifiedProofs || []);
      setQualifiedNotes(record.qualifiedNotes || '');

      setOnboardedLeads(record.onboardedLeads || 0);
      setOnboardedProofs(record.onboardedProofs || []);
      setOnboardedNotes(record.onboardedNotes || '');

      setSaveStatus('saved');
    }
  }, [currentDate, record]);

  // Flush on unmount (e.g. if user navigates to Reports Tracker)
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        flushSave();
      }
    };
  }, []);

  // Debounced auto-save: ONLY runs when isDirtyRef is true (user actually changed values)
  useEffect(() => {
    if (!isDirtyRef.current) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      if (!isDirtyRef.current) return;
      isDirtyRef.current = false;

      const updated: DayRecord = {
        date: currentDate,
        leadsReceived: Number(leadsReceived) || 0,
        quality,
        receivedNotes: receivedNotes.trim(),
        qualifiedLeads: Number(qualifiedLeads) || 0,
        qualifiedProofs,
        qualifiedNotes: qualifiedNotes.trim(),
        onboardedLeads: Number(onboardedLeads) || 0,
        onboardedProofs,
        onboardedNotes: onboardedNotes.trim(),
        updatedAt: new Date().toISOString(),
      };
      onSave(updated);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 350);

    return () => clearTimeout(timer);
  }, [
    leadsReceived,
    quality,
    receivedNotes,
    qualifiedLeads,
    qualifiedProofs,
    qualifiedNotes,
    onboardedLeads,
    onboardedProofs,
    onboardedNotes,
    currentDate,
  ]);

  // Quick next/prev day navigation using local date math
  const shiftDate = (days: number) => {
    if (isDirtyRef.current) {
      flushSave();
    }
    const [y, m, day] = currentDate.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    d.setDate(d.getDate() + days);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    const nd = String(d.getDate()).padStart(2, '0');
    onDateChange(`${ny}-${nm}-${nd}`);
  };

  // Funnel calculations in real-time
  const setterCvr = leadsReceived > 0 
    ? ((qualifiedLeads / leadsReceived) * 100).toFixed(1) 
    : '0.0';
  const callerCvr = qualifiedLeads > 0 
    ? ((onboardedLeads / qualifiedLeads) * 100).toFixed(1) 
    : '0.0';
  const overallCvr = leadsReceived > 0 
    ? ((onboardedLeads / leadsReceived) * 100).toFixed(1) 
    : '0.0';

  const isToday = currentDate === getLocalTodayISO();

  // Dark/Light styling helpers
  const cardBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDark 
    ? 'bg-slate-800/90 border-slate-700 text-slate-100 focus:bg-slate-800' 
    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white';
  const previewBg = isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Helper to render proof chips
  const renderProofChips = (proofsList: ProofItem[], onOpenModal: () => void) => {
    if (proofsList.length === 0) {
      return (
        <button
          type="button"
          onClick={onOpenModal}
          className={`w-full p-2.5 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition ${
            isDark 
              ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 text-slate-400 hover:text-blue-400' 
              : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-500 hover:text-blue-700'
          }`}
        >
          <Paperclip className="w-4 h-4 text-blue-500" />
          <span>Upload Proof (Links, Screenshots, Audio &amp; Notes)</span>
        </button>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {proofsList.map((p) => (
            <span
              key={p.id}
              onClick={onOpenModal}
              title={p.title || p.type}
              className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-blue-500' 
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-blue-500'
              }`}
            >
              {p.type === 'link' && <LinkIcon className="w-3 h-3 text-blue-500" />}
              {p.type === 'photo' && <ImageIcon className="w-3 h-3 text-emerald-500" />}
              {p.type === 'audio' && <Mic className="w-3 h-3 text-red-500" />}
              {p.type === 'note' && <FileText className="w-3 h-3 text-amber-500" />}
              <span className="truncate max-w-[140px]">{p.title || p.type}</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="text-xs font-bold text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
        >
          <span>Manage / Add Proofs ({proofsList.length} attached) &rarr;</span>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Date Header & Quick Navigation with TODAY Button */}
      <div className={`rounded-xl p-4 border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">
                {isToday ? "Today's Daily Entry" : "Daily Entry"}
              </h2>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Today
                </span>
              )}
              {/* Google Sheets / Notes auto-save status badge */}
              {saveStatus === 'saving' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>All changes saved{lastSavedTime ? ` (${lastSavedTime})` : ''}</span>
                </span>
              )}
            </div>
            <p className={`text-xs ${textMuted}`}>
              Simple 3-stage funnel &bull; All entries automatically saved &amp; updated
            </p>
          </div>
        </div>

        {/* Date Selector with PREV, NEXT, and TODAY button */}
        <div className="flex items-center gap-2">
          {/* TODAY BUTTON */}
          <button
            type="button"
            onClick={() => onDateChange(getLocalTodayISO())}
            title="Jump to Today"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isToday
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => shiftDate(-1)}
            title="Previous Day"
            className={`p-2 rounded-lg transition ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />

          <button
            type="button"
            onClick={() => shiftDate(1)}
            title="Next Day"
            className={`p-2 rounded-lg transition ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Funnel Rate Preview Bar */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className={`border rounded-xl p-3 ${isDark ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50 border-blue-200'}`}>
          <span className="text-blue-500 font-bold block text-[11px] uppercase tracking-wide">1. Inbound Received</span>
          <span className="text-xl font-black">{leadsReceived}</span>
        </div>
        <div className={`border rounded-xl p-3 ${isDark ? 'bg-indigo-950/30 border-indigo-800/60' : 'bg-indigo-50 border-indigo-200'}`}>
          <span className="text-indigo-400 font-bold block text-[11px] uppercase tracking-wide">2. Qualified (Setter)</span>
          <span className="text-xl font-black">{qualifiedLeads}</span>
          <span className="text-[11px] text-indigo-400 font-bold block mt-0.5">
            {setterCvr}% CVR
          </span>
        </div>
        <div className={`border rounded-xl p-3 ${isDark ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className="text-emerald-400 font-bold block text-[11px] uppercase tracking-wide">3. Onboarded (Caller)</span>
          <span className="text-xl font-black">{onboardedLeads}</span>
          <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
            {callerCvr}% CVR ({overallCvr}% overall)
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={(e) => { e.preventDefault(); flushSave(); }} className="space-y-6">

        {/* STAGE 1: LEADS RECEIVED (QUALITY, NOTES) */}
        <div className={`rounded-xl border shadow-xs p-5 space-y-4 ${cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base">Leads Received</h3>
            </div>
            <span className={`text-xs font-medium ${textMuted}`}>Top of Funnel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Leads Count */}
            <div>
              <label className="block text-xs font-bold mb-1">
                Leads Received (Count)
              </label>
              <input
                type="number"
                min="0"
                value={leadsReceived}
                onChange={(e) => handleLeadsReceivedChange(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                required
              />
            </div>

            {/* Quality Selector */}
            <div>
              <label className="block text-xs font-bold mb-1">
                Lead Quality for the Day
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Poor', 'Fair', 'Good', 'Excellent'] as LeadQuality[]).map((q) => {
                  const active = quality === q;
                  const colorMapDark = {
                    Poor: active ? 'bg-red-600 text-white border-red-500' : 'bg-red-950/40 text-red-400 border-red-900/60',
                    Fair: active ? 'bg-amber-500 text-white border-amber-400' : 'bg-amber-950/40 text-amber-400 border-amber-900/60',
                    Good: active ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-950/40 text-blue-400 border-blue-900/60',
                    Excellent: active ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60',
                  };
                  const colorMapLight = {
                    Poor: active ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-800 border-red-200',
                    Fair: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-200',
                    Good: active ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-800 border-blue-200',
                    Excellent: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  };
                  const currentThemeMap = isDark ? colorMapDark : colorMapLight;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQualityChange(q)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${currentThemeMap[q]}`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Received Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold">
                Notes on Lead Quality / Campaign / Performance
              </label>
              <span className="text-[11px] text-blue-500 font-medium">Links are clickable</span>
            </div>
            <textarea
              rows={2}
              value={receivedNotes}
              onChange={(e) => handleReceivedNotesChange(e.target.value)}
              placeholder="What caused lead quality today? e.g. campaign switch, budget changes, link to adset https://..."
              className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
            {receivedNotes && (
              <div className={`mt-1.5 p-2 rounded-lg border text-xs ${previewBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Clickable Preview:</span>
                {renderWithClickableLinks(receivedNotes)}
              </div>
            )}
          </div>
        </div>

        {/* STAGE 2: QUALIFIED LEADS (PROOF OF FOLLOW-UP, NOTES) */}
        <div className={`rounded-xl border shadow-xs p-5 space-y-4 ${cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base">Qualified Leads (Setter)</h3>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isDark ? 'bg-indigo-950/50 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              Setter CVR: {setterCvr}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Qualified Count */}
            <div>
              <label className="block text-xs font-bold mb-1">
                Qualified Leads (Count)
              </label>
              <input
                type="number"
                min="0"
                value={qualifiedLeads}
                onChange={(e) => handleQualifiedLeadsChange(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 rounded-lg text-lg font-bold text-indigo-400 focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                required
              />
              <p className={`text-[11px] mt-1 ${textMuted}`}>
                {leadsReceived > 0 ? `${setterCvr}% qualification rate from ${leadsReceived} leads` : 'Enter leads received'}
              </p>
            </div>

            {/* Proof of Follow-up POPUP BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold">
                  Setter Proof of Follow-up
                </label>
                <span className="text-[11px] text-indigo-400 font-semibold">
                  {qualifiedProofs.length} item(s) attached
                </span>
              </div>
              {renderProofChips(qualifiedProofs, () => setIsSetterProofModalOpen(true))}
            </div>
          </div>

          {/* Qualified Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold">
                Qualified Notes &amp; Follow-up Context
              </label>
              <span className="text-[11px] text-blue-500 font-medium">Links are clickable</span>
            </div>
            <textarea
              rows={2}
              value={qualifiedNotes}
              onChange={(e) => handleQualifiedNotesChange(e.target.value)}
              placeholder="Setter objections, qualification criteria, follow-up timeline, CRM link https://..."
              className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
            />
            {qualifiedNotes && (
              <div className={`mt-1.5 p-2 rounded-lg border text-xs ${previewBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Clickable Preview:</span>
                {renderWithClickableLinks(qualifiedNotes)}
              </div>
            )}
          </div>
        </div>

        {/* STAGE 3: ONBOARDED LEADS (PROOF OF FOLLOW-UP, NOTES) */}
        <div className={`rounded-xl border shadow-xs p-5 space-y-4 ${cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base">Onboarded Leads (Caller)</h3>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
              isDark ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              Caller CVR: {callerCvr}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Onboarded Count */}
            <div>
              <label className="block text-xs font-bold mb-1">
                Onboarded Leads (Won Clients)
              </label>
              <input
                type="number"
                min="0"
                value={onboardedLeads}
                onChange={(e) => handleOnboardedLeadsChange(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-full px-3 py-2 rounded-lg text-lg font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 ${inputBg}`}
                required
              />
              <p className={`text-[11px] mt-1 ${textMuted}`}>
                {qualifiedLeads > 0 ? `${callerCvr}% close rate from ${qualifiedLeads} qualified leads` : 'Enter qualified leads'}
              </p>
            </div>

            {/* Proof of Follow-up POPUP BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold">
                  Caller Proof of Follow-up / Payment / Contract
                </label>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {onboardedProofs.length} item(s) attached
                </span>
              </div>
              {renderProofChips(onboardedProofs, () => setIsCallerProofModalOpen(true))}
            </div>
          </div>

          {/* Onboarded Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold">
                Onboarding Notes, Objections &amp; Call Performance
              </label>
              <span className="text-[11px] text-blue-500 font-medium">Links are clickable</span>
            </div>
            <textarea
              rows={2}
              value={onboardedNotes}
              onChange={(e) => handleOnboardedNotesChange(e.target.value)}
              placeholder="What drove calls today? e.g. price objections, signed agreements, Stripe link https://..."
              className={`w-full px-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 ${inputBg}`}
            />
            {onboardedNotes && (
              <div className={`mt-1.5 p-2 rounded-lg border text-xs ${previewBg}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Clickable Preview:</span>
                {renderWithClickableLinks(onboardedNotes)}
              </div>
            )}
          </div>
        </div>

        {/* Action / Auto-Save Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => {
              flushSave();
              onGoToTracker();
            }}
            className={`text-xs font-semibold hover:underline transition ${textMuted} flex items-center gap-1.5`}
          >
            &larr; View Report &amp; History Tracker
          </button>

          <div className="flex items-center gap-2">
            {saveStatus === 'saving' ? (
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving changes...</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                <span>All info automatically saved &amp; updated</span>
              </span>
            )}
          </div>
        </div>

      </form>

      {/* POPUP MODAL 1: Setter Proof Modal */}
      <ProofModal
        isOpen={isSetterProofModalOpen}
        onClose={() => setIsSetterProofModalOpen(false)}
        title="Setter Proof of Follow-up"
        stageName="Qualified Leads Stage"
        proofs={qualifiedProofs}
        onSaveProofs={(updatedProofs) => {
          setQualifiedProofs(updatedProofs);
          isDirtyRef.current = false;
          // Auto-save immediately to storage
          const d = latestDataRef.current;
          onSave({
            date: currentDate,
            leadsReceived: Number(d.leadsReceived) || 0,
            quality: d.quality,
            receivedNotes: d.receivedNotes.trim(),
            qualifiedLeads: Number(d.qualifiedLeads) || 0,
            qualifiedProofs: updatedProofs,
            qualifiedNotes: d.qualifiedNotes.trim(),
            onboardedLeads: Number(d.onboardedLeads) || 0,
            onboardedProofs: d.onboardedProofs,
            onboardedNotes: d.onboardedNotes.trim(),
            updatedAt: new Date().toISOString(),
          });
          setSaveStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }}
        isDark={isDark}
      />

      {/* POPUP MODAL 2: Caller Proof Modal */}
      <ProofModal
        isOpen={isCallerProofModalOpen}
        onClose={() => setIsCallerProofModalOpen(false)}
        title="Caller Proof of Follow-up &amp; Closing"
        stageName="Onboarded Leads Stage"
        proofs={onboardedProofs}
        onSaveProofs={(updatedProofs) => {
          setOnboardedProofs(updatedProofs);
          isDirtyRef.current = false;
          // Auto-save immediately to storage
          const d = latestDataRef.current;
          onSave({
            date: currentDate,
            leadsReceived: Number(d.leadsReceived) || 0,
            quality: d.quality,
            receivedNotes: d.receivedNotes.trim(),
            qualifiedLeads: Number(d.qualifiedLeads) || 0,
            qualifiedProofs: d.qualifiedProofs,
            qualifiedNotes: d.qualifiedNotes.trim(),
            onboardedLeads: Number(d.onboardedLeads) || 0,
            onboardedProofs: updatedProofs,
            onboardedNotes: d.onboardedNotes.trim(),
            updatedAt: new Date().toISOString(),
          });
          setSaveStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }}
        isDark={isDark}
      />

    </div>
  );
};
