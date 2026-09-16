import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Upload, 
  Play, 
  Square, 
  Check, 
  Volume2, 
  AlertCircle
} from 'lucide-react';
import { ProofItem, ProofItemType } from '../types';
import { renderWithClickableLinks } from '../utils/linkify';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  stageName: string;
  proofs: ProofItem[];
  onSaveProofs: (proofs: ProofItem[]) => void;
  isDark: boolean;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  onClose,
  title,
  stageName,
  proofs,
  onSaveProofs,
  isDark,
}) => {
  const [items, setItems] = useState<ProofItem[]>([]);
  const [activeTab, setActiveTab] = useState<ProofItemType>('link');
  const [justSaved, setJustSaved] = useState(false);

  // Form states for adding a new proof
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileName, setNewFileName] = useState('');

  // Audio Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Sync items when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems([...proofs]);
      resetForm();
    }
  }, [isOpen, proofs]);

  // Clean up audio recording on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const resetForm = () => {
    setNewTitle('');
    setNewUrl('');
    setNewNote('');
    setNewFileContent('');
    setNewFileName('');
    setRecordedAudioUrl(null);
    setMicError(null);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordDuration(0);
  };

  // Image Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewFileContent(event.target.result as string);
        setNewFileName(file.name);
        if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Audio File Upload handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewFileContent(event.target.result as string);
        setNewFileName(file.name);
        if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // In-browser Microphone recording
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioUrl(base64Audio);
          setNewFileContent(base64Audio);
          setNewFileName(`voice_note_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.webm`);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError('Could not access microphone. Please allow microphone permissions or upload an audio file directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Add Item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    let content = '';
    if (activeTab === 'link') {
      if (!newUrl.trim()) return;
      content = newUrl.trim();
    } else if (activeTab === 'photo') {
      if (!newFileContent) return;
      content = newFileContent;
    } else if (activeTab === 'audio') {
      content = recordedAudioUrl || newFileContent;
      if (!content) return;
    } else if (activeTab === 'note') {
      if (!newNote.trim()) return;
      content = newNote.trim();
    }

    const newItem: ProofItem = {
      id: 'proof-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      type: activeTab,
      title: newTitle.trim() || (activeTab === 'link' ? 'Link Proof' : activeTab === 'photo' ? 'Screenshot Proof' : activeTab === 'audio' ? 'Audio Recording' : 'Follow-up Note'),
      content,
      notes: newNote.trim(),
      fileName: newFileName || undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    onSaveProofs(nextItems);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    resetForm();
  };

  const handleRemoveItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    onSaveProofs(nextItems);
  };

  // Styling helper based on isDark
  const bgMain = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const bgInput = isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-750' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white';
  const bgSubCard = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${bgMain}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              {items.length}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {title}
              </h3>
              <p className={`text-xs ${textMuted}`}>
                {stageName} &bull; Upload multiple links, notes, photos, &amp; audio recordings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section 1: Attached Proofs List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Attached Proofs ({items.length})
              </h4>
              {items.length === 0 && (
                <span className={`text-xs ${textMuted}`}>No proofs added yet for this day</span>
              )}
            </div>

            {items.length > 0 ? (
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${bgSubCard}`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon badge */}
                      <div className="mt-0.5 p-2 rounded-lg bg-blue-600/15 text-blue-500 shrink-0">
                        {item.type === 'link' && <LinkIcon className="w-4 h-4" />}
                        {item.type === 'photo' && <ImageIcon className="w-4 h-4" />}
                        {item.type === 'audio' && <Volume2 className="w-4 h-4" />}
                        {item.type === 'note' && <FileText className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate">
                            {item.title || item.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-500/10 text-blue-500 uppercase">
                            {item.type}
                          </span>
                          {item.createdAt && (
                            <span className={`text-[10px] ${textMuted}`}>
                              {item.createdAt}
                            </span>
                          )}
                        </div>

                        {/* Content based on type */}
                        {item.type === 'link' && (
                          <div className="text-xs">
                            <a
                              href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-400 font-medium underline inline-flex items-center gap-1 break-all"
                            >
                              <span>{item.content}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </div>
                        )}

                        {item.type === 'photo' && (
                          <div className="pt-1">
                            {item.content.startsWith('data:image') || item.content.startsWith('http') ? (
                              <div className="flex items-center gap-3">
                                <a 
                                  href={item.content} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="group relative block"
                                >
                                  <img
                                    src={item.content}
                                    alt={item.title || 'Screenshot proof'}
                                    className="w-20 h-14 object-cover rounded-lg border border-slate-700 shadow-xs group-hover:opacity-90 transition"
                                  />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition rounded-lg text-[10px] font-bold">
                                    Expand
                                  </span>
                                </a>
                                {item.fileName && (
                                  <span className={`text-[11px] truncate ${textMuted}`}>{item.fileName}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs">{item.content}</span>
                            )}
                          </div>
                        )}

                        {item.type === 'audio' && (
                          <div className="pt-1 space-y-1">
                            <audio 
                              controls 
                              src={item.content} 
                              className="w-full max-w-sm h-8 rounded-lg"
                            />
                            {item.fileName && (
                              <p className={`text-[11px] ${textMuted}`}>{item.fileName}</p>
                            )}
                          </div>
                        )}

                        {item.type === 'note' && (
                          <div className="text-xs leading-relaxed">
                            {renderWithClickableLinks(item.content)}
                          </div>
                        )}

                        {/* Additional note if attached to link/photo/audio */}
                        {item.type !== 'note' && item.notes && (
                          <div className={`text-xs mt-1 pt-1 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-200'}`}>
                            {renderWithClickableLinks(item.notes)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove this proof"
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Section 2: Add New Proof */}
          <div className={`p-4 rounded-xl border ${bgSubCard}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Proof Item</span>
            </h4>

            {/* Sub-Tabs: Link | Photo | Audio | Note */}
            <div className="grid grid-cols-4 gap-1.5 mb-4 p-1 rounded-xl bg-black/20">
              <button
                type="button"
                onClick={() => { setActiveTab('link'); resetForm(); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'link' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Link</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('photo'); resetForm(); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'photo' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('audio'); resetForm(); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'audio' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('note'); resetForm(); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'note' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>
            </div>

            {/* Input Form based on Active Tab */}
            <form onSubmit={handleAddItem} className="space-y-3">
              
              {/* Optional Title for Link/Photo/Audio */}
              {activeTab !== 'note' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Proof Title / Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Loom Walkthrough, Contract PDF, Setter DM Chat..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                  />
                </div>
              )}

              {/* 1. LINK TAB */}
              {activeTab === 'link' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    URL / Link *
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="https://loom.com/share/..., https://drive.google.com/..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                    />
                  </div>
                </div>
              )}

              {/* 2. PHOTO TAB */}
              {activeTab === 'photo' && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-400">
                    Upload Screenshot / Photo *
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Image File</span>
                    </button>
                    <span className={`text-xs ${textMuted}`}>
                      {newFileName || 'PNG, JPG, WebP supported'}
                    </span>
                  </div>

                  {newFileContent && (
                    <div className="mt-2 p-2 rounded-lg border border-slate-700 bg-black/20 flex items-center gap-3">
                      <img src={newFileContent} alt="Preview" className="w-16 h-12 object-cover rounded" />
                      <span className="text-xs font-semibold text-emerald-500">Image loaded ready to add!</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. AUDIO TAB */}
              {activeTab === 'audio' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-slate-400">
                    Audio Recording or Audio File *
                  </label>

                  {micError && (
                    <div className="p-2.5 rounded-lg bg-red-900/30 border border-red-800 text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{micError}</span>
                    </div>
                  )}

                  {/* Recording control button */}
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-black/30 border border-slate-800">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Record with Mic</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 text-red-400" />
                        <span>Stop Recording ({formatSeconds(recordDuration)})</span>
                      </button>
                    )}

                    <span className={`text-xs ${textMuted}`}>or</span>

                    {/* File upload option */}
                    <input
                      type="file"
                      ref={audioFileInputRef}
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Audio File</span>
                    </button>
                  </div>

                  {/* Audio preview player */}
                  {(recordedAudioUrl || newFileContent) && (
                    <div className="p-2.5 rounded-lg border border-slate-700 bg-black/20 space-y-1.5">
                      <span className="text-[11px] font-semibold text-emerald-400 block">
                        Preview Audio Recording:
                      </span>
                      <audio controls src={recordedAudioUrl || newFileContent} className="w-full h-8" />
                    </div>
                  )}
                </div>
              )}

              {/* 4. NOTE TAB OR OPTIONAL NOTES FOR OTHER TABS */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {activeTab === 'note' ? 'Follow-up Note Content *' : 'Description / Note (Optional)'}
                </label>
                <textarea
                  rows={2}
                  required={activeTab === 'note'}
                  placeholder={
                    activeTab === 'note'
                      ? 'Enter follow-up note, objection notes, or link https://...'
                      : 'Any extra context, objection notes, or timestamp notes...'
                  }
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                />
              </div>

              {/* Submit Add Button */}
              <div className="flex items-center justify-end gap-3 pt-1">
                {justSaved && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Added &amp; Saved!
                  </span>
                )}
                <button
                  type="submit"
                  id="add-and-save-proof-btn"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add &amp; Save Proof</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${textMuted} flex items-center gap-1.5`}>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{items.length} proof item(s) attached &bull; auto-saved</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isDark 
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
