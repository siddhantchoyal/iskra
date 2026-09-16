export type LeadQuality = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export type ProofItemType = 'link' | 'photo' | 'audio' | 'note';

export interface ProofItem {
  id: string;
  type: ProofItemType;
  title?: string;
  content: string; // URL for links, Data URL (base64) for photos/audio, or text for notes
  notes?: string; // Optional note or caption attached to the proof
  fileName?: string;
  createdAt?: string;
}

export interface TeamSettings {
  timezone: string; // IANA timezone, e.g. 'Asia/Kolkata', 'America/New_York', or 'auto'
  updatedAt?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  
  // Stage 1: Leads Received
  leadsReceived: number;
  quality: LeadQuality;
  receivedNotes: string; // link friendly

  // Stage 2: Qualified Leads (Setter)
  qualifiedLeads: number;
  qualifiedProofs: ProofItem[]; // multiple links, notes, photos, audio recordings
  qualifiedProof?: string; // legacy fallback
  qualifiedProofType?: 'image' | 'link';
  qualifiedNotes: string; // link friendly

  // Stage 3: Onboarded Leads (Caller)
  onboardedLeads: number;
  onboardedProofs: ProofItem[]; // multiple links, notes, photos, audio recordings
  onboardedProof?: string; // legacy fallback
  onboardedProofType?: 'image' | 'link';
  onboardedNotes: string; // link friendly

  updatedAt?: string;
}
