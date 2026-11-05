import { UserProfile } from '../types';

export const ADMIN_EMAIL = 'sufhan.arifin979@gmail.com';

export function isUserAdmin(profile: UserProfile | null | undefined): boolean {
  return !!profile?.email && profile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function getSubscriptionExpiryDate(profile: UserProfile | null | undefined): Date | null {
  if (!profile?.premiumExpiresAt) return null;
  const raw = profile.premiumExpiresAt;
  let date: Date | null = null;

  if (typeof raw?.toDate === 'function') {
    date = raw.toDate();
  } else if (typeof raw?.seconds === 'number') {
    date = new Date(raw.seconds * 1000);
  } else if (typeof raw?._seconds === 'number') {
    date = new Date(raw._seconds * 1000);
  } else if (raw instanceof Date) {
    date = raw;
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    date = new Date(raw);
  }

  if (!date || isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validates whether a user currently holds an active, non-expired Premium subscription.
 * Matches Firestore Security Rules (`subscription == 'premium'` && `premiumExpiresAt > request.time`).
 */
export function isSubscriptionActive(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  if (isUserAdmin(profile)) return true;
  if (profile.subscription !== 'premium') return false;

  const expiry = getSubscriptionExpiryDate(profile);
  if (!expiry) return false;

  return expiry.getTime() > Date.now();
}

export function isSubscriptionExpired(profile: UserProfile | null | undefined): boolean {
  if (!profile || isUserAdmin(profile)) return false;
  const expiry = getSubscriptionExpiryDate(profile);
  if (!expiry) return false;
  return expiry.getTime() <= Date.now();
}
