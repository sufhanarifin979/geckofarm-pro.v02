export interface LessonQuizResult {
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface UserLearningProgress {
  completedGuideIds: string[];
  bookmarkedGuideIds: string[];
  quizResults: Record<string, LessonQuizResult>;
  lastReadGuideId?: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'gfp_genetics_progress_v1_';

function getStorageKey(uid: string | undefined | null): string {
  const safeUid = (uid && uid.trim().length > 0) ? uid.trim() : 'guest';
  return `${STORAGE_PREFIX}${safeUid}`;
}

function createDefaultProgress(): UserLearningProgress {
  return {
    completedGuideIds: [],
    bookmarkedGuideIds: [],
    quizResults: {},
    updatedAt: new Date().toISOString()
  };
}

export function getLearningProgress(uid: string | undefined | null): UserLearningProgress {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw);
    return {
      completedGuideIds: Array.isArray(parsed?.completedGuideIds) ? parsed.completedGuideIds : [],
      bookmarkedGuideIds: Array.isArray(parsed?.bookmarkedGuideIds) ? parsed.bookmarkedGuideIds : [],
      quizResults: parsed?.quizResults && typeof parsed.quizResults === 'object' ? parsed.quizResults : {},
      lastReadGuideId: typeof parsed?.lastReadGuideId === 'string' ? parsed.lastReadGuideId : undefined,
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return createDefaultProgress();
  }
}

function saveLearningProgress(uid: string | undefined | null, progress: UserLearningProgress): UserLearningProgress {
  const next: UserLearningProgress = {
    ...progress,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(next));
  } catch (e) {
    console.warn('Gagal menyimpan progres belajar lokal:', e);
  }
  return next;
}

export function toggleGuideCompleted(
  uid: string | undefined | null,
  guideId: string,
  forceState?: boolean
): UserLearningProgress {
  const current = getLearningProgress(uid);
  const exists = current.completedGuideIds.includes(guideId);
  const shouldComplete = forceState !== undefined ? forceState : !exists;

  const completedGuideIds = shouldComplete
    ? (exists ? current.completedGuideIds : [...current.completedGuideIds, guideId])
    : current.completedGuideIds.filter(id => id !== guideId);

  return saveLearningProgress(uid, {
    ...current,
    completedGuideIds
  });
}

export function toggleGuideBookmarked(
  uid: string | undefined | null,
  guideId: string
): UserLearningProgress {
  const current = getLearningProgress(uid);
  const exists = current.bookmarkedGuideIds.includes(guideId);
  const bookmarkedGuideIds = exists
    ? current.bookmarkedGuideIds.filter(id => id !== guideId)
    : [...current.bookmarkedGuideIds, guideId];

  return saveLearningProgress(uid, {
    ...current,
    bookmarkedGuideIds
  });
}

export function saveGuideQuizResult(
  uid: string | undefined | null,
  guideId: string,
  score: number,
  total: number
): UserLearningProgress {
  const current = getLearningProgress(uid);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const completedGuideIds = current.completedGuideIds.includes(guideId)
    ? current.completedGuideIds
    : [...current.completedGuideIds, guideId];

  return saveLearningProgress(uid, {
    ...current,
    completedGuideIds,
    quizResults: {
      ...current.quizResults,
      [guideId]: {
        score,
        total,
        percentage,
        completedAt: new Date().toISOString()
      }
    }
  });
}

export function markLastReadGuide(
  uid: string | undefined | null,
  guideId: string
): UserLearningProgress {
  const current = getLearningProgress(uid);
  return saveLearningProgress(uid, {
    ...current,
    lastReadGuideId: guideId
  });
}

export function resetLearningProgress(uid: string | undefined | null): UserLearningProgress {
  const empty = createDefaultProgress();
  try {
    localStorage.removeItem(getStorageKey(uid));
  } catch {}
  return empty;
}
