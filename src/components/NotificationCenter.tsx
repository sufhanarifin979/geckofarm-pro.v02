import { useState, useEffect } from 'react';
import { useNotifications, ReminderItem } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Check, 
  Trash2, 
  Egg, 
  AlertTriangle, 
  Heart, 
  Flame, 
  Sparkles, 
  CircleDollarSign, 
  BellOff,
  Bell,
  CheckCheck,
  Calendar,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playNotificationSound, SOUND_PRESETS } from '../lib/soundUtils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    settings, 
    updateSettings, 
    reminders, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteReminder,
    playTestSound
  } = useNotifications();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'high' | 'hatch' | 'pairing'>('all');
  const [showSoundConfig, setShowSoundConfig] = useState(false);

  // Trigger sound when Notification Center is opened
  useEffect(() => {
    if (isOpen && settings.soundEnabled && settings.soundOnOpen) {
      playNotificationSound(settings.soundVolume, settings.soundPreset);
    }
  }, [isOpen, settings.soundEnabled, settings.soundOnOpen, settings.soundVolume, settings.soundPreset]);

  // Load readIds from localStorage
  const savedRead = typeof window !== 'undefined' ? localStorage.getItem(`notif_read_`) : null;
  const currentReadList: string[] = savedRead ? JSON.parse(savedRead) : [];

  const filteredReminders = reminders.filter(item => {
    if (filterType === 'high') return item.category === 'high';
    if (filterType === 'hatch') return item.type.startsWith('hatch') || item.type === 'candle' || item.type === 'milestone';
    if (filterType === 'pairing') return item.type === 'no-clutch' || item.id.includes('pairing');
    return true;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'high':
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1">🔴 Prioritas Tinggi</span>;
      case 'important':
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">🟠 Penting</span>;
      case 'info':
      default:
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">🟢 Info Farm</span>;
    }
  };

  const getReminderIcon = (type: string, id: string) => {
    const className = "w-5 h-5";
    if (id.includes('pairing-check-10-12') || id.includes('pairing-next-clutch-10-12')) {
      return <Heart className={`${className} text-amber-500`} />;
    }
    switch (type) {
      case 'hatch-today':
        return <Egg className={`${className} text-emerald-500`} />;
      case 'hatch-soon':
        return <Calendar className={`${className} text-blue-500`} />;
      case 'hatch-overdue':
        return <AlertTriangle className={`${className} text-rose-500`} />;
      case 'no-clutch':
        return <Heart className={`${className} text-pink-500`} />;
      case 'candle':
        return <Flame className={`${className} text-amber-500`} />;
      case 'milestone':
        return <Sparkles className={`${className} text-violet-500`} />;
      case 'premium':
        return <Sparkles className={`${className} text-amber-500`} />;
      case 'finance':
        return <CircleDollarSign className={`${className} text-teal-500`} />;
      default:
        return <Bell className={`${className} text-slate-500`} />;
    }
  };

  const handleAction = (item: ReminderItem) => {
    markAsRead(item.id);
    navigate(item.actionPath);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-50 transition-opacity"
          />

          {/* Slide-over Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col h-full border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">Notification Center</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {unreadCount > 0 ? `${unreadCount} Belum Dibaca` : 'Semua Sudah Dibaca'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sound quick toggle */}
                  <button 
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    title={settings.soundEnabled ? "Suara Bel Aktif (Klik untuk Mute)" : "Suara Bel Nonaktif (Klik untuk Aktifkan)"}
                    className={`p-2 rounded-xl transition-all border ${
                      settings.soundEnabled 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  {/* Sound options panel toggle */}
                  <button
                    onClick={() => setShowSoundConfig(!showSoundConfig)}
                    title="Pengaturan Opsi Suara Bel (On/Off)"
                    className={`p-2 rounded-xl transition-all border ${
                      showSoundConfig 
                        ? 'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-400/20' 
                        : 'hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  {/* Test Bell Sound Button */}
                  <button 
                    onClick={() => playTestSound()}
                    title="Uji Suara Bel Sekali Bunyi"
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 text-slate-500 hover:text-slate-700 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-slate-500" />
                  </button>

                  {/* Close button */}
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 text-slate-400 hover:text-slate-600 active:scale-95 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Sound Settings Box */}
              {showSoundConfig && (
                <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      Opsi Suara Bel Notifikasi
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      settings.soundEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {settings.soundEnabled ? 'Aktif' : 'Muted'}
                    </span>
                  </div>

                  {/* Master switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">Master Suara Bel</div>
                      <div className="text-[9px] text-slate-400">Aktifkan atau matikan seluruh bel suara</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Condition 1: Sound on Open */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">Saat Laci Notifikasi Dibuka</div>
                      <div className="text-[9px] text-slate-400">Bel berbunyi sekali saat drawer dibuka</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ soundOnOpen: !settings.soundOnOpen })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        settings.soundOnOpen ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        settings.soundOnOpen ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Condition 2: Sound on New Reminder */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">Saat Reminder Baru Muncul</div>
                      <div className="text-[9px] text-slate-400">Bel berbunyi jika ada reminder baru saat aktif</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSettings({ soundOnNewReminder: !settings.soundOnNewReminder })}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                        settings.soundOnNewReminder ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        settings.soundOnNewReminder ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Sound Presets */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pilihan Suara Bel</span>
                      <span className="text-[9px] text-amber-600 font-bold">8 Pilihan Nada</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {SOUND_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            updateSettings({ soundPreset: preset.id });
                            playTestSound(preset.id);
                          }}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            settings.soundPreset === preset.id
                              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                              : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-800 leading-none">{preset.label}</div>
                          <div className="text-[8px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volume Slider & Test Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={settings.soundVolume ?? 0.7}
                        onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                        onMouseUp={() => playTestSound()}
                        onTouchEnd={() => playTestSound()}
                        className="w-full accent-amber-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-600 shrink-0">
                        {Math.round((settings.soundVolume ?? 0.7) * 100)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => playTestSound()}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-slate-700" />
                      Tes
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar & Filter Chips */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      filterType === 'all' 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({reminders.length})
                  </button>
                  <button
                    onClick={() => setFilterType('high')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      filterType === 'high' 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'
                    }`}
                  >
                    Prioritas ({reminders.filter(r => r.category === 'high').length})
                  </button>
                  <button
                    onClick={() => setFilterType('pairing')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      filterType === 'pairing' 
                        ? 'bg-amber-600 text-white shadow-sm' 
                        : 'bg-white text-amber-700 border border-amber-100 hover:bg-amber-50'
                    }`}
                  >
                    Pairing ({reminders.filter(r => r.type === 'no-clutch' || r.id.includes('pairing')).length})
                  </button>
                  <button
                    onClick={() => setFilterType('hatch')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      filterType === 'hatch' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50'
                    }`}
                  >
                    Inkubator ({reminders.filter(r => r.type.startsWith('hatch') || r.type === 'candle').length})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    title="Tandai semua telah dibaca"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-2.5 py-1 rounded-lg transition-all shrink-0 active:scale-95"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Baca Semua</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reminders List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {filteredReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <BellOff className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada pengingat!</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mt-1">
                      Semua agenda farm Anda terpantau aman dan rapi.
                    </p>
                  </div>
                </div>
              ) : (
                filteredReminders.map((item) => {
                  const isUnread = !currentReadList.includes(item.id);

                  return (
                    <motion.div 
                      key={item.id}
                      layoutId={`reminder-card-${item.id}`}
                      className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-3 ${
                        isUnread 
                          ? 'bg-emerald-50/15 border-emerald-200 hover:border-emerald-300 hover:shadow-md' 
                          : 'bg-white border-slate-150 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Unread strip */}
                      {isUnread && (
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                      )}

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner shrink-0">
                            {getReminderIcon(item.type, item.id)}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 block">
                              {item.date}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {isUnread ? (
                            <button 
                              onClick={() => markAsRead(item.id)}
                              title="Tandai Sudah Dibaca"
                              className="px-2 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-slate-200 hover:border-emerald-200 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Baca</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteReminder(item.id)}
                              title="Hapus Notifikasi Ini"
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 font-medium leading-relaxed pl-1">
                        {item.description}
                      </p>

                      {/* Footer Row with Badges and Actions */}
                      <div className="flex items-center justify-between mt-1 border-t border-slate-100 pt-2.5">
                        {getCategoryBadge(item.category)}
                        
                        <button 
                          onClick={() => handleAction(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                        >
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
