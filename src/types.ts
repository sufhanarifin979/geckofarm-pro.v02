export type Species = 'Leopard Gecko' | 'African Fat-Tailed Gecko';

export interface Gecko {
  id?: string;
  name: string;
  morph: string;
  birthDate: string;
  project: string;
  sireId: string;
  damId: string;
  sireName: string;
  damName: string;
  sireMorph?: string;
  damMorph?: string;
  gender: 'male' | 'female' | 'unsex';
  status: 'available' | 'keep' | 'sold' | 'dead';
  info: string;
  note: string;
  photoUrl: string;
  photos?: string[];
  ownerId: string;
  albinoStrain?: 'None' | 'Tremper' | 'Bell' | 'Rainwater';
  weight?: number;
  createdAt?: any;
  purchasePrice?: number;
  species?: Species;
  enclosure?: string;
  price?: number;
}

export interface FinanceTransaction {
  id?: string;
  userId: string;
  type: 'sale' | 'expense';
  category: string;
  amount: number;
  date: string;
  notes?: string;
  geckoId?: string;
  buyer?: string;
  createdAt?: any;
}

export interface Pairing {
  id?: string;
  sireId: string;
  damId: string;
  sireName?: string;
  damName?: string;
  sireMorph?: string;
  damMorph?: string;
  pairingDate: string;
  ownerId: string;
  clutchCount: number;
  subscription?: string;
  species?: Species;
  status?: 'active' | 'closed';
  closedAt?: string;
  closeReason?: 'Breeding Finished' | 'Sold' | 'Retired' | 'Replaced Partner' | 'Other' | string;
}

export interface Clutch {
  id?: string;
  pairingId: string;
  clutchNumber: number;
  layDate: string;
  hatchDate?: string;
  eggCount: number;
  hatchedCount: number;
  failedCount?: number;
  ownerId: string;
  userId?: string;
  incubator?: string;
  species?: Species;
  targetSex?: 'TSF' | 'TSM' | 'MIX';
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  farmName: string;
  farmPhotoUrl: string;
  subscription: 'free' | 'premium';
  geckoCount: number;
  pairingCount: number;
  clutchCount: number;
  planLimit: number;
  onboardingCompleted?: boolean;
  defaultSpecies?: Species;
  premiumActivatedAt?: any;
  premiumExpiresAt?: any;
}

export interface WeightLog {
  id?: string;
  weight: number;
  date: string;
  note: string;
}

export interface ActivityLog {
  id?: string;
  type: 'feeding' | 'shedding' | 'health' | 'note';
  date: string;
  description: string;
}

export interface Morph {
  id?: string;
  name: string;
  description: string;
  genetic_type: 'dominant' | 'recessive' | 'polygenic';
  traits: string[];
  price_range?: string;
  image_url?: string;
  species?: Species;
}

export interface MorphRelation {
  id?: string;
  morph_id: string;
  related_id: string;
}

export interface ReferenceLink {
  title: string;
  url: string;
}

export interface GeneticWarning {
  templateId: 'enigma' | 'lemon_frost' | 'white_yellow' | 'super_form_lethal' | 'incompatible_strain' | 'custom' | string;
  title: string;
  description: string;
  type?: 'genetic_warning' | 'health_risk';
}

export type MorphCategory = 'Base' | 'Albino' | 'Snow' | 'Combo' | 'Line-bred' | 'Pattern' | 'Special' | string;
export type MorphRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Holy Grail';
export type MorphInheritance = 'Recessive' | 'Incomplete Dominant' | 'Dominant' | 'Line-bred' | 'Polygenetic' | 'Polygenic' | string;

export interface MorphEntry {
  id?: string;
  name: string;
  slug: string;
  category: MorphCategory[] | MorphCategory;
  rarity: MorphRarity;
  inheritance_type: MorphInheritance[] | MorphInheritance;
  inheritanceType?: MorphInheritance[] | MorphInheritance;
  description: string;
  genetics?: string;
  genetic_formula?: string[];
  geneticFormula?: string[];
  visual_traits?: string[];
  visualTraits?: string[];
  genetic_signatures?: string[];
  geneticSignatures?: string[];
  combo_compatibility?: string[];
  comboCompatibility?: string[];
  combo_potential?: string[];
  comboPotential?: string[];
  warnings?: string;
  genetic_warnings?: GeneticWarning[];
  geneticWarnings?: GeneticWarning[];
  breeder_notes?: string;
  image_url?: string;
  image_url_baby?: string;
  image_url_eye?: string;
  selection_priority?: string[];
  tags?: string[];
  reference_links?: ReferenceLink[];
  credited_breeders?: string[];
  discovery_year?: number | string;
  species?: Species;
  created_at?: any;
  updated_at?: any;
}
