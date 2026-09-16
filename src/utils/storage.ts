import { DayRecord, ProofItem } from '../types';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'simple_leads_tracker_records_v3';
const COLLECTION_NAME = 'day_records';

export const getLocalTodayISO = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const hasLocalCache = (): boolean => {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
};

export function getInitialRecords(): DayRecord[] {
  const today = new Date();
  const formatDate = (daysAgo: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return [
    {
      date: formatDate(4),
      leadsReceived: 25,
      quality: 'Good',
      receivedNotes: 'Meta Ads campaign revamp. High intent inbound form submissions from https://app.hubspot.com/crm',
      qualifiedLeads: 11,
      qualifiedProofs: [
        {
          id: 'p-1',
          type: 'link',
          title: 'Setter DM walkthrough',
          content: 'https://loom.com/share/setter-followup-batch-demo',
          notes: 'Loom recording showing initial DMs sent to all 25 leads within 10 minutes.'
        },
        {
          id: 'p-2',
          type: 'note',
          title: 'Disqualification Criteria',
          content: '14 leads disqualified: 8 under minimum revenue threshold, 6 unresponsive after 3 bumps.'
        }
      ],
      qualifiedNotes: 'Setter messaged all 25 within 10 min. 11 qualified after checking budget. Proof video on Loom.',
      onboardedLeads: 4,
      onboardedProofs: [
        {
          id: 'p-3',
          type: 'link',
          title: 'Client Signed Contracts Folder',
          content: 'https://drive.google.com/drive/folders/client-contracts-sample',
          notes: 'Google Drive folder with 4 executed master service agreements.'
        }
      ],
      onboardedNotes: 'Caller completed 8 calls, closed 4. 2 requested follow-up next Monday.',
    },
    {
      date: formatDate(3),
      leadsReceived: 32,
      quality: 'Excellent',
      receivedNotes: 'Strong lead quality today. All decision-makers. See lead sheet: https://docs.google.com/spreadsheets/d/sample',
      qualifiedLeads: 15,
      qualifiedProofs: [
        {
          id: 'p-4',
          type: 'link',
          title: 'Setter Outreach Proof',
          content: 'https://loom.com/share/setter-dm-proof-sample',
          notes: 'Batch follow-up sequence completed via WhatsApp Web & email.'
        }
      ],
      qualifiedNotes: 'Great response speed. 15 qualified for call booking.',
      onboardedLeads: 6,
      onboardedProofs: [
        {
          id: 'p-5',
          type: 'link',
          title: 'Stripe Invoices Paid',
          content: 'https://stripe.com/payments/sample-invoices',
          notes: '6 payments captured totaling $18,000 setup fees.'
        },
        {
          id: 'p-6',
          type: 'note',
          title: 'Closing Objections Overcome',
          content: 'Handled implementation timeline concerns by offering expedited 7-day onboarding.'
        }
      ],
      onboardedNotes: 'Caller closed 6 out of 15. Stellar conversion rate of 40%.',
    },
    {
      date: formatDate(2),
      leadsReceived: 18,
      quality: 'Fair',
      receivedNotes: 'Weekend drop-off in lead volume. Inbound leads from LinkedIn organic posts.',
      qualifiedLeads: 7,
      qualifiedProofs: [
        {
          id: 'p-7',
          type: 'link',
          title: 'Call Recordings Folder',
          content: 'https://app.gong.io/recordings/setter-discovery-calls',
          notes: '7 discovery call recordings analyzed with setter.'
        }
      ],
      qualifiedNotes: 'Setter qualified 7 high intent founders.',
      onboardedLeads: 2,
      onboardedProofs: [
        {
          id: 'p-8',
          type: 'note',
          title: 'Follow-up Scheduled',
          content: '3 leads delayed decision to Monday morning budget meeting.'
        }
      ],
      onboardedNotes: 'Caller closed 2. Good momentum going into the new week.',
    },
    {
      date: formatDate(1),
      leadsReceived: 28,
      quality: 'Good',
      receivedNotes: 'Monday inbound surge from Google Ads & Referral program.',
      qualifiedLeads: 12,
      qualifiedProofs: [
        {
          id: 'p-9',
          type: 'link',
          title: 'Setter Conversation Screenshots',
          content: 'https://drive.google.com/file/d/setter-followup-screenshots',
          notes: 'Drive folder containing screenshots of WhatsApp conversations.'
        }
      ],
      qualifiedNotes: 'Setter followed up 2x with pending leads and qualified 12.',
      onboardedLeads: 4,
      onboardedProofs: [
        {
          id: 'p-10',
          type: 'link',
          title: 'Onboarding Confirmation Doc',
          content: 'https://drive.google.com/file/d/onboarding-confirmation',
          notes: 'Onboarding forms and payment receipt links.'
        }
      ],
      onboardedNotes: 'Caller closed 4 onboardings. Solid conversion rate.',
    }
  ];
}

export function normalizeRecord(r: any): DayRecord {
  const qualifiedProofs: ProofItem[] = Array.isArray(r.qualifiedProofs)
    ? r.qualifiedProofs.map((p: any) => ({
        id: String(p.id || 'p-' + Math.random().toString(36).substring(2, 8)),
        type: p.type || 'link',
        title: p.title || '',
        content: p.content || '',
        notes: p.notes || '',
        fileName: p.fileName || '',
        createdAt: p.createdAt || '',
      }))
    : (r.qualifiedProof ? [{
        id: 'legacy-qual-' + Math.random().toString(36).substring(2, 6),
        type: r.qualifiedProof.startsWith('data:image') ? 'photo' : 'link',
        content: r.qualifiedProof,
        title: 'Attached Proof'
      }] : []);

  const onboardedProofs: ProofItem[] = Array.isArray(r.onboardedProofs)
    ? r.onboardedProofs.map((p: any) => ({
        id: String(p.id || 'p-' + Math.random().toString(36).substring(2, 8)),
        type: p.type || 'link',
        title: p.title || '',
        content: p.content || '',
        notes: p.notes || '',
        fileName: p.fileName || '',
        createdAt: p.createdAt || '',
      }))
    : (r.onboardedProof ? [{
        id: 'legacy-onb-' + Math.random().toString(36).substring(2, 6),
        type: r.onboardedProof.startsWith('data:image') ? 'photo' : 'link',
        content: r.onboardedProof,
        title: 'Attached Proof'
      }] : []);

  return {
    date: String(r.date || ''),
    leadsReceived: Number(r.leadsReceived) || 0,
    quality: r.quality || 'Good',
    receivedNotes: r.receivedNotes || '',
    qualifiedLeads: Number(r.qualifiedLeads) || 0,
    qualifiedProofs,
    qualifiedNotes: r.qualifiedNotes || '',
    onboardedLeads: Number(r.onboardedLeads) || 0,
    onboardedProofs,
    onboardedNotes: r.onboardedNotes || '',
    updatedAt: r.updatedAt || undefined,
  };
}

export function sanitizeForCloud(r: DayRecord) {
  const qProofs = Array.isArray(r.qualifiedProofs)
    ? r.qualifiedProofs.slice(0, 50).map((p) => ({
        id: String(p.id || 'p-' + Math.random().toString(36).substring(2, 8)),
        type: p.type || 'link',
        title: (p.title || '').slice(0, 200),
        content: String(p.content || ''),
        notes: (p.notes || '').slice(0, 2000),
        fileName: (p.fileName || '').slice(0, 200),
        createdAt: p.createdAt || new Date().toISOString(),
      }))
    : [];

  const oProofs = Array.isArray(r.onboardedProofs)
    ? r.onboardedProofs.slice(0, 50).map((p) => ({
        id: String(p.id || 'p-' + Math.random().toString(36).substring(2, 8)),
        type: p.type || 'link',
        title: (p.title || '').slice(0, 200),
        content: String(p.content || ''),
        notes: (p.notes || '').slice(0, 2000),
        fileName: (p.fileName || '').slice(0, 200),
        createdAt: p.createdAt || new Date().toISOString(),
      }))
    : [];

  return {
    date: r.date,
    leadsReceived: Number(r.leadsReceived) || 0,
    quality: r.quality || 'Good',
    receivedNotes: (r.receivedNotes || '').slice(0, 10000),
    qualifiedLeads: Number(r.qualifiedLeads) || 0,
    qualifiedProofs: qProofs,
    qualifiedNotes: (r.qualifiedNotes || '').slice(0, 10000),
    onboardedLeads: Number(r.onboardedLeads) || 0,
    onboardedProofs: oProofs,
    onboardedNotes: (r.onboardedNotes || '').slice(0, 10000),
    updatedAt: r.updatedAt || new Date().toISOString(),
  };
}

// Local cache methods
export function loadCachedRecords(): DayRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeRecord);
    }
    const init = getInitialRecords();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  } catch {
    return getInitialRecords();
  }
}

export function saveCachedRecords(records: DayRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save cached records', err);
  }
}

// Backward compatibility alias
export const loadRecords = loadCachedRecords;
export const saveRecords = saveCachedRecords;

// Cloud Sync Methods (Firestore)
export async function saveRecordToCloud(record: DayRecord): Promise<void> {
  try {
    const sanitized = sanitizeForCloud(record);
    const docRef = doc(db, COLLECTION_NAME, record.date);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.error('Failed to save record to cloud database:', err);
    throw err;
  }
}

export async function deleteRecordFromCloud(date: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, date);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete record from cloud database:', err);
    throw err;
  }
}

/**
 * Real-time subscription to cloud records with automatic seeding if cloud collection is empty
 */
export function subscribeToCloudRecords(
  onData: (records: DayRecord[]) => void,
  onSyncStateChange?: (state: 'synced' | 'syncing' | 'error') => void
): () => void {
  const colRef = collection(db, COLLECTION_NAME);

  // Set up real-time onSnapshot listener
  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // If the cloud collection is currently empty, seed from local cached records or defaults
        try {
          if (onSyncStateChange) onSyncStateChange('syncing');
          const localRecords = loadCachedRecords();
          const recordsToSeed = localRecords.length > 0 ? localRecords : getInitialRecords();
          const batch = writeBatch(db);
          recordsToSeed.forEach((rec) => {
            const docRef = doc(db, COLLECTION_NAME, rec.date);
            batch.set(docRef, sanitizeForCloud(rec));
          });
          await batch.commit();
          // onSnapshot will immediately trigger again with seeded docs
          if (onSyncStateChange) onSyncStateChange('synced');
        } catch (seedErr) {
          console.error('Error seeding initial data to cloud:', seedErr);
          if (onSyncStateChange) onSyncStateChange('error');
        }
        return;
      }

      const cloudRecords: DayRecord[] = [];
      snapshot.forEach((d) => {
        cloudRecords.push(normalizeRecord(d.data()));
      });

      // Sort newest date first
      cloudRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Mirror to local storage so offline access is always preserved
      saveCachedRecords(cloudRecords);

      onData(cloudRecords);
      if (onSyncStateChange) onSyncStateChange('synced');
    },
    (err) => {
      console.error('Firestore listener error:', err);
      if (onSyncStateChange) onSyncStateChange('error');
      // Fallback to local cached data
      const cached = loadCachedRecords();
      onData(cached);
    }
  );

  return unsubscribe;
}
