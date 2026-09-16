import { DayRecord, ProofItem } from '../types';

const STORAGE_KEY = 'simple_leads_tracker_records_v3';

export function getInitialRecords(): DayRecord[] {
  const today = new Date();
  const formatDate = (daysAgo: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
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
          title: 'Onboarding Call Notes',
          content: 'All 6 clients have kick-off calls booked for this Thursday. Contracts countersigned.'
        }
      ],
      onboardedNotes: 'Record day! 6 signed agreements and initial deposit received.',
    },
    {
      date: formatDate(2),
      leadsReceived: 18,
      quality: 'Poor',
      receivedNotes: 'Ad network glitch sent incorrect audience. Review adset here: https://adsmanager.facebook.com',
      qualifiedLeads: 4,
      qualifiedProofs: [
        {
          id: 'p-7',
          type: 'note',
          title: 'Audience Mismatch Summary',
          content: '10 leads were job seekers applying for hiring posts. Flagged to media buyer.'
        }
      ],
      qualifiedNotes: 'Setter reached out to all 18, but 10 were seeking jobs not service. Low intent.',
      onboardedLeads: 1,
      onboardedProofs: [
        {
          id: 'p-8',
          type: 'link',
          title: 'Call Recording - Closed Client',
          content: 'https://fathom.video/share/sample-onboarding-call-closed',
          notes: 'Only qualified lead that showed up closed immediately.'
        }
      ],
      onboardedNotes: 'Caller did 3 calls, 1 closed. Media buyer notified to pause adset.',
    },
    {
      date: formatDate(1),
      leadsReceived: 28,
      quality: 'Good',
      receivedNotes: 'Audience fixed. Leads responsive. Sheet updated: https://crm.example.com/leads',
      qualifiedLeads: 12,
      qualifiedProofs: [
        {
          id: 'p-9',
          type: 'link',
          title: 'Follow-up Chat Logs',
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

function normalizeRecord(r: any): DayRecord {
  const qualifiedProofs: ProofItem[] = Array.isArray(r.qualifiedProofs)
    ? r.qualifiedProofs
    : (r.qualifiedProof ? [{
        id: 'legacy-qual-' + Math.random().toString(36).substr(2, 6),
        type: r.qualifiedProof.startsWith('data:image') ? 'photo' : 'link',
        content: r.qualifiedProof,
        title: 'Attached Proof'
      }] : []);

  const onboardedProofs: ProofItem[] = Array.isArray(r.onboardedProofs)
    ? r.onboardedProofs
    : (r.onboardedProof ? [{
        id: 'legacy-onb-' + Math.random().toString(36).substr(2, 6),
        type: r.onboardedProof.startsWith('data:image') ? 'photo' : 'link',
        content: r.onboardedProof,
        title: 'Attached Proof'
      }] : []);

  return {
    date: r.date,
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

export function loadRecords(): DayRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if previous version records exist
      const prev = localStorage.getItem('simple_leads_tracker_records_v2');
      if (prev) {
        const parsed = JSON.parse(prev);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeRecord);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
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

export function saveRecords(records: DayRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save records', err);
  }
}
