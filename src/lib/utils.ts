import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format date string strictly to DD/MM/YYYY (Hari/Bulan/Tahun)
 * Prevents timezone shifting issues on YYYY-MM-DD strings.
 */
export function formatDateDMY(dateString?: string): string {
  if (!dateString) return '-';
  const clean = String(dateString).trim();
  if (!clean || clean === 'Unknown' || clean === 'N/A' || clean === '-') return '-';

  // Check if string matches YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(clean);
  if (isNaN(d.getTime())) return clean;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Resolves parent lineage morph and gecko name.
 * If both morph and gecko name are present and distinct, formats as "MORPH (NAME)".
 * Otherwise returns whichever is available or '-'.
 */
export function getParentLineageDisplay(
  parentType: 'sire' | 'dam',
  gecko?: { sireId?: string; damId?: string; sireName?: string; damName?: string; sireMorph?: string; damMorph?: string } | null,
  allGeckos?: Array<{ id?: string; name: string; morph: string }>
): { morph: string; name: string; display: string } {
  if (!gecko) {
    return { morph: '', name: '', display: '-' };
  }

  const isSire = parentType === 'sire';
  const parentId = isSire ? gecko.sireId : gecko.damId;
  const directName = (isSire ? gecko.sireName : gecko.damName)?.trim() || '';
  const directMorph = (isSire ? gecko.sireMorph : gecko.damMorph)?.trim() || '';

  let foundParent = allGeckos && parentId ? allGeckos.find(g => g.id === parentId) : null;
  if (!foundParent && allGeckos && directName) {
    foundParent = allGeckos.find(g => g.name && g.name.toLowerCase() === directName.toLowerCase()) || null;
  }

  const morph = directMorph || foundParent?.morph?.trim() || '';
  const name = directName || foundParent?.name?.trim() || '';

  let display = '-';
  if (morph && name && morph.toLowerCase() !== name.toLowerCase()) {
    display = `${morph} (${name})`;
  } else if (morph) {
    display = morph;
  } else if (name) {
    display = name;
  }

  return { morph, name, display };
}
