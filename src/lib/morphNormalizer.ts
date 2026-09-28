import { MorphEntry, GeneticWarning, MorphRarity } from '../types';

export const GENETIC_WARNING_TEMPLATES: Record<string, { title: string; description: string; type: 'genetic_warning' }> = {
  enigma: {
    title: 'Enigma Warning',
    description: 'Risiko Enigma Syndrome: gangguan neurologis bawaan (head tilting, circling, wobble, star-gazing). Gejala dapat memburuk saat stres atau penanganan berlebih.',
    type: 'genetic_warning'
  },
  lemon_frost: {
    title: 'Lemon Frost (LF) Warning',
    description: 'Risiko tinggi tumor kulit jinak maupun ganas (malignant melanoma / iridophoroma). Anakan membawa predisposisi genetik pembentukan nodul tumor.',
    type: 'genetic_warning'
  },
  white_yellow: {
    title: 'White & Yellow (WY) Warning',
    description: 'Risiko W&Y Syndrome: gejala disorientasi mirip sindrom Enigma pada beberapa bloodline, serta sensitivitas inkubasi suhu tinggi.',
    type: 'genetic_warning'
  },
  super_form_lethal: {
    title: 'Super Form Lethal Warning',
    description: 'Bentuk homozigot lethal (mati dalam telur / embrio gagal menetas), contoh: perkawinan Whiteout x Whiteout pada African Fat-Tailed Gecko.',
    type: 'genetic_warning'
  },
  custom: {
    title: 'Custom Warning',
    description: '',
    type: 'genetic_warning'
  }
};

export function normalizeCategories(catOrMorph: any): string[] {
  if (!catOrMorph) return ['Base'];
  const cat = typeof catOrMorph === 'object' && !Array.isArray(catOrMorph) 
    ? (catOrMorph.category ?? catOrMorph.categories) 
    : catOrMorph;
  if (Array.isArray(cat)) {
    const valid = cat.map(String).map(s => s.trim()).filter(Boolean);
    return valid.length > 0 ? valid : ['Base'];
  }
  if (typeof cat === 'string' && cat.trim()) {
    if (cat.includes(',')) {
      return cat.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [cat.trim()];
  }
  return ['Base'];
}

export function normalizeInheritance(inhOrMorph: any): string[] {
  if (!inhOrMorph) return ['Recessive'];
  const inh = typeof inhOrMorph === 'object' && !Array.isArray(inhOrMorph)
    ? (inhOrMorph.inheritance_type ?? inhOrMorph.inheritanceType)
    : inhOrMorph;
  if (Array.isArray(inh)) {
    const valid = inh.map(String).map(s => s.trim()).filter(Boolean);
    return valid.length > 0 ? valid : ['Recessive'];
  }
  if (typeof inh === 'string' && inh.trim()) {
    if (inh.includes(',')) {
      return inh.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [inh.trim()];
  }
  return ['Recessive'];
}

export function normalizeRarity(rOrMorph: any): 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' {
  const r = typeof rOrMorph === 'object' && rOrMorph !== null ? rOrMorph.rarity : rOrMorph;
  if (!r) return 'Common';
  if (r === 'Holy Grail') return 'Legendary';
  if (['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].includes(r)) return r;
  return 'Common';
}

export function normalizeGeneticFormula(morphOrFormula: any): string[] {
  if (!morphOrFormula) return [];
  if (Array.isArray(morphOrFormula)) {
    return morphOrFormula.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof morphOrFormula === 'string') {
    const str = morphOrFormula.trim();
    if (str.includes('+')) return str.split('+').map(s => s.trim()).filter(Boolean);
    if (str.includes(',') && !str.includes('/')) return str.split(',').map(s => s.trim()).filter(Boolean);
    return [str];
  }
  const morph = morphOrFormula;
  const f = morph.genetic_formula || morph.geneticFormula;
  if (Array.isArray(f) && f.length > 0) {
    return f.map(String).map(s => s.trim()).filter(Boolean);
  }
  const g = morph.genetics;
  if (Array.isArray(g) && g.length > 0) {
    return g.map(String).map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof g === 'string' && g.trim()) {
    const str = g.trim();
    if (str.includes('+')) return str.split('+').map(s => s.trim()).filter(Boolean);
    if (str.includes(',') && !str.includes('/')) return str.split(',').map(s => s.trim()).filter(Boolean);
    return [str];
  }
  return [];
}

function parseWarningString(text: string): GeneticWarning[] {
  if (text.includes(' | ')) {
    return text.split(' | ').flatMap(parseWarningString);
  }
  const lower = text.toLowerCase();
  let templateId = 'custom';
  let title = 'Custom Warning';

  if (lower.includes('enigma')) {
    templateId = 'enigma';
    title = 'Enigma Warning';
  } else if (lower.includes('lemon frost')) {
    templateId = 'lemon_frost';
    title = 'Lemon Frost (LF) Warning';
  } else if (lower.includes('white & yellow') || lower.includes('w&y') || lower.includes('white and yellow')) {
    templateId = 'white_yellow';
    title = 'White & Yellow (WY) Warning';
  } else if (lower.includes('lethal') || lower.includes('super form')) {
    templateId = 'super_form_lethal';
    title = 'Super Form Lethal Warning';
  }

  return [{
    templateId,
    title,
    description: text,
    type: 'genetic_warning'
  }];
}

export function normalizeGeneticWarnings(morphOrWarnings: any): GeneticWarning[] {
  if (!morphOrWarnings) return [];
  if (Array.isArray(morphOrWarnings)) {
    return morphOrWarnings.map((w: any) => {
      if (typeof w === 'object' && w) {
        return {
          templateId: w.templateId || 'custom',
          title: w.title || 'Genetic Warning',
          description: w.description || '',
          type: 'genetic_warning'
        };
      }
      return {
        templateId: 'custom',
        title: 'Custom Warning',
        description: String(w),
        type: 'genetic_warning'
      };
    });
  }
  if (typeof morphOrWarnings === 'string' && morphOrWarnings.trim()) {
    return parseWarningString(morphOrWarnings.trim());
  }
  const morph = morphOrWarnings;
  const gw = morph.genetic_warnings || morph.geneticWarnings;
  if (Array.isArray(gw) && gw.length > 0) {
    return gw.map((w: any) => ({
      templateId: w.templateId || 'custom',
      title: w.title || 'Genetic Warning',
      description: w.description || '',
      type: 'genetic_warning'
    }));
  }
  const w = morph.warnings;
  if (Array.isArray(w)) {
    return w.map((item: any) => {
      if (typeof item === 'object' && item) {
        return {
          templateId: item.templateId || 'custom',
          title: item.title || 'Genetic Warning',
          description: item.description || '',
          type: 'genetic_warning'
        };
      }
      return {
        templateId: 'custom',
        title: 'Custom Warning',
        description: String(item),
        type: 'genetic_warning'
      };
    });
  }
  if (typeof w === 'string' && w.trim()) {
    return parseWarningString(w.trim());
  }
  return [];
}

export function normalizeGeneticSignatures(morphOrSigs: any): string[] {
  if (!morphOrSigs) return [];
  if (Array.isArray(morphOrSigs)) {
    return morphOrSigs.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof morphOrSigs === 'string') {
    return morphOrSigs.split(',').map(s => s.trim()).filter(Boolean);
  }
  const morph = morphOrSigs;
  const sigs = morph.genetic_signatures || morph.geneticSignatures;
  if (Array.isArray(sigs) && sigs.length > 0) {
    return sigs.map(String).map(s => s.trim()).filter(Boolean);
  }
  const vt = morph.visual_traits || morph.visualTraits;
  if (Array.isArray(vt) && vt.length > 0) {
    return vt.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof vt === 'string') {
    return vt.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

export function normalizeComboPotential(morphOrCombos: any): string[] {
  if (!morphOrCombos) return [];
  if (Array.isArray(morphOrCombos)) {
    return morphOrCombos.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof morphOrCombos === 'string') {
    return morphOrCombos.split(',').map(s => s.trim()).filter(Boolean);
  }
  const morph = morphOrCombos;
  const cp = morph.combo_potential || morph.comboPotential;
  if (Array.isArray(cp) && cp.length > 0) {
    return cp.map(String).map(s => s.trim()).filter(Boolean);
  }
  const cc = morph.combo_compatibility || morph.comboCompatibility;
  if (Array.isArray(cc) && cc.length > 0) {
    return cc.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof cc === 'string') {
    return cc.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}
