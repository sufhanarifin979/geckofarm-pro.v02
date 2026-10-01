import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Shield, 
  Crown, 
  Store, 
  Camera,
  ChevronRight,
  User,
  Info,
  LogOut,
  Phone,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Heart
} from 'lucide-react';
import { UserProfile } from '../types';
import { db, signOut } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { compressImage, uploadFarmImage } from '../lib/imageUtils';
import PremiumModal from './PremiumModal';
import LegalModal from './LegalModal';
import { useNotifications } from '../context/NotificationContext';
import { SOUND_PRESETS } from '../lib/soundUtils';

interface SettingsProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function Settings({ profile, setProfile }: SettingsProps) {
  const { settings, updateSettings, premiumDaysLeft, playTestSound } = useNotifications();
  const [formData, setFormData] = useState({
    farmName: profile?.farmName || '',
    farmPhotoUrl: profile?.farmPhotoUrl || ''
  });
  useEffect(() => {
    if (profile) {
      setFormData({
        farmName: profile.farmName || '',
        farmPhotoUrl: profile.farmPhotoUrl || ''
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
    isOpen: false,
    type: 'privacy'
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      let finalData = { ...formData };
      
      // Handle image upload if it's a new base64 image
      if (formData.farmPhotoUrl.startsWith('data:image')) {
        const uploadedUrl = await uploadFarmImage(profile.uid, formData.farmPhotoUrl);
        finalData.farmPhotoUrl = uploadedUrl;
      }

      await updateDoc(doc(db, 'users', profile.uid), finalData);
      setProfile({ ...profile, ...finalData });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save branding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = async () => {
    if (!profile) return;
    if (window.confirm('Simulated Upgrade: Unlock unlimited slots and professional tools?')) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), { subscription: 'premium', planLimit: 10000 });
        setProfile({ ...profile, subscription: 'premium', planLimit: 10000 });
        alert('Success: Your account has been upgraded to Premium!');
      } catch (err: any) {
        console.error(err);
        alert(`Failed to upgrade: ${err.message || 'Check browser console'}`);
      }
    }
  };

  const handleShowTourAgain = async () => {
    if (!profile) return;
    // Removed window.confirm because it is blocked inside sandboxed iframes.
    // Setting onboardingCompleted to false will trigger the tour modal to open immediately.
    setProfile({ ...profile, onboardingCompleted: false });
    
    try {
      await updateDoc(doc(db, 'users', profile.uid), { onboardingCompleted: false });
    } catch (err: any) {
      console.warn("Gagal memperbarui status onboarding di Firestore (mode offline aktif):", err);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Configuration</h2>
        <h1 className="text-3xl font-bold text-slate-900">Farm Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                    {formData.farmPhotoUrl ? (
                      <img src={formData.farmPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl shadow-lg cursor-pointer hover:bg-emerald-600 transition-all border-2 border-white">
                    <Camera size={16} />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.readAsDataURL(e.target.files[0]);
                          reader.onload = async () => {
                            const compressed = await compressImage(reader.result as string);
                            setFormData({ ...formData, farmPhotoUrl: compressed });
                          };
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profile?.farmName || "Unnamed Farm"}</h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {profile?.subscription === 'premium' ? 'Professional Member' : 'Free Member'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Farm Branding Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                    value={formData.farmName}
                    onChange={e => setFormData({ ...formData, farmName: e.target.value.toUpperCase() })}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Public Email Address</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                    value={profile?.email ?? ''}
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                {showSuccess && (
                  <div className="text-emerald-600 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center">
                    <Check size={14} className="mr-1" />
                    Saved Successfully
                  </div>
                )}
                {error && (
                  <div className="text-red-500 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center">
                    <Info size={14} className="mr-1" />
                    {error}
                  </div>
                )}
              </div>
              <button 
                disabled={isSaving}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
              >
                {isSaving ? "Saving..." : "Save Branding"}
              </button>
            </div>
          </form>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest leading-none">Notification Settings</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Configure your breeder alert preferences</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Hatch Reminder */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Hatch Reminder</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Get notified when clutches are estimated to hatch today, soon (≤ 3 days), are overdue, or active pairings lack clutches.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ hatchReminder: !settings.hatchReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.hatchReminder ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.hatchReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Pairing 10-12 Hari Reminder */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Pemeriksaan Pairing 10-12 Hari</h4>
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Rekomendasi</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Pengingat otomatis untuk pairing yang sudah 10-12 hari tanpa clutch atau 10-12 hari setelah clutch sebelumnya (waktu tepat untuk palpasi perut, cek ovulasi & siapkan nesting box).
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ pairingCheckReminder: !settings.pairingCheckReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.pairingCheckReminder ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pairingCheckReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Candle Reminder */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Candle & Incubation Milestone Reminder</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Receive alerts on incubation days 7, 14, 21, 30, and 45 to candle eggs, and milestone achievements.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ candleReminder: !settings.candleReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.candleReminder ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.candleReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Premium Reminder */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Premium Reminder</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Keep track of your subscription with gentle alerts before your premium license expires.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ premiumReminder: !settings.premiumReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.premiumReminder ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.premiumReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Finance Reminder */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Finance Reminder</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Get a gentle monthly nudge to log your transactions and keep your farm financial health sheet updated.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ financeReminder: !settings.financeReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.financeReminder ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.financeReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Future Push Notification Placeholder */}
                <div className="py-4 flex items-center justify-between opacity-50 select-none">
                  <div className="pr-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Future Push Notifications (Beta)</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Enable browser-native background push messages. Coming soon in next stable release.
                    </p>
                  </div>
                  <button 
                    type="button"
                    disabled
                    className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-100 cursor-not-allowed"
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-slate-350 translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sound & Audio Feedback Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest leading-none">Audio & Sound Settings</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Konfigurasi bel notifikasi satu kali bunyi</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => playTestSound()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Play size={14} className="fill-slate-700" />
                  <span>Uji Bel</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Main Audio Toggle */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Aktifkan Suara Notifikasi</h4>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        settings.soundEnabled 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {settings.soundEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Memutar bunyi bel pendek yang jernih dan nyaman (sekali bunyi) sesuai preferensi Anda.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Status Notice if master sound is muted */}
                {!settings.soundEnabled && (
                  <div className="py-3 px-4 my-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <VolumeX size={16} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 font-medium">
                        <strong className="font-bold">Suara utama sedang nonaktif (Mute).</strong> Seluruh opsi on/off di bawah tetap dapat Anda atur dan tidak akan hilang.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ soundEnabled: true })}
                      className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm whitespace-nowrap active:scale-95 transition-all"
                    >
                      Aktifkan Suara
                    </button>
                  </div>
                )}

                {/* Condition 1: Sound on Notification Center Open (Always visible) */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Putar Saat Notification Center Dibuka</h4>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        settings.soundOnOpen 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {settings.soundOnOpen ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Memberikan umpan balik suara bel sekali bunyi saat Anda membuka laci notifikasi.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ soundOnOpen: !settings.soundOnOpen })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.soundOnOpen ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundOnOpen ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Condition 2: Sound on New Reminder while Active (Always visible) */}
                <div className="py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Putar Saat Reminder Baru Muncul</h4>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        settings.soundOnNewReminder 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {settings.soundOnNewReminder ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                      Bunyikan bel saat ada agenda / reminder baru terdeteksi ketika Anda sedang aktif menggunakan aplikasi.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => updateSettings({ soundOnNewReminder: !settings.soundOnNewReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      settings.soundOnNewReminder ? 'bg-amber-500' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundOnNewReminder ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Sound Preset Selector (Always visible) */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pilihan Suara Bel ({SOUND_PRESETS.length} Pilihan Nada)</label>
                    <span className="text-[10px] font-bold text-amber-600">Klik untuk mendengar</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SOUND_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateSettings({ soundPreset: preset.id });
                          playTestSound(preset.id);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          settings.soundPreset === preset.id
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="block text-xs font-black text-slate-800">{preset.label}</span>
                          {settings.soundPreset === preset.id && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <span className="block text-[9px] text-slate-400 mt-1 leading-tight">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume Slider (Always visible) */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Volume Suara</label>
                    <span className="text-xs font-black text-slate-700">{Math.round((settings.soundVolume ?? 0.7) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VolumeX size={16} className="text-slate-400 shrink-0" />
                    <input 
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.soundVolume ?? 0.7}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        updateSettings({ soundVolume: vol });
                      }}
                      onMouseUp={() => playTestSound()}
                      onTouchEnd={() => playTestSound()}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
                    />
                    <Volume2 size={16} className="text-amber-500 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className={`rounded-2xl p-8 border text-white relative overflow-hidden transition-all duration-500 shadow-xl ${
            profile?.subscription === 'premium' ? "bg-slate-900 border-slate-800" : "bg-emerald-600 border-emerald-500"
          }`}>
            <Crown size={32} className="text-emerald-400 mb-6" />
            <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">Membership Details</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Current Plan</span>
                <span>{profile?.subscription === 'premium' ? 'Premium Pro' : 'Free Trial'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Registry Limit</span>
                <span>{profile?.planLimit} Units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">Premium Tools</span>
                <span>{profile?.subscription === 'premium' ? 'Unlocked' : 'Locked'}</span>
              </div>
            </div>

              {profile?.subscription !== 'premium' ? (
                <div className="flex flex-col items-center gap-4 mt-2">
                  <button 
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-2xl border border-slate-800"
                  >
                    Unlock Premium Features
                  </button>
                  <button 
                    onClick={handleUpgrade}
                    className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-all underline underline-offset-4"
                  >
                    Simulate Quick Upgrade (Dev)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Premium Status Active</p>
                  <p className="text-sm text-emerald-300 font-bold tracking-wide mt-1">
                    {premiumDaysLeft} Hari lagi
                  </p>
                  {profile?.premiumExpiresAt && (
                    <p className="text-[8px] text-white/50 uppercase font-semibold tracking-wider">
                      S/D {(() => {
                        const exp = profile.premiumExpiresAt;
                        const d = exp.toDate ? exp.toDate() : (exp.seconds ? new Date(exp.seconds * 1000) : new Date(exp));
                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                      })()}
                    </p>
                  )}
                </div>
              )}
          </div>
          
          <PremiumModal 
            isOpen={isPremiumModalOpen} 
            onClose={() => setIsPremiumModalOpen(false)} 
            profile={profile} 
          />

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Phone size={20} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest leading-none">Dukungan & Hubungi Admin</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-medium px-1">
               Jika Anda memerlukan bantuan teknis, upgrade premium, atau kemitraan, hubungi admin melalui kontak WhatsApp di bawah ini.
             </p>
             <a 
               href="https://wa.me/6285777719980" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="w-full flex justify-between items-center p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all group"
             >
                <span>Kontak Admin</span>
                <ChevronRight size={14} className="text-emerald-400 group-hover:text-emerald-700" />
             </a>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Info size={20} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest leading-none">App Guide</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-medium px-1">
                Butuh bantuan untuk memahami alur fitur-fitur profesional Gecko Farm Pro? Anda dapat mengulang tur panduan kapan saja.
             </p>
             <button 
               onClick={handleShowTourAgain}
               className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all group"
             >
                <span>Show Welcome Tour</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600" />
             </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <Shield size={20} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest leading-none">Security & Privacy</h3>
             </div>
             <div className="space-y-2">
                <button 
                  onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                  className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all group"
                >
                   <span>Privacy Policy</span>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                </button>
                <button 
                  onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                  className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all group"
                >
                   <span>Terms of Use</span>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                </button>
             </div>
          </div>

          <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 shadow-sm flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
                <LogOut size={20} className="text-red-500" />
                <h3 className="text-xs font-bold uppercase text-red-500 tracking-widest leading-none">Account Session</h3>
             </div>
             <p className="text-[10px] text-slate-500 font-medium px-1">
               Signing out will end your current session. You will need to sign in again to access your farm records.
             </p>
             <button 
                onClick={() => signOut()}
                className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
             >
                <LogOut size={16} />
                Logout Account
             </button>
          </div>
        </div>
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
        type={legalModal.type} 
      />
    </div>
  );
}
