import React, { useState, useEffect } from 'react';
import { DailyEntryPage } from './components/DailyEntryPage';
import { ReportsTrackerPage } from './components/ReportsTrackerPage';
import { DayRecord } from './types';
import {
  loadCachedRecords,
  saveCachedRecords,
  saveRecordToCloud,
  deleteRecordFromCloud,
  subscribeToCloudRecords,
} from './utils/storage';
import { PenTool, BarChart3, Sun, Moon, Cloud, CloudOff } from 'lucide-react';

export default function App() {
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  // Theme state: DARK MODE BY DEFAULT as requested
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('simple_leads_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [records, setRecords] = useState<DayRecord[]>(() => loadCachedRecords());
  const [activeView, setActiveView] = useState<'entry' | 'tracker'>('entry');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

  // Apply theme to document & localStorage
  useEffect(() => {
    localStorage.setItem('simple_leads_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Real-time Cloud Sync Subscription with Firestore
  useEffect(() => {
    setSyncStatus('syncing');
    const unsubscribe = subscribeToCloudRecords(
      (cloudRecords) => {
        setRecords(cloudRecords);
        setSyncStatus('synced');
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Find record for selected date, or default empty record
  const currentRecord: DayRecord = records.find((r) => r.date === selectedDate) || {
    date: selectedDate,
    leadsReceived: 0,
    quality: 'Good',
    receivedNotes: '',
    qualifiedLeads: 0,
    qualifiedProofs: [],
    qualifiedNotes: '',
    onboardedLeads: 0,
    onboardedProofs: [],
    onboardedNotes: '',
  };

  // Save or update record (instant optimistic update + cloud Firestore persistence)
  const handleSaveRecord = async (updated: DayRecord) => {
    // 1. Optimistic local state update
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.date === updated.date);
      let list: DayRecord[];
      if (idx >= 0) {
        list = [...prev];
        list[idx] = updated;
      } else {
        list = [updated, ...prev];
      }
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveCachedRecords(list);
      return list;
    });

    // 2. Persist to Cloud Database (Firestore)
    try {
      setSyncStatus('syncing');
      await saveRecordToCloud(updated);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Cloud save failed, local cache preserved:', err);
      setSyncStatus('error');
    }
  };

  // Delete record (from both local cache and cloud)
  const handleDeleteRecord = async (date: string) => {
    if (window.confirm(`Delete data for ${date}?`)) {
      setRecords((prev) => {
        const list = prev.filter((r) => r.date !== date);
        saveCachedRecords(list);
        return list;
      });

      try {
        setSyncStatus('syncing');
        await deleteRecordFromCloud(date);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Cloud delete error:', err);
      }
    }
  };

  // Edit specific date from tracker
  const handleSelectDateToEdit = (date: string) => {
    setSelectedDate(date);
    setActiveView('entry');
  };

  // Jump to new day (today)
  const handleNewDay = () => {
    setSelectedDate(getTodayISO());
    setActiveView('entry');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* Super Simple Navigation Header */}
      <header className={`sticky top-0 z-30 shadow-xs border-b transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight">
                  Daily Lead Tracker
                </h1>
                {/* Cloud Sync Status Indicator */}
                {syncStatus === 'synced' && (
                  <span
                    title="All records safely stored and synchronized with Firestore cloud database"
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  >
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span>Cloud Safe</span>
                  </span>
                )}
                {syncStatus === 'syncing' && (
                  <span
                    title="Syncing changes with cloud..."
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  >
                    <Cloud className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Syncing...</span>
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span
                    title="Operating in offline mode. Local copy preserved."
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    <CloudOff className="w-3 h-3 text-slate-400" />
                    <span>Offline Cache</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Received &rarr; Qualified &rarr; Onboarded
              </p>
            </div>
          </div>

          {/* Center & Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* 2 Clean View Switcher Buttons */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveView('entry')}
                id="nav-daily-entry"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeView === 'entry'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Enter Day's Info</span>
              </button>

              <button
                onClick={() => setActiveView('tracker')}
                id="nav-reports-tracker"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeView === 'tracker'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Report &amp; History Tracker</span>
              </button>
            </div>

            {/* DARK MODE SWITCH AT TOP RIGHT */}
            <button
              onClick={toggleTheme}
              id="theme-toggle-btn"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750' 
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isDark ? (
                <>
                  <Moon className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span className="hidden sm:inline text-slate-300 text-[11px]">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-slate-300 text-[11px]">Light</span>
                </>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeView === 'entry' ? (
          <DailyEntryPage
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
            record={currentRecord}
            onSave={handleSaveRecord}
            onGoToTracker={() => setActiveView('tracker')}
            isDark={isDark}
          />
        ) : (
          <ReportsTrackerPage
            records={records}
            onSelectDateToEdit={handleSelectDateToEdit}
            onDeleteRecord={handleDeleteRecord}
            onNewDay={handleNewDay}
            isDark={isDark}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-3 text-center text-xs transition-colors ${
        isDark ? 'border-slate-900 bg-slate-950/80 text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <p>Simple Daily Funnel Tracker &bull; Setter &rarr; Caller &bull; Multiple proofs (links, photos, audio &amp; notes) &bull; Clickable links in all notes</p>
      </footer>

    </div>
  );
}
