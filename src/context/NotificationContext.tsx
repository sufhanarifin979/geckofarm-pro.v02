import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useGeckos } from '../GeckoProvider';
import { UserProfile, Clutch, Pairing, FinanceTransaction } from '../types';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';

export interface ReminderItem {
  id: string;
  type: 'hatch-today' | 'hatch-soon' | 'hatch-overdue' | 'no-clutch' | 'candle' | 'milestone' | 'premium' | 'finance';
  category: 'high' | 'important' | 'info';
  title: string;
  description: string;
  date: string;
  actionLabel: string;
  actionPath: string;
}

export interface NotificationSettings {
  hatchReminder: boolean;
  candleReminder: boolean;
  premiumReminder: boolean;
  financeReminder: boolean;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  reminders: ReminderItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  deleteReminder: (id: string) => void;
  premiumDaysLeft: number;
  upcomingHatchCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_SETTINGS: NotificationSettings = {
  hatchReminder: true,
  candleReminder: true,
  premiumReminder: true,
  financeReminder: true,
};

export function NotificationProvider({ profile, children }: { profile: UserProfile | null, children: React.ReactNode }) {
  const { pairings, clutches } = useGeckos();

  // Load settings from localStorage
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (!profile?.uid) return DEFAULT_SETTINGS;
    const saved = localStorage.getItem(`notif_settings_${profile.uid}`);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Load read/deleted lists from localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (!profile?.uid) return [];
    const saved = localStorage.getItem(`notif_read_${profile.uid}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    if (!profile?.uid) return [];
    const saved = localStorage.getItem(`notif_deleted_${profile.uid}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Track settings, readIds, and deletedIds across logins
  useEffect(() => {
    if (profile?.uid) {
      const savedSettings = localStorage.getItem(`notif_settings_${profile.uid}`);
      setSettings(savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS);

      const savedRead = localStorage.getItem(`notif_read_${profile.uid}`);
      setReadIds(savedRead ? JSON.parse(savedRead) : []);

      const savedDeleted = localStorage.getItem(`notif_deleted_${profile.uid}`);
      setDeletedIds(savedDeleted ? JSON.parse(savedDeleted) : []);
    }
  }, [profile?.uid]);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (profile?.uid) {
        localStorage.setItem(`notif_settings_${profile.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (profile?.uid) {
        localStorage.setItem(`notif_read_${profile.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteReminder = (id: string) => {
    setDeletedIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (profile?.uid) {
        localStorage.setItem(`notif_deleted_${profile.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Calculate Premium Days Left (stable countdown dynamically computed from profile.premiumExpiresAt)
  const premiumDaysLeft = useMemo(() => {
    if (profile?.subscription !== 'premium') return 0;
    if (!profile?.premiumExpiresAt) return 365; // default fallback if dates aren't migrated yet
    try {
      let expiryDate: Date;
      if (typeof profile.premiumExpiresAt.toDate === 'function') {
        expiryDate = profile.premiumExpiresAt.toDate();
      } else if (profile.premiumExpiresAt.seconds !== undefined) {
        expiryDate = new Date(profile.premiumExpiresAt.seconds * 1000);
      } else {
        expiryDate = new Date(profile.premiumExpiresAt);
      }
      
      if (isNaN(expiryDate.getTime())) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryMidnight = new Date(expiryDate);
      expiryMidnight.setHours(23, 59, 59, 999);
      
      const diffMs = expiryMidnight.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  }, [profile]);

  // Read transactions cache from localStorage for Finance Reminder
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  useEffect(() => {
    if (!profile?.uid) {
      setTransactions([]);
      return;
    }
    const loadCache = () => {
      const cached = localStorage.getItem(`cache_transactions_${profile.uid}`);
      if (cached) {
        try {
          setTransactions(JSON.parse(cached));
        } catch (e) {}
      }
    };
    loadCache();
    // Listen for localstorage changes so we sync instantly when transactions are added
    const handleStorageChange = () => {
      loadCache();
    };
    window.addEventListener('storage', handleStorageChange);
    // Also poll/load cache every 2 seconds to capture same-page updates instantly
    const interval = setInterval(loadCache, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [profile?.uid]);

  // Calculate reminders dynamically on-the-fly
  const reminders = useMemo(() => {
    if (!profile?.uid) return [];

    const calculated: ReminderItem[] = [];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. Hatch Reminders (Hatch Today, Hatch Soon, Hatch Overdue, Pairing Without Clutch)
    if (settings.hatchReminder) {
      clutches.forEach(c => {
        const isIncubating = (c.hatchedCount + (c.failedCount || 0)) < c.eggCount;
        if (!isIncubating || !c.hatchDate) return;

        try {
          const hatchDate = parseISO(c.hatchDate);
          const daysDiff = differenceInDays(hatchDate, today);

          const pairing = pairings.find(p => p.id === c.pairingId);
          const sireName = pairing?.sireName || 'Sire';
          const damName = pairing?.damName || 'Dam';

          // Hatch Today
          if (c.hatchDate === todayStr || daysDiff === 0) {
            calculated.push({
              id: `hatch-today-${c.id || c.clutchNumber}`,
              type: 'hatch-today',
              category: 'high',
              title: '🥚 Hatch Today',
              description: `Clutch #${c.clutchNumber} — ${sireName} × ${damName}. Estimated hatch is today.`,
              date: format(hatchDate, 'MMM d, yyyy'),
              actionLabel: 'Open Incubator',
              actionPath: '/incubator',
            });
          }
          // Hatch Soon (1 to 3 days in future)
          else if (daysDiff > 0 && daysDiff <= 3) {
            calculated.push({
              id: `hatch-soon-${c.id || c.clutchNumber}-${daysDiff}`,
              type: 'hatch-soon',
              category: 'high',
              title: `🥚 Hatch in ${daysDiff} Days`,
              description: `Clutch #${c.clutchNumber} — ${sireName} × ${damName}.`,
              date: format(hatchDate, 'MMM d, yyyy'),
              actionLabel: 'Open Incubator',
              actionPath: '/incubator',
            });
          }
          // Hatch Overdue (> 5 days in past)
          else if (daysDiff < -5) {
            calculated.push({
              id: `hatch-overdue-${c.id || c.clutchNumber}`,
              type: 'hatch-overdue',
              category: 'high',
              title: '⚠ Hatch Overdue',
              description: `Clutch #${c.clutchNumber} — ${sireName} × ${damName}. Please check incubation.`,
              date: format(hatchDate, 'MMM d, yyyy'),
              actionLabel: 'Open Incubator',
              actionPath: '/incubator',
            });
          }
        } catch (err) {}
      });

      // Pairing Without Clutch (active > 45 days but 0 clutches)
      pairings.forEach(p => {
        const isActive = p.status === 'active' || !p.status;
        if (!isActive || p.clutchCount > 0) return;

        try {
          const pairingDate = parseISO(p.pairingDate);
          const daysActive = differenceInDays(today, pairingDate);

          if (daysActive > 45) {
            calculated.push({
              id: `pairing-no-clutch-${p.id}`,
              type: 'no-clutch',
              category: 'high',
              title: '❤ No Clutch Yet',
              description: `${p.sireName || 'Male'} × ${p.damName || 'Female'} has been active for ${daysActive} days without clutch.`,
              date: format(pairingDate, 'MMM d, yyyy'),
              actionLabel: 'Open Pair',
              actionPath: '/breeding',
            });
          }
        } catch (err) {}
      });
    }

    // 2. Candle Reminders & Milestones (Candle Reminder, Incubation Milestone)
    if (settings.candleReminder) {
      clutches.forEach(c => {
        const isIncubating = (c.hatchedCount + (c.failedCount || 0)) < c.eggCount;
        if (!isIncubating) return;

        try {
          const layDate = parseISO(c.layDate);
          const incubationDays = differenceInDays(today, layDate);

          const pairing = pairings.find(p => p.id === c.pairingId);
          const sireName = pairing?.sireName || 'Sire';
          const damName = pairing?.damName || 'Dam';

          // Candle Reminder (Days 14, 30)
          if ([14, 30].includes(incubationDays)) {
            calculated.push({
              id: `candle-${incubationDays}-${c.id || c.clutchNumber}`,
              type: 'candle',
              category: 'important',
              title: '🔦 Time to Candle Eggs',
              description: `Clutch #${c.clutchNumber} — ${sireName} × ${damName} is on incubation day ${incubationDays}.`,
              date: format(layDate, 'MMM d, yyyy'),
              actionLabel: 'Open Incubator',
              actionPath: '/incubator',
            });
          }

          // Incubation Milestone (Days 30, 45, 60)
          if ([30, 45, 60].includes(incubationDays)) {
            calculated.push({
              id: `milestone-${incubationDays}-${c.id || c.clutchNumber}`,
              type: 'milestone',
              category: 'important',
              title: '🎉 Incubation Milestone',
              description: `Egg incubation reached milestone of ${incubationDays} days for Clutch #${c.clutchNumber}.`,
              date: format(layDate, 'MMM d, yyyy'),
              actionLabel: 'Open Incubator',
              actionPath: '/incubator',
            });
          }
        } catch (err) {}
      });
    }

    // 3. Premium Reminders (Premium Expiring soon or Expired)
    if (settings.premiumReminder) {
      if (profile?.subscription === 'premium') {
        const daysLeft = premiumDaysLeft;
        if (daysLeft === 7) {
          calculated.push({
            id: 'premium-expiring-7',
            type: 'premium',
            category: 'important',
            title: '⭐ Premium Expires Soon',
            description: `Masa Premium Anda tersisa 7 hari lagi.`,
            date: format(today, 'MMM d, yyyy'),
            actionLabel: 'Contact Admin',
            actionPath: '/settings',
          });
        } else if (daysLeft === 3) {
          calculated.push({
            id: 'premium-expiring-3',
            type: 'premium',
            category: 'high',
            title: '⚠ Premium Expires Soon',
            description: `Masa Premium Anda tersisa 3 hari lagi.`,
            date: format(today, 'MMM d, yyyy'),
            actionLabel: 'Contact Admin',
            actionPath: '/settings',
          });
        } else if (daysLeft === 1) {
          calculated.push({
            id: 'premium-expiring-1',
            type: 'premium',
            category: 'high',
            title: '🚨 Premium Ends Tomorrow',
            description: `Besok Premium berakhir.`,
            date: format(today, 'MMM d, yyyy'),
            actionLabel: 'Contact Admin',
            actionPath: '/settings',
          });
        } else if (daysLeft > 0 && daysLeft <= 7) {
          calculated.push({
            id: `premium-expiring-${daysLeft}`,
            type: 'premium',
            category: 'info',
            title: '⭐ Premium Expires Soon',
            description: `Masa Premium Anda tersisa ${daysLeft} hari lagi.`,
            date: format(today, 'MMM d, yyyy'),
            actionLabel: 'Contact Admin',
            actionPath: '/settings',
          });
        }
      } else if (profile?.subscription === 'free') {
        const isNotifiedExpired = localStorage.getItem(`premium_expired_notified_${profile.uid}`) === 'true';
        if (isNotifiedExpired) {
          calculated.push({
            id: 'premium-expired-notif',
            type: 'premium',
            category: 'high',
            title: '🚨 Premium Expired',
            description: 'Masa Premium telah berakhir.',
            date: format(today, 'MMM d, yyyy'),
            actionLabel: 'Contact Admin',
            actionPath: '/settings',
          });
        }
      }
    }

    // 4. Monthly Finance Reminders
    if (settings.financeReminder && transactions.length > 0) {
      const currentMonth = format(today, 'yyyy-MM');
      const hasTransactionsThisMonth = transactions.some(t => t.date && t.date.startsWith(currentMonth));

      if (!hasTransactionsThisMonth) {
        calculated.push({
          id: `finance-reminder-${currentMonth}`,
          type: 'finance',
          category: 'info',
          title: '📊 Record Monthly Finance',
          description: `Don't forget to record your finance for ${format(today, 'MMMM yyyy')}.`,
          date: format(today, 'MMM d, yyyy'),
          actionLabel: 'Open Finance',
          actionPath: '/finance',
        });
      }
    }

    // Filter out deleted reminders
    const visible = calculated.filter(item => !deletedIds.includes(item.id));

    // Sort by Category priority: high (🔴 Red) -> important (🟠 Orange) -> info (🟢 Green)
    const priorityOrder = { high: 1, important: 2, info: 3 };
    visible.sort((a, b) => priorityOrder[a.category] - priorityOrder[b.category]);

    return visible;
  }, [profile?.uid, clutches, pairings, settings, deletedIds, transactions, premiumDaysLeft]);

  // Calculate upcoming hatch count dynamically for the dashboard widget
  const upcomingHatchCount = useMemo(() => {
    return clutches.filter(c => {
      const isIncubating = (c.hatchedCount + (c.failedCount || 0)) < c.eggCount;
      if (!isIncubating || !c.hatchDate) return false;
      try {
        const hatchDate = parseISO(c.hatchDate);
        const daysDiff = differenceInDays(hatchDate, new Date());
        return daysDiff >= 0 && daysDiff <= 3;
      } catch (e) {
        return false;
      }
    }).length;
  }, [clutches]);

  // Count unread reminders (those not in readIds)
  const unreadCount = useMemo(() => {
    return reminders.filter(item => !readIds.includes(item.id)).length;
  }, [reminders, readIds]);

  return (
    <NotificationContext.Provider value={{
      settings,
      updateSettings,
      reminders,
      unreadCount,
      markAsRead,
      deleteReminder,
      premiumDaysLeft,
      upcomingHatchCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
