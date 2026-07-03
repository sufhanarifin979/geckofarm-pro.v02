import morphDatabaseRaw from "../../morph_database.json";

const morphDatabase = morphDatabaseRaw as Record<string, any>;

export interface GeneticInput {
  genes: string[];
  traits: string[];
}

export interface MorphDefinition {
  name: string;
  slug: string;
  category: string;
  morphType: string;
  official: boolean;
  inheritanceSummary: string[];
  requiredTraits: string[];
  requiredGenes: string[];
  requiredMorphs: string[];
  aliases: string[];
  description: string;
  relatedMorphs: string[];
  canProduce: any[];
  rarity: number;
  marketTier: string;
  risk: string[];
  recognitionPriority: number;
  searchKeywords: string[];
  aiExplanation: string;
  acceptedAlbinoTypes?: string[];
}

export interface ResolverOutput {
  officialMorph: string | null;
  officialStage: string;
  matchedMorphs: string[];
  matchedGenes: string[];
  matchedTraits: string[];
  missingGenes: string[];
  missingTraits: string[];
  additionalGenes: string[];
  additionalTraits: string[];
  confidence: number;
  closestMatches: {
    name: string;
    slug: string;
    confidence: number;
    missingGenes: string[];
    missingTraits: string[];
  }[];
  resolverPath: string;
}

const VIRTUAL_MORPHS: Record<string, Partial<MorphDefinition>> = {
  raptor: {
    name: "RAPTOR",
    slug: "raptor",
    category: "Designer Morph",
    morphType: "Designer Morph",
    official: true,
    inheritanceSummary: ["Recessive", "Polygenic"],
    requiredTraits: ["Tangerine", "Patternless Stripe"],
    requiredGenes: ["Tremper Albino", "Eclipse"],
    requiredMorphs: [],
    aliases: [],
    description: "Red-eyed Albino Patternless Tangerine Orange (RAPTOR).",
    relatedMorphs: [],
    canProduce: [],
    rarity: 3,
    marketTier: "Uncommon",
    risk: [],
    recognitionPriority: 100,
    searchKeywords: ["RAPTOR", "Raptor"],
    aiExplanation: "RAPTOR adalah kombinasi dari Tremper Albino, Eclipse, Tangerine, dan Patternless Stripe."
  }
};

export function getMorphDef(slug: string): any {
  const normalizedSlug = slug.toLowerCase();
  if (VIRTUAL_MORPHS[normalizedSlug]) {
    return VIRTUAL_MORPHS[normalizedSlug];
  }
  return morphDatabase[normalizedSlug];
}

const ALBINO_TYPES = ["Tremper Albino", "Bell Albino", "Rainwater Albino"];

/**
 * Helper to determine a morph's Stage Level (2 to 5)
 */
export function getMorphStageLevel(slug: string): number {
  const s = slug.toLowerCase();
  
  // Stage 5: Trade Names
  if (s === "sunglow" || s === "tangelo" || s === "firewater") {
    return 5;
  }
  
  // Stage 4: Project Morphs
  if (s === "dreamsicle" || s === "super-black-hole" || s === "super-nova") {
    return 4;
  }
  
  // Stage 3: Designer Morphs
  if (
    s === "nova" ||
    s === "msbbb" ||
    s === "ssbbb" ||
    s === "stealth" ||
    s === "super-raptor" ||
    s === "super-radar" ||
    s === "super-stealth" ||
    s === "snowflake" ||
    s === "snowglow" ||
    s === "creamsicle"
  ) {
    return 3;
  }
  
  // Stage 2: Base Morphs (Default for everything else)
  return 2;
}

export function getStageName(level: number): string {
  switch (level) {
    case 2: return "Base Morph";
    case 3: return "Designer Morph";
    case 4: return "Project Morph";
    case 5: return "Trade Name";
    default: return "Gene";
  }
}

/**
 * Checks if slugA transitively or directly requires slugB.
 */
export function requiresTransitively(slugA: string, slugB: string): boolean {
  const def = getMorphDef(slugA);
  if (!def || !def.requiredMorphs) return false;
  const direct = def.requiredMorphs.map((m: string) => m.toLowerCase());
  if (direct.includes(slugB.toLowerCase())) return true;
  return direct.some((m: string) => requiresTransitively(m, slugB));
}

/**
 * Checks matching of required genes against input genes.
 * Special breeder logic: "Super Snow" homozigot automatically satisfies a "Mack Snow" requirement.
 */
export function matchGenes(
  requiredGenes: Set<string>,
  acceptedAlbinoTypes: Set<string>,
  inputGenes: Set<string>
): { matched: string[]; missing: string[]; isAlbinoSubstituted: boolean } {
  const matched: string[] = [];
  const missing: string[] = [];
  let isAlbinoSubstituted = false;

  for (const rg of requiredGenes) {
    const rgLower = rg.toLowerCase();
    
    // Exact match or Super Snow satisfying Mack Snow
    if (inputGenes.has(rgLower)) {
      matched.push(rg);
    } else if (rgLower === "mack snow" && inputGenes.has("super snow")) {
      matched.push("Super Snow"); // Breeder conversion
    } else if (ALBINO_TYPES.some(a => a.toLowerCase() === rgLower) && acceptedAlbinoTypes.size > 0) {
      // Check if there is an alternative albino type in acceptedAlbinoTypes that is in inputGenes
      let foundAlt = false;
      for (const alt of acceptedAlbinoTypes) {
        const altLower = alt.toLowerCase();
        if (inputGenes.has(altLower)) {
          matched.push(alt); // Use the actual matched albino name
          isAlbinoSubstituted = true;
          foundAlt = true;
          break;
        }
      }
      if (!foundAlt) {
        missing.push(rg);
      }
    } else {
      missing.push(rg);
    }
  }

  return { matched, missing, isAlbinoSubstituted };
}

/**
 * Checks matching of required traits against input traits/genes.
 */
export function matchTraits(
  requiredTraits: Set<string>,
  inputTraits: Set<string>,
  inputGenes: Set<string>
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const rt of requiredTraits) {
    const rtLower = rt.toLowerCase();
    if (inputTraits.has(rtLower) || inputGenes.has(rtLower)) {
      matched.push(rt);
    } else {
      missing.push(rt);
    }
  }

  return { matched, missing };
}

/**
 * Stage 1: Gene Recognition
 */
export function recognizeGenes(input: GeneticInput): { genesSet: Set<string>; traitsSet: Set<string> } {
  console.debug("[Stage 1] Gene Recognition starting...");
  console.debug(`  Input Genes: ${JSON.stringify(input.genes)}`);
  console.debug(`  Input Traits: ${JSON.stringify(input.traits)}`);
  
  const genesSet = new Set(input.genes.map(g => g.trim().toLowerCase()));
  const traitsSet = new Set(input.traits.map(t => t.trim().toLowerCase()));
  
  console.debug("  [Stage 1 Output] Gene list identified.");
  return { genesSet, traitsSet };
}

/**
 * Stage 2: Base Morph Recognition
 */
export function recognizeBaseMorphs(memo: Map<string, any>): any[] {
  console.debug("\n[Stage 2] Base Morph Recognition starting...");
  const baseMorphs: any[] = [];
  for (const [slug, result] of memo.entries()) {
    if (getMorphStageLevel(slug) === 2) {
      baseMorphs.push(result);
      if (result.confidence > 0) {
        console.debug(`  Checking: ${result.name} | Matched Genes: ${result.matchedGenes.join(", ")} | Missing: ${result.missingGenes.join(", ")} | Confidence: ${result.confidence}%`);
      }
    }
  }
  console.debug("  Stage 2 completed.");
  return baseMorphs;
}

/**
 * Stage 3: Designer Morph Recognition
 */
export function recognizeDesignerMorphs(memo: Map<string, any>): any[] {
  console.debug("\n[Stage 3] Designer Morph Recognition starting...");
  const designerMorphs: any[] = [];
  for (const [slug, result] of memo.entries()) {
    if (getMorphStageLevel(slug) === 3) {
      designerMorphs.push(result);
      if (result.confidence > 0) {
        console.debug(`  Checking: ${result.name} | Matched Genes: ${result.matchedGenes.join(", ")} | Missing: ${result.missingGenes.join(", ")} | Confidence: ${result.confidence}%`);
      }
    }
  }
  console.debug("  Stage 3 completed.");
  return designerMorphs;
}

/**
 * Stage 4: Project Morph Recognition
 */
export function recognizeProjectMorphs(memo: Map<string, any>): any[] {
  console.debug("\n[Stage 4] Project Morph Recognition starting...");
  const projectMorphs: any[] = [];
  for (const [slug, result] of memo.entries()) {
    if (getMorphStageLevel(slug) === 4) {
      projectMorphs.push(result);
      if (result.confidence > 0) {
        console.debug(`  Checking: ${result.name} | Matched Genes: ${result.matchedGenes.join(", ")} | Missing: ${result.missingGenes.join(", ")} | Confidence: ${result.confidence}%`);
      }
    }
  }
  console.debug("  Stage 4 completed.");
  return projectMorphs;
}

/**
 * Stage 5: Trade Name Recognition
 */
export function recognizeTradeNames(memo: Map<string, any>): any[] {
  console.debug("\n[Stage 5] Trade Name Recognition starting...");
  const tradeNames: any[] = [];
  for (const [slug, result] of memo.entries()) {
    if (getMorphStageLevel(slug) === 5) {
      tradeNames.push(result);
      if (result.confidence > 0) {
        console.debug(`  Checking: ${result.name} | Matched Genes: ${result.matchedGenes.join(", ")} | Missing: ${result.missingGenes.join(", ")} | Confidence: ${result.confidence}%`);
      }
    }
  }
  console.debug("  Stage 5 completed.");
  return tradeNames;
}

/**
 * Resolves the official morph for a given genotype and phenotype input using V2 logic.
 */
export function resolveMorph(input: GeneticInput): ResolverOutput {
  // Stage 1: Gene Recognition
  const { genesSet, traitsSet } = recognizeGenes(input);

  const memo = new Map<string, any>();
  const visited = new Set<string>();

  /**
   * Recursive helper to evaluate any morph's matching state.
   */
  function evaluate(slug: string): any {
    const normalizedSlug = slug.toLowerCase();
    if (memo.has(normalizedSlug)) return memo.get(normalizedSlug);
    if (visited.has(normalizedSlug)) {
      return {
        slug: normalizedSlug,
        name: slug,
        confidence: 0,
        matchedGenes: [],
        matchedTraits: [],
        missingGenes: [],
        missingTraits: [],
        matchedMorphsList: [],
        missingMorphsList: []
      };
    }
    visited.add(normalizedSlug);

    const morph = getMorphDef(normalizedSlug);
    if (!morph) {
      return {
        slug: normalizedSlug,
        name: slug,
        confidence: 0,
        matchedGenes: [],
        matchedTraits: [],
        missingGenes: [],
        missingTraits: [],
        matchedMorphsList: [],
        missingMorphsList: []
      };
    }

    // Evaluate required morphs first
    const resolvedMorphs = (morph.requiredMorphs || []).map((parent: string) => evaluate(parent.toLowerCase()));

    const matchedMorphsList: string[] = [];
    const missingMorphsList: string[] = [];

    for (const rm of resolvedMorphs) {
      if (rm.confidence >= 90) {
        matchedMorphsList.push(rm.name);
      } else {
        missingMorphsList.push(rm.name);
      }
    }

    // Accumulate all requirements from the morph definition and its dependencies
    const combinedRequiredGenes = new Set<string>(morph.requiredGenes || []);
    const combinedRequiredTraits = new Set<string>(morph.requiredTraits || []);
    const combinedAcceptedAlbino = new Set<string>(morph.acceptedAlbinoTypes || []);

    for (const rm of resolvedMorphs) {
      const parentDef = getMorphDef(rm.slug);
      if (parentDef) {
        (parentDef.requiredGenes || []).forEach((g: string) => combinedRequiredGenes.add(g));
        (parentDef.requiredTraits || []).forEach((t: string) => combinedRequiredTraits.add(t));
        (parentDef.acceptedAlbinoTypes || []).forEach((a: string) => combinedAcceptedAlbino.add(a));
      }
    }

    // Perform the matching checks
    const geneMatchResult = matchGenes(combinedRequiredGenes, combinedAcceptedAlbino, genesSet);
    const traitMatchResult = matchTraits(combinedRequiredTraits, traitsSet, genesSet);

    const totalRequiredCount = combinedRequiredGenes.size + combinedRequiredTraits.size + (morph.requiredMorphs || []).length;
    const matchedCount = geneMatchResult.matched.length + traitMatchResult.matched.length + matchedMorphsList.length;

    const missingGenesCount = geneMatchResult.missing.length;
    const missingTraitsCount = traitMatchResult.missing.length;
    const missingMorphsCount = missingMorphsList.length;

    // V2 Confidence Formula: (jumlah requirement terpenuhi / jumlah requirement total) * 100
    const confidence = totalRequiredCount > 0 ? Math.round((matchedCount / totalRequiredCount) * 100) : 0;

    const result = {
      slug: normalizedSlug,
      name: morph.name,
      confidence,
      matchedGenes: geneMatchResult.matched,
      matchedTraits: traitMatchResult.matched,
      missingGenes: geneMatchResult.missing,
      missingTraits: traitMatchResult.missing,
      matchedMorphsList,
      missingMorphsList,
      recognitionPriority: morph.recognitionPriority || 0,
      totalRequiredCount,
      matchedCount
    };

    memo.set(normalizedSlug, result);
    visited.delete(normalizedSlug);
    return result;
  }

  // Populate the memo with all possible morph evaluations
  const allSlugs = Array.from(new Set([...Object.keys(morphDatabase), ...Object.keys(VIRTUAL_MORPHS)]));
  allSlugs.forEach(slug => evaluate(slug));

  // Run sequential Stage functions to log debugging state properly
  recognizeBaseMorphs(memo);
  recognizeDesignerMorphs(memo);
  recognizeProjectMorphs(memo);
  recognizeTradeNames(memo);

  // Group and sort candidates to find the highest official result
  const candidates = allSlugs
    .map(slug => memo.get(slug))
    .filter(c => c && c.confidence >= 90);

  // Sort candidates by:
  // 1. Confidence (highest)
  // 2. Specificity / Transitively Requires (descendant wins over ancestor)
  // 3. Stage Level (highest)
  // 4. Recognition Priority (highest)
  // 5. Name (alphabetical)
  candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    
    // Check direct/transitive dependency
    if (requiresTransitively(a.slug, b.slug)) return -1;
    if (requiresTransitively(b.slug, a.slug)) return 1;

    const aStage = getMorphStageLevel(a.slug);
    const bStage = getMorphStageLevel(b.slug);
    if (bStage !== aStage) return bStage - aStage;
    if (b.recognitionPriority !== a.recognitionPriority) return b.recognitionPriority - a.recognitionPriority;
    return a.name.localeCompare(b.name);
  });

  const best = candidates[0];

  let officialMorph: string | null = null;
  let officialStage = "Gene";
  let resolvedConfidence = 0;
  let matchedMorphs: string[] = [];
  let matchedGenes: string[] = [];
  let matchedTraits: string[] = [];
  let missingGenes: string[] = [];
  let missingTraits: string[] = [];
  let closestMatches: any[] = [];
  let resolverPath = "Gene";

  if (best) {
    officialMorph = best.name;
    officialStage = getStageName(getMorphStageLevel(best.slug));
    resolvedConfidence = best.confidence;
    matchedMorphs = best.matchedMorphsList;
    matchedGenes = best.matchedGenes;
    matchedTraits = best.matchedTraits;
    missingGenes = best.missingGenes;
    missingTraits = best.missingTraits;

    // Build smart precursor-based resolver path
    const pathPrecursors: { name: string; level: number }[] = [];
    const bestDef = getMorphDef(best.slug);
    const bestGenesSet = new Set((bestDef?.requiredGenes || []).map((g: string) => g.toLowerCase()));
    const bestTraitsSet = new Set((bestDef?.requiredTraits || []).map((t: string) => t.toLowerCase()));

    for (const [slug, val] of memo.entries()) {
      if (slug === best.slug) continue;
      if (val.confidence < 90) continue;

      const def = getMorphDef(slug);
      if (!def) continue;

      // Check if def requirements are subset of best requirements
      const isSubset = (def.requiredGenes || []).every((g: string) => bestGenesSet.has(g.toLowerCase())) &&
                       (def.requiredTraits || []).every((t: string) => bestTraitsSet.has(t.toLowerCase()));

      if (isSubset || best.matchedMorphsList.includes(val.name)) {
        pathPrecursors.push({ name: val.name, level: getMorphStageLevel(slug) });
      }
    }

    // Sort precursors by stage level
    pathPrecursors.sort((a, b) => a.level - b.level);

    const uniquePrecursorNames = Array.from(new Set(pathPrecursors.map(p => p.name)));
    const pathSequence = ["Gene", ...uniquePrecursorNames, best.name, `Official ${best.name}`];
    resolverPath = pathSequence.join(" -> ");

  } else {
    // Stage 5 sorting logic for closest matches (confidence > 0 but < 90):
    // 1. Recognition Priority tertinggi
    // 2. Jumlah requirement yang cocok
    // 3. Jumlah requirement yang kurang
    // 4. Nama morph
    const sortedClosest = allSlugs
      .map(slug => memo.get(slug))
      .filter(c => c && c.confidence > 0 && c.confidence < 90)
      .sort((a, b) => {
        if (b.recognitionPriority !== a.recognitionPriority) return b.recognitionPriority - a.recognitionPriority;
        if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
        const missingA = a.missingGenes.length + a.missingTraits.length + a.missingMorphsList.length;
        const missingB = b.missingGenes.length + b.missingTraits.length + b.missingMorphsList.length;
        if (missingA !== missingB) return missingA - missingB;
        return a.name.localeCompare(b.name);
      });

    closestMatches = sortedClosest.slice(0, 3).map(c => ({
      name: c.name,
      slug: c.slug,
      confidence: c.confidence,
      missingGenes: c.missingGenes,
      missingTraits: c.missingTraits
    }));

    resolverPath = "Gene";
  }

  // Calculate additional/leftover genes and traits
  const matchedGenesSet = new Set(matchedGenes.map(g => g.toLowerCase()));
  const matchedTraitsSet = new Set(matchedTraits.map(t => t.toLowerCase()));

  const additionalGenes = input.genes.filter(g => !matchedGenesSet.has(g.trim().toLowerCase()) && g.toLowerCase() !== "super snow");
  const additionalTraits = input.traits.filter(t => !matchedTraitsSet.has(t.trim().toLowerCase()));

  console.debug("\n[Final Result]");
  console.debug(`  Official Morph: ${officialMorph}`);
  console.debug(`  Stage: ${officialStage}`);
  console.debug(`  Path: ${resolverPath}`);
  console.debug(`  Confidence: ${resolvedConfidence}%`);

  return {
    officialMorph,
    officialStage,
    matchedMorphs,
    matchedGenes,
    matchedTraits,
    missingGenes,
    missingTraits,
    additionalGenes,
    additionalTraits,
    confidence: resolvedConfidence,
    closestMatches,
    resolverPath
  };
}
