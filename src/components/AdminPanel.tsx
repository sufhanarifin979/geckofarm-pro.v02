import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, registerListener, auth, getCachedAdminUsers, setCachedAdminUsers, clearCachedAdminUsers } from '../lib/firebase';
import { UserProfile } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Zap, 
  Search, 
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  User as UserIcon,
  Loader2,
  Mail,
  Calendar,
  Layers,
  BookOpen,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminEncyclopedia from './AdminEncyclopedia';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'encyclopedia'>('users');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Premium management states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalSubscription, setModalSubscription] = useState<'free' | 'premium'>('free');
  const [modalActivatedDate, setModalActivatedDate] = useState('');
  const [modalExpiresDate, setModalExpiresDate] = useState('');

  // Date helper functions
  const getTodayString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFutureDateString = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateToInput = (timestamp: any): string => {
    if (!timestamp) return '';
    let d: Date;
    if (typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      d = new Date(timestamp.seconds * 1000);
    } else {
      d = new Date(timestamp);
    }
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Try memory cache first
    const memCache = getCachedAdminUsers();
    if (memCache && memCache.length > 0) {
      setProfiles(memCache as UserProfile[]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    getDocs(q).then((snapshot) => {
      const profileData = snapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() 
      } as UserProfile));
      setProfiles(profileData);
      setCachedAdminUsers(profileData);
      setLoading(false);
    }).catch((error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });
  }, []);

  const handleRefreshUsers = async () => {
    setLoading(true);
    clearCachedAdminUsers();
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const profileData = snapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() 
      } as UserProfile));
      setProfiles(profileData);
      setCachedAdminUsers(profileData);
    } catch (error) {
      console.error("Error refreshing users list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManageModal = (user: UserProfile) => {
    setSelectedUser(user);
    setModalSubscription(user.subscription);
    
    const isMigration = user.subscription === 'premium' && (!user.premiumActivatedAt || !user.premiumExpiresAt);
    
    if (user.subscription === 'premium' && !isMigration) {
      setModalActivatedDate(formatDateToInput(user.premiumActivatedAt));
      setModalExpiresDate(formatDateToInput(user.premiumExpiresAt));
    } else {
      setModalActivatedDate(getTodayString());
      setModalExpiresDate(getFutureDateString(365));
    }
  };

  const handleSubscriptionChange = (newSub: 'free' | 'premium') => {
    setModalSubscription(newSub);
    if (newSub === 'premium' && (!modalActivatedDate || !modalExpiresDate)) {
      setModalActivatedDate(getTodayString());
      setModalExpiresDate(getFutureDateString(365));
    }
  };

  const handleSaveSubscription = async () => {
    if (!selectedUser) return;
    setUpdatingId(selectedUser.uid);
    try {
      let finalActivated: any = null;
      let finalExpired: any = null;

      if (modalSubscription === 'premium') {
        finalActivated = new Date(modalActivatedDate + "T00:00:00");
        finalExpired = new Date(modalExpiresDate + "T23:59:59");
        
        try {
          localStorage.removeItem(`premium_expired_notified_${selectedUser.uid}`);
        } catch (e) {}

        await updateDoc(doc(db, 'users', selectedUser.uid), {
          subscription: 'premium',
          planLimit: 10000,
          premiumActivatedAt: finalActivated,
          premiumExpiresAt: finalExpired
        });
      } else {
        await updateDoc(doc(db, 'users', selectedUser.uid), {
          subscription: 'free',
          planLimit: 10,
          premiumActivatedAt: null,
          premiumExpiresAt: null
        });
      }
      
      // Update local state profiles array
      setProfiles(prev => prev.map(p => {
        if (p.uid === selectedUser.uid) {
          return {
            ...p,
            subscription: modalSubscription,
            planLimit: modalSubscription === 'premium' ? 10000 : 10,
            premiumActivatedAt: finalActivated,
            premiumExpiresAt: finalExpired
          };
        }
        return p;
      }));

      clearCachedAdminUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to save subscription update:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.farmName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.subscription === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: profiles.length,
    premium: profiles.filter(p => p.subscription === 'premium').length,
    free: profiles.filter(p => p.subscription === 'free').length
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Admin Infrastructure Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Admin Console</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage user subscriptions and global research data.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
           <button 
             onClick={() => setActiveTab('users')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'users' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'
             }`}
           >
             <Users size={14} />
             Members
           </button>
           <button 
             onClick={() => setActiveTab('encyclopedia')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               activeTab === 'encyclopedia' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400'
             }`}
           >
             <BookOpen size={14} />
             Encyclopedia
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Total Users', value: stats.total, icon: Users, color: 'text-slate-600' },
                { label: 'Premium', value: stats.premium, icon: Zap, color: 'text-emerald-500' },
                { label: 'Free Tier', value: stats.free, icon: Layers, color: 'text-blue-400' },
              ].map((stat, i) => (
                <div key={i} className="flex-1 min-w-[120px] bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{stat.label}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search by email or farm name..."
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:border-emerald-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                {(['all', 'free', 'premium'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === f 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefreshUsers}
                disabled={loading}
                className="flex items-center justify-center p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 cursor-pointer h-[54px] w-[54px]"
                title="Refresh Member List"
              >
                <RotateCw size={18} className={loading ? "animate-spin text-emerald-500" : ""} />
              </button>
            </div>

            {/* User List Table (Desktop View for Admin is usually better) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Farm / User</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {filteredProfiles.map((p) => (
                      <motion.tr 
                        key={p.uid} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-white dark:border-slate-700 shadow-sm">
                              {p.farmPhotoUrl ? (
                                <img src={p.farmPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon className="text-slate-300" size={20} />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white uppercase">{p.farmName || 'Unnamed Farm'}</span>
                              <span className="text-[10px] font-medium text-slate-400">{p.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest w-max ${
                              p.subscription === 'premium' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {p.subscription}
                            </span>
                            {p.subscription === 'premium' && (!p.premiumActivatedAt || !p.premiumExpiresAt) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[7px] font-bold text-amber-700 bg-amber-50 border border-amber-100 uppercase tracking-tight w-max animate-pulse">
                                Migration Required
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="flex flex-col gap-1 w-24">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{p.geckoCount} / {p.planLimit}</span>
                              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${(p.geckoCount / p.planLimit) * 100}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="p-6 text-right">
                          {p.subscription === 'premium' && (!p.premiumActivatedAt || !p.premiumExpiresAt) ? (
                            <button
                              onClick={() => handleOpenManageModal(p)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/10"
                            >
                              Update Premium Date
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenManageModal(p)}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                p.subscription === 'premium'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                              }`}
                            >
                              {p.subscription === 'premium' ? 'Manage' : 'Upgrade Premium'}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="encyclopedia-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminEncyclopedia />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Subscription Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 max-w-md w-full relative space-y-6"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white uppercase">Premium Subscription</h3>
                  <p className="text-[10px] font-medium text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* User Farm Details Info */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {selectedUser.farmPhotoUrl ? (
                    <img src={selectedUser.farmPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={18} className="text-slate-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-white">{selectedUser.farmName || 'Unnamed Farm'}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Geckos: {selectedUser.geckoCount}</span>
                </div>
              </div>

              {/* Subscription Option Selector */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Tier</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubscriptionChange('free')}
                    className={`p-4 rounded-2xl border font-black text-[10px] uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                      modalSubscription === 'free'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">○</span>
                    Free Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubscriptionChange('premium')}
                    className={`p-4 rounded-2xl border font-black text-[10px] uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                      modalSubscription === 'premium'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">●</span>
                    Premium Pro
                  </button>
                </div>
              </div>

              {/* Date Pickers (only for premium) */}
              {modalSubscription === 'premium' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Activated Date</label>
                      <input
                        type="date"
                        value={modalActivatedDate}
                        onChange={(e) => setModalActivatedDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Expired Date</label>
                      <input
                        type="date"
                        value={modalExpiresDate}
                        onChange={(e) => setModalExpiresDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setModalActivatedDate(getTodayString());
                        setModalExpiresDate(getFutureDateString(365));
                      }}
                      className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1"
                    >
                      Reset to 1 Year
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingId !== null || (modalSubscription === 'premium' && (!modalActivatedDate || !modalExpiresDate))}
                  onClick={handleSaveSubscription}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingId !== null ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

