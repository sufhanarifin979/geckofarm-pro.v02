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
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { reminders, unreadCount, markAsRead, deleteReminder } = useNotifications();
  const navigate = useNavigate();

  // Load readIds to check read/unread state visually
  const readIds = JSON.parse(localStorage.getItem(`notif_read_`) || '[]');

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'high':
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1">🔴 High Priority</span>;
      case 'important':
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">🟠 Important</span>;
      case 'info':
      default:
        return <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">🟢 Information</span>;
    }
  };

  const getReminderIcon = (type: string) => {
    const className = "w-5 h-5";
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
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Notification Center</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {unreadCount} Unread Reminders
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-150 rounded-full transition-colors border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <BellOff className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">All caught up!</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[200px] mt-1">
                      No active reminders right now. Your farm is running smoothly!
                    </p>
                  </div>
                </div>
              ) : (
                reminders.map((item) => {
                  // Determine if unread
                  const savedRead = localStorage.getItem(`notif_read_`);
                  const currentReadList: string[] = savedRead ? JSON.parse(savedRead) : [];
                  const isUnread = !currentReadList.includes(item.id);

                  return (
                    <motion.div 
                      key={item.id}
                      layoutId={`reminder-card-${item.id}`}
                      className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col gap-3 ${
                        isUnread 
                          ? 'bg-emerald-50/10 border-emerald-100/50 hover:border-emerald-200 hover:shadow-md' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      {/* Unread glow border */}
                      {isUnread && (
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                      )}

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                            {getReminderIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                              {item.title}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                              {item.date}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {isUnread ? (
                            <button 
                              onClick={() => markAsRead(item.id)}
                              title="Mark as Read"
                              className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 active:scale-90 flex items-center gap-1"
                            >
                              <Check className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600">Mark as Read</span>
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              <Check className="w-3.5 h-3.5" /> Read
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-medium leading-relaxed pl-1">
                        {item.description}
                      </p>

                      {/* Footer Row with Badges and Actions */}
                      <div className="flex items-center justify-between mt-1 border-t border-slate-50 pt-3">
                        {getCategoryBadge(item.category)}
                        
                        <button 
                          onClick={() => handleAction(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                        >
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
