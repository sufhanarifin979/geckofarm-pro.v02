import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, registerListener, auth, getCachedMorphs, setCachedMorphs, clearCachedMorphs } from '../lib/firebase';
import { autoCropToSquare } from '../lib/imageUtils';
import { MorphEntry, ReferenceLink, GeneticWarning } from '../types';
import { SearchableMultiSelect } from './ui/SearchableMultiSelect';
import { GeneticWarningEditor } from './ui/GeneticWarningEditor';
import { 
  normalizeCategories, 
  normalizeInheritance, 
  normalizeRarity, 
  normalizeGeneticFormula, 
  normalizeGeneticWarnings, 
  normalizeGeneticSignatures, 
  normalizeComboPotential 
} from '../lib/morphNormalizer';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Save, 
  X, 
  Dna, 
  Sparkles, 
  Zap, 
  AlertTriangle,
  Info,
  Link as LinkIcon,
  User,
  Loader2,
  ChevronRight,
  Eye,
  Camera,
  Upload,
  Layers,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_OPTIONS = ['Base', 'Albino', 'Snow', 'Combo', 'Line-bred', 'Pattern', 'Special'];
const INHERITANCE_OPTIONS = ['Recessive', 'Incomplete Dominant', 'Dominant', 'Line-bred'];
const RARITY_OPTIONS: ('Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary')[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const GENETIC_FORMULA_OPTIONS = [
  'Tremper Albino',
  'Bell Albino',
  'Rainwater Albino',
  'Eclipse',
  'Blizzard',
  'Murphy Patternless',
  'Mack Snow',
  'Super Snow',
  'Giant',
  'Super Giant',
  'TUG Snow',
  'White & Yellow',
  'Enigma',
  'Lemon Frost',
  'Tangerine',
  'Patternless Stripe',
  'Marble Eye',
  'Black Night',
  'Blood',
  'Diablo Blanco',
  'RAPTOR',
  'RADAR',
  'Typhoon',
  'Nova',
  'Stealth',
  'Dreamsickle',
  'Vortex',
  'Firewater',
  'Oreo',
  'Whiteout',
  'Zulu',
  'Ghost',
  'Caramel',
  'Amelanistic',
  'Zero',
  'Stinger',
  'Stripe',
  'Banded'
];

const GENETIC_SIGNATURE_OPTIONS = [
  'Red Eyes',
  'White Tail',
  'High Contrast',
  'Tangerine',
  'Patternless',
  'Dark Eyes',
  'Snake Eyes',
  'Solid Black Eyes',
  'Solid Ruby Eyes',
  'White Socks',
  'Lavender Banding',
  'High Yellow',
  'Carrot Tail',
  'Carrot Head',
  'Reverse Stripe',
  'Pied Markings',
  'Soft Velvety Dorsal',
  'Hypo (Reduced Spotting)',
  'Super Hypo (Zero Body Spots)',
  'Paradox Spotting',
  'All-Over Fine Spotting',
  'Jungle Pattern',
  'Bold Stripe'
];

const COMBO_POTENTIAL_OPTIONS = [
  'Eclipse',
  'Enigma',
  'Mack Snow',
  'Super Snow',
  'Tremper Albino',
  'Bell Albino',
  'Rainwater Albino',
  'White & Yellow',
  'Murphy Patternless',
  'Blizzard',
  'Tangerine',
  'Giant',
  'Lemon Frost',
  'Black Night',
  'Blood',
  'Marble Eye',
  'Diablo Blanco',
  'RAPTOR',
  'RADAR',
  'Typhoon',
  'Oreo (AFT)',
  'Whiteout (AFT)',
  'Zulu (AFT)',
  'Caramel (AFT)'
];

export default function AdminEncyclopedia() {
  const [morphs, setMorphs] = useState<MorphEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);
  const [editingMorph, setEditingMorph] = useState<MorphEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    category: string[];
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
    inheritance_type: string[];
    description: string;
    genetics: string;
    genetic_formula: string[];
    visual_traits: string[];
    genetic_signatures: string[];
    combo_compatibility: string[];
    combo_potential: string[];
    warnings: string;
    genetic_warnings: GeneticWarning[];
    breeder_notes: string;
    image_url: string;
    image_url_baby: string;
    image_url_eye: string;
    selection_priority: string[];
    tags: string[];
    reference_links: ReferenceLink[];
    credited_breeders: string[];
    discovery_year: string;
    species: any;
  }>({
    name: '',
    slug: '',
    category: ['Base'],
    rarity: 'Common',
    inheritance_type: ['Recessive'],
    description: '',
    genetics: '',
    genetic_formula: [],
    visual_traits: [],
    genetic_signatures: [],
    combo_compatibility: [],
    combo_potential: [],
    warnings: '',
    genetic_warnings: [],
    breeder_notes: '',
    image_url: '',
    image_url_baby: '',
    image_url_eye: '',
    selection_priority: [],
    tags: [],
    reference_links: [],
    credited_breeders: [],
    discovery_year: '',
    species: 'Leopard Gecko'
  });

  const applyPreset = (presetName: string) => {
    if (presetName === 'albino') {
      setFormData(prev => ({
        ...prev,
        category: ['Albino'],
        inheritance_type: ['Recessive'],
        rarity: 'Common',
        genetics: 'Tremper Albino',
        genetic_formula: ['Tremper Albino'],
        visual_traits: ['Amelanistik (Hilangnya pigmen hitam melanin)', 'Mata berwarna pink/perak dengan urat merah', 'Pola tubuh coklat keunguan/oranye'],
        genetic_signatures: ['Amelanistik (Hilangnya pigmen hitam melanin)', 'Mata berwarna pink/perak dengan urat merah', 'Pola tubuh coklat keunguan/oranye'],
        selection_priority: ['Intensitas kejernihan warna latar', 'Ketiadaan pigmen hitam', 'Kesehatan mata dan sensitivitas cahaya'],
        breeder_notes: 'Albino terdiri dari 3 strain yang tidak kompatibel: Tremper, Bell, dan Rainwater. Jangan pernah menyilangkan antar strain albino berbeda (strain crossing) karena akan mengaburkan genetika murni.',
        warnings: '',
        genetic_warnings: [{
          templateId: 'custom',
          title: 'Incompatible Albino Strain',
          description: 'Tidak kompatibel antar sesama albino (Tremper, Bell, Rainwater). Jangan menyilangkan antar strain albino berbeda.',
          type: 'genetic_warning'
        }]
      }));
    } else if (presetName === 'tangerine') {
      setFormData(prev => ({
        ...prev,
        category: ['Line-bred'],
        inheritance_type: ['Line-bred'],
        rarity: 'Uncommon',
        genetics: 'Tangerine',
        genetic_formula: ['Tangerine'],
        visual_traits: ['Warna oranye cerah pada punggung & kepala', 'Carrot Tail (>15% pangkal ekor oranye)', 'Carrot Head'],
        genetic_signatures: ['Warna oranye cerah pada punggung & kepala', 'Carrot Tail (>15% pangkal ekor oranye)', 'Carrot Head'],
        selection_priority: ['Persentase cakupan oranye (>80%)', 'Tingkat pekat Carrot Tail', 'Kontras warna oranye tanpa bintik gelap'],
        breeder_notes: 'Pewarisan poligenik kumulatif. Hasil anakan sangat bergantung pada seleksi ketat kedua indukan dengan pigmen oranye tertinggi.',
        warnings: '',
        genetic_warnings: []
      }));
    } else if (presetName === 'snow') {
      setFormData(prev => ({
        ...prev,
        category: ['Snow'],
        inheritance_type: ['Incomplete Dominant'],
        rarity: 'Common',
        genetics: 'Mack Snow',
        genetic_formula: ['Mack Snow'],
        visual_traits: ['Warna dasar putih/krem saat baby', 'Bercak hitam kontras', 'Menguning secara bertahap saat dewasa'],
        genetic_signatures: ['Warna dasar putih/krem saat baby', 'Bercak hitam kontras', 'Menguning secara bertahap saat dewasa'],
        selection_priority: ['Kekontrasan warna hitam-putih saat menetas', 'Tingkat keputihan dasar tubuh'],
        breeder_notes: 'Bentuk homozigotnya adalah Super Snow (MS/MS) dengan pola bintik kecil halus (all-over spotting) dan mata solid black eclipse.',
        warnings: '',
        genetic_warnings: []
      }));
    } else if (presetName === 'eclipse') {
      setFormData(prev => ({
        ...prev,
        category: ['Base'],
        inheritance_type: ['Recessive'],
        rarity: 'Uncommon',
        genetics: 'Eclipse',
        genetic_formula: ['Eclipse'],
        visual_traits: ['Solid black eyes (atau snake eyes 50%)', 'Pied white nose & white socks/kaki putih', 'High contrast tail'],
        genetic_signatures: ['Solid black eyes (atau snake eyes 50%)', 'Pied white nose & white socks/kaki putih', 'High contrast tail'],
        selection_priority: ['Persentase solid eye (100% full eclipse)', 'White nose / pied markings'],
        breeder_notes: 'Gen eclipse sering digabung dengan Tremper Albino untuk menghasilkan RAPTOR, atau dengan Bell Albino untuk RADAR.',
        warnings: '',
        genetic_warnings: []
      }));
    } else if (presetName === 'combo') {
      setFormData(prev => ({
        ...prev,
        category: ['Combo'],
        inheritance_type: ['Recessive'],
        rarity: 'Rare',
        genetics: 'Tremper Albino + Eclipse',
        genetic_formula: ['Tremper Albino', 'Eclipse'],
        visual_traits: ['Kombinasi minimal 2 gen visual berbeda', 'Mata albino/eclipse', 'Tubuh tanpa pola atau berpola unik'],
        genetic_signatures: ['Kombinasi minimal 2 gen visual berbeda', 'Mata albino/eclipse', 'Tubuh tanpa pola atau berpola unik'],
        selection_priority: ['Ekspresi penuh seluruh gen penyusun', 'Purity indukan test-proven'],
        breeder_notes: 'Pastikan garis keturunan jelas untuk mengonfirmasi status het (heterozygous) bawaan.',
        warnings: '',
        genetic_warnings: []
      }));
    } else if (presetName === 'aft') {
      setFormData(prev => ({
        ...prev,
        species: 'African Fat-Tailed Gecko',
        category: ['Base'],
        inheritance_type: ['Incomplete Dominant'],
        rarity: 'Rare',
        genetics: 'Whiteout',
        genetic_formula: ['Whiteout'],
        visual_traits: ['Pola putih melebar pada dorsal & leher', 'Kontras tinggi dengan garis coklat gelap'],
        genetic_signatures: ['Pola putih melebar pada dorsal & leher', 'Kontras tinggi dengan garis coklat gelap'],
        selection_priority: ['Pola kontras tajam', 'Kesehatan fisik'],
        breeder_notes: 'Populer untuk kombinasi dengan Oreo atau Zulu.',
        warnings: 'PERINGATAN: Persilangan Whiteout x Whiteout menghasilkan Super Whiteout yang homozigot lethal (mati dalam telur).',
        genetic_warnings: [{
          templateId: 'super_form_lethal',
          title: 'Super Form Lethal Warning',
          description: 'Persilangan Whiteout x Whiteout menghasilkan Super Whiteout yang homozigot lethal (mati dalam telur). Hindari perkawinan Whiteout x Whiteout.',
          type: 'genetic_warning'
        }]
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'image_url' | 'image_url_baby' | 'image_url_eye') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const cropped = await autoCropToSquare(base64, 800);
        setFormData(prev => ({ ...prev, [targetField]: cropped }));
      } catch (err) {
        console.error("Failed to process image:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Try memory cache first
    const memCache = getCachedMorphs();
    if (memCache && memCache.length > 0) {
      setMorphs(memCache as MorphEntry[]);
      setLoading(false);
      return;
    }

    // Try localStorage cache next
    let localCacheLoaded = false;
    try {
      const local = localStorage.getItem('cache_encyclopedia_morphs');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.length > 0) {
          setMorphs(parsed);
          setCachedMorphs(parsed);
          setLoading(false);
          localCacheLoaded = true;
        }
      }
    } catch (e) {
      console.warn("Failed to load morphs from localStorage:", e);
    }

    const q = query(collection(db, 'morphs'), orderBy('name', 'asc'));
    getDocs(q).then((snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        ...doc.data(),
        id: doc.id
      } as MorphEntry));
      setMorphs(data);
      setCachedMorphs(data);
      setLoading(false);
      try {
        localStorage.setItem('cache_encyclopedia_morphs', JSON.stringify(data));
      } catch (e) {}
    }).catch((error) => {
      handleFirestoreError(error, OperationType.LIST, 'morphs');
      if (!localCacheLoaded) {
        setLoading(false);
      }
    });
  }, []);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      name, 
      slug: prev.slug === slugify(prev.name || '') ? slugify(name) : prev.slug 
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    setIsSaving(true);
    try {
      const cats = normalizeCategories(formData.category);
      const inhs = normalizeInheritance(formData.inheritance_type);
      const rar = normalizeRarity(formData.rarity);
      const formulas = normalizeGeneticFormula(formData);
      const warns = normalizeGeneticWarnings(formData);
      const sigs = normalizeGeneticSignatures(formData);
      const combos = normalizeComboPotential(formData);

      const payload = {
        ...formData,
        category: cats,
        inheritance_type: inhs,
        inheritanceType: inhs,
        rarity: rar,
        genetic_formula: formulas,
        geneticFormula: formulas,
        genetics: formulas.join(' + '),
        genetic_warnings: warns,
        geneticWarnings: warns,
        warnings: warns.map(w => `${w.title}: ${w.description}`).join(' | '),
        visual_traits: sigs,
        visualTraits: sigs,
        genetic_signatures: sigs,
        geneticSignatures: sigs,
        combo_compatibility: combos,
        comboCompatibility: combos,
        combo_potential: combos,
        comboPotential: combos,
        updated_at: serverTimestamp()
      };

      if (editingMorph?.id) {
        await updateDoc(doc(db, 'morphs', editingMorph.id), payload);
      } else {
        await addDoc(collection(db, 'morphs'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      
      clearCachedMorphs();
      setIsModalOpen(false);
      setEditingMorph(null);
      resetForm();
    } catch (error) {
      console.error('Error saving morph:', error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation || !deleteConfirmation.id) return;
    
    setIsDeleting(true);
    try {
      // Explicitly target the correct collection and document ID
      const morphRef = doc(db, 'morphs', deleteConfirmation.id);
      await deleteDoc(morphRef);
      clearCachedMorphs();
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('CRITICAL: Delete failed:', error);
      handleFirestoreError(error, OperationType.DELETE, `morphs/${deleteConfirmation.id}`);
      alert(`Gagal menghapus data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: ['Base'],
      rarity: 'Common',
      inheritance_type: ['Recessive'],
      description: '',
      genetics: '',
      genetic_formula: [],
      visual_traits: [],
      genetic_signatures: [],
      combo_compatibility: [],
      combo_potential: [],
      warnings: '',
      genetic_warnings: [],
      breeder_notes: '',
      image_url: '',
      image_url_baby: '',
      image_url_eye: '',
      selection_priority: [],
      tags: [],
      reference_links: [],
      credited_breeders: [],
      discovery_year: '',
      species: 'Leopard Gecko'
    });
  };

  const openEdit = (morph: MorphEntry) => {
    setEditingMorph(morph);
    const cats = normalizeCategories(morph.category);
    const inhs = normalizeInheritance(morph.inheritance_type);
    const rar = normalizeRarity(morph.rarity);
    const formulas = normalizeGeneticFormula(morph);
    const warns = normalizeGeneticWarnings(morph);
    const sigs = normalizeGeneticSignatures(morph);
    const combos = normalizeComboPotential(morph);

    setFormData({
      name: morph.name || '',
      slug: morph.slug || '',
      category: cats,
      rarity: rar,
      inheritance_type: inhs,
      description: morph.description || '',
      genetics: formulas.join(' + ') || morph.genetics || '',
      genetic_formula: formulas,
      visual_traits: sigs,
      genetic_signatures: sigs,
      combo_compatibility: combos,
      combo_potential: combos,
      warnings: morph.warnings || '',
      genetic_warnings: warns,
      breeder_notes: morph.breeder_notes || '',
      image_url: morph.image_url || '',
      image_url_baby: morph.image_url_baby || '',
      image_url_eye: morph.image_url_eye || '',
      selection_priority: morph.selection_priority || [],
      tags: morph.tags || [],
      reference_links: morph.reference_links || [],
      credited_breeders: morph.credited_breeders || [],
      discovery_year: morph.discovery_year ? String(morph.discovery_year) : '',
      species: morph.species || 'Leopard Gecko'
    });
    setIsModalOpen(true);
  };

  const filteredMorphs = morphs.filter(m => {
    const q = searchTerm.toLowerCase().trim();
    const cats = normalizeCategories(m.category);
    const inhs = normalizeInheritance(m.inheritance_type);
    const formulas = normalizeGeneticFormula(m);
    const sigs = normalizeGeneticSignatures(m);
    const combos = normalizeComboPotential(m);

    const matchesSearch = !q || (
      m.name.toLowerCase().includes(q) || 
      m.description.toLowerCase().includes(q) ||
      cats.some(c => c.toLowerCase().includes(q)) ||
      inhs.some(i => i.toLowerCase().includes(q)) ||
      formulas.some(f => f.toLowerCase().includes(q)) ||
      sigs.some(s => s.toLowerCase().includes(q)) ||
      combos.some(c => c.toLowerCase().includes(q)) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    );

    const matchesCategory = filterCategory === 'all' || cats.includes(filterCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Research Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Morph Research Inventory</h2>
          <p className="text-slate-500 text-sm font-medium">Curate the knowledge base for breeders worldwide.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingMorph(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} />
          New Research Entry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search encyclopedia database..."
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-medium focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {['all', 'Base', 'Albino', 'Snow', 'Combo', 'Pattern', 'Line-bred', 'Special'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterCategory === cat 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Morph List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMorphs.map((morph) => (
            <motion.div 
              key={morph.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500/50 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700">
                    {morph.image_url ? (
                      <img src={morph.image_url} alt={morph.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Dna size={20} /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-tight">{morph.name}</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {normalizeCategories(morph.category).join(', ')} • {normalizeRarity(morph.rarity)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(morph)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmation({ id: morph.id!, name: morph.name })} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                {morph.description}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                    normalizeRarity(morph.rarity) === 'Legendary' ? 'bg-amber-500 text-white' :
                    normalizeRarity(morph.rarity) === 'Epic' ? 'bg-purple-600 text-white' :
                    normalizeRarity(morph.rarity) === 'Rare' ? 'bg-indigo-500 text-white' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {normalizeRarity(morph.rarity)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter truncate max-w-[140px]">
                    {normalizeInheritance(morph.inheritance_type).join(', ')}
                  </span>
                </div>
                <button 
                  onClick={() => openEdit(morph)}
                  className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-500 transition-colors hover:scale-105 active:scale-95"
                >
                  <Eye size={12} />
                  Details
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmation(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-rose-500/20"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Delete Research Entry?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Anda akan menghapus data riset untuk <span className="text-slate-900 dark:text-white font-bold">{deleteConfirmation.name}</span>. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <button 
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-[2] py-4 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingMorph ? 'Edit Morph Research' : 'New Research Discovery'}
                  </h2>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Breeder Intelligence Editor</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      isPreviewMode ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPreviewMode ? <Eye size={14} /> : <Edit3 size={14} />}
                    {isPreviewMode ? 'Back to Edit' : 'Live Preview'}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-900 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                {isPreviewMode ? (
                  <div className="max-w-2xl mx-auto space-y-8">
                     <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-700">
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <Dna size={48} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Visual Data</span>
                          </div>
                        )}
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex gap-2 flex-wrap">
                              {normalizeCategories(formData.category).map(c => (
                                <span key={c} className="px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase">{c}</span>
                              ))}
                              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[8px] font-black uppercase">{normalizeRarity(formData.rarity)}</span>
                           </div>
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-none">{formData.name || 'Morph Name'}</h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{formData.description || 'Description will appear here...'}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Genetic Formula</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {normalizeGeneticFormula(formData).map(f => (
                                  <span key={f} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold font-mono">{f}</span>
                                ))}
                                {normalizeGeneticFormula(formData).length === 0 && <span className="text-xs text-slate-400 font-bold">Not specified</span>}
                              </div>
                           </div>
                           <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inheritance</span>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{normalizeInheritance(formData.inheritance_type).join(', ')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
                    {/* Quick Presets Bar */}
                    <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-amber-500/10 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                          <Sparkles size={14} className="text-amber-500" />
                          Template Cepat (1-Click Fill Preset)
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Klik untuk mengisi field otomatis</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applyPreset('albino')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          🔴 Albino (Recessive)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('tangerine')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          🟠 Tangerine (Line-Bred)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('snow')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          ⚪ Mack Snow (Incomplete Dom)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('eclipse')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          👁️ Eclipse (Solid Eye)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('combo')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          🟣 Multigenic Combo
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('aft')}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          🦎 AFT (African Fat-Tailed)
                        </button>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Info size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Core Identity Data</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morph Name</label>
                          <input 
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                            placeholder="e.g. RAPTOR"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug (URL ID)</label>
                          <input 
                            required
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs focus:border-emerald-500 transition-all"
                            placeholder="e.g. raptor-tremper-albino"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SearchableMultiSelect
                          label="Category (Multi-Select)"
                          sublabel="Bisa pilih lebih dari satu kategori (chips)"
                          placeholder="Pilih atau cari kategori..."
                          selected={formData.category}
                          onChange={(cats) => setFormData(prev => ({ ...prev, category: cats }))}
                          options={CATEGORY_OPTIONS}
                          allowCustom={true}
                          customAddText="+ Tambah Kategori Baru"
                          chipColor="emerald"
                          icon={<Layers size={14} />}
                        />

                        <SearchableMultiSelect
                          label="Inheritance Type (Multi-Select)"
                          sublabel="Contoh: Recessive, Line-bred"
                          placeholder="Pilih tipe penurunan gen..."
                          selected={formData.inheritance_type}
                          onChange={(inhs) => setFormData(prev => ({ ...prev, inheritance_type: inhs }))}
                          options={INHERITANCE_OPTIONS}
                          allowCustom={true}
                          customAddText="+ Tambah Tipe Hereditas"
                          chipColor="blue"
                          icon={<Dna size={14} />}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={14} />
                            Rarity Tier (Single-Select)
                          </label>
                          <select 
                            value={normalizeRarity(formData.rarity)}
                            onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value as any }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none transition-all cursor-pointer"
                          >
                            {RARITY_OPTIONS.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Species</label>
                          <select 
                            value={formData.species || 'Leopard Gecko'}
                            onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value as any }))}
                            className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none transition-all cursor-pointer"
                          >
                            <option value="Leopard Gecko">Leopard Gecko</option>
                            <option value="African Fat-Tailed Gecko">African Fat-Tailed Gecko</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Media & Multi-Stage Photos */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <Sparkles size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Media & Multi-Stage Photos (Dewasa, Baby, Mata)</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 1. Adult Image */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Foto Dewasa (Adult)</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">Utama</span>
                          </div>

                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 dark:border-slate-700">
                            {formData.image_url ? (
                              <img src={formData.image_url} alt="Adult Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Dna size={28} className="text-slate-400" />
                            )}
                          </div>

                          <label className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                            <Upload size={13} /> Upload File
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'image_url')} 
                            />
                          </label>

                          <input 
                            type="url"
                            value={formData.image_url || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                            placeholder="atau URL gambar..."
                          />
                        </div>

                        {/* 2. Baby Image */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Foto Anakan (Baby)</span>
                            <span className="text-[9px] font-bold text-amber-500 uppercase">Opsional</span>
                          </div>

                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 dark:border-slate-700">
                            {formData.image_url_baby ? (
                              <img src={formData.image_url_baby} alt="Baby Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Dna size={28} className="text-slate-400" />
                            )}
                          </div>

                          <label className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                            <Upload size={13} /> Upload File
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'image_url_baby')} 
                            />
                          </label>

                          <input 
                            type="url"
                            value={formData.image_url_baby || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url_baby: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                            placeholder="atau URL gambar..."
                          />
                        </div>

                        {/* 3. Eye Close-Up Image */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Detail Mata (Eye Focus)</span>
                            <span className="text-[9px] font-bold text-indigo-500 uppercase">Opsional</span>
                          </div>

                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 dark:border-slate-700">
                            {formData.image_url_eye ? (
                              <img src={formData.image_url_eye} alt="Eye Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Eye size={28} className="text-slate-400" />
                            )}
                          </div>

                          <label className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                            <Upload size={13} /> Upload File
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'image_url_eye')} 
                            />
                          </label>

                          <input 
                            type="url"
                            value={formData.image_url_eye || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url_eye: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                            placeholder="atau URL gambar..."
                          />
                        </div>

                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description (Historical & Visual)</label>
                        <textarea 
                          rows={6}
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-medium text-sm focus:border-emerald-500 transition-all no-scrollbar leading-relaxed"
                          placeholder="Jelaskan sejarah penemuan, ciri khas visual, dan keunikan morph ini secara mendalam..."
                        />
                      </div>
                    </section>

                    {/* Scientific Data */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Zap size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Scientific & Genetic Profile</h4>
                      </div>
                      
                      {/* 4. Genetic Formula (Multi-Select) */}
                      <SearchableMultiSelect
                        label="Genetic Formula (Multi-Select)"
                        sublabel="Komponen genetik terstruktur (contoh: Tremper Albino, Eclipse)"
                        placeholder="Cari gen atau ketik formula baru..."
                        selected={formData.genetic_formula || []}
                        onChange={(formulas) => setFormData(prev => ({ 
                          ...prev, 
                          genetic_formula: formulas,
                          genetics: formulas.join(' + ')
                        }))}
                        options={GENETIC_FORMULA_OPTIONS}
                        allowCustom={true}
                        customAddText="+ Add New Genetic Formula"
                        chipColor="indigo"
                        icon={<Dna size={14} />}
                      />

                      {/* 5. Genetic Warning (Template Warning Selector) */}
                      <GeneticWarningEditor
                        warnings={formData.genetic_warnings || []}
                        onChange={(warns) => setFormData(prev => ({
                          ...prev,
                          genetic_warnings: warns,
                          warnings: warns.map(w => `${w.title}: ${w.description}`).join(' | ')
                        }))}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 6. Genetic Signatures (Visual Traits) */}
                        <SearchableMultiSelect
                          label="Genetic Signatures (Visual Traits)"
                          sublabel="Ciri khas fenotipe visual (contoh: Red Eyes, White Tail)"
                          placeholder="Cari ciri khas visual..."
                          selected={formData.visual_traits || []}
                          onChange={(traits) => setFormData(prev => ({ 
                            ...prev, 
                            visual_traits: traits,
                            genetic_signatures: traits 
                          }))}
                          options={GENETIC_SIGNATURE_OPTIONS}
                          allowCustom={true}
                          customAddText="+ Add New Signature"
                          chipColor="emerald"
                          icon={<Zap size={14} />}
                        />

                        {/* 7. Combo Potential */}
                        <SearchableMultiSelect
                          label="Combo Potential (Compatibility)"
                          sublabel="Kompatibilitas kombinasi persilangan (contoh: Eclipse, Enigma)"
                          placeholder="Cari potensi combo..."
                          selected={formData.combo_compatibility || []}
                          onChange={(combos) => setFormData(prev => ({ 
                            ...prev, 
                            combo_compatibility: combos,
                            combo_potential: combos 
                          }))}
                          options={COMBO_POTENTIAL_OPTIONS}
                          allowCustom={true}
                          customAddText="+ Add New Combo"
                          chipColor="purple"
                          icon={<Sparkles size={14} />}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breeder Grading Guide (Selection Priority)</label>
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, selection_priority: [...(prev.selection_priority || []), ''] }))}
                            className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-3 py-1 rounded-lg hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                          >
                            + Add Guide Point
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.selection_priority?.map((point, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                type="text"
                                value={point}
                                onChange={(e) => {
                                  const newPoints = [...(formData.selection_priority || [])];
                                  newPoints[idx] = e.target.value;
                                  setFormData(prev => ({ ...prev, selection_priority: newPoints }));
                                }}
                                className="flex-1 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                placeholder="e.g. High orange saturation"
                              />
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, selection_priority: prev.selection_priority?.filter((_, i) => i !== idx) }))}
                                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {(!formData.selection_priority || formData.selection_priority.length === 0) && (
                          <div 
                            onClick={() => setFormData(prev => ({ ...prev, selection_priority: [''] }))}
                            className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-center cursor-pointer hover:border-emerald-500/20 transition-all"
                          >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No grading points added. Click to add the first guide.</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breeder Professional Insight</label>
                        <textarea 
                          rows={4}
                          value={formData.breeder_notes || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, breeder_notes: e.target.value }))}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-medium text-sm focus:border-emerald-500 transition-all no-scrollbar italic"
                          placeholder="Berikan tips spesifik untuk breeding, tantangan genetika, atau saran manajemen pakan..."
                        />
                      </div>
                    </section>

                    {/* Resources & References */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <LinkIcon size={16} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Citations & References</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Credited Breeders / Sources</label>
                            <input 
                              type="text"
                              value={formData.credited_breeders?.join(', ') || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, credited_breeders: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all"
                              placeholder="Ron Tremper, Mark Bell..."
                            />
                            <p className="text-[9px] text-slate-400 italic">Separate by comma.</p>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Discovery Year (Tahun)</label>
                            <input 
                              type="text"
                              value={formData.discovery_year || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, discovery_year: e.target.value }))}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all"
                              placeholder="e.g. 1996, 2004..."
                            />
                            <p className="text-[9px] text-slate-400 italic">Tahun penemuan awal morph.</p>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Search Tags</label>
                            <input 
                              type="text"
                              value={formData.tags?.join(', ') || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all font-mono"
                              placeholder="albino, raptor, gecko, research..."
                            />
                            <p className="text-[9px] text-slate-400 italic">Keywords for easier discovery.</p>
                         </div>
                      </div>

                      <div className="space-y-4 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <LinkIcon size={18} className="text-indigo-400" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Research Reference Links</h4>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, reference_links: [...(prev.reference_links || []), { title: '', url: '' }] }))}
                            className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                          >
                            + Add Link
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {formData.reference_links?.map((link, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <input 
                                type="text"
                                placeholder="Title (e.g. World Gecko Genetics Paper)"
                                value={link.title}
                                onChange={(e) => {
                                  const newLinks = [...(formData.reference_links || [])];
                                  newLinks[idx].title = e.target.value;
                                  setFormData(prev => ({ ...prev, reference_links: newLinks }));
                                }}
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                              />
                              <input 
                                type="url"
                                placeholder="URL (https://...)"
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...(formData.reference_links || [])];
                                  newLinks[idx].url = e.target.value;
                                  setFormData(prev => ({ ...prev, reference_links: newLinks }));
                                }}
                                className="flex-[2] px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:border-indigo-500 outline-none font-mono"
                              />
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, reference_links: prev.reference_links?.filter((_, i) => i !== idx) }))}
                                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          {(!formData.reference_links || formData.reference_links.length === 0) && (
                            <p className="text-[10px] text-slate-400 italic text-center py-4">No reference links added yet.</p>
                          )}
                        </div>
                      </div>
                    </section>

                    <div className="pb-12 pt-8 flex gap-4">
                       <button 
                         type="button" 
                         onClick={() => !isSaving && setIsModalOpen(false)}
                         className="flex-1 py-5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                       >
                         Discard Changes
                       </button>
                       <button 
                         disabled={isSaving}
                         type="submit"
                         className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                       >
                         {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                         {editingMorph ? 'Commit Research Update' : 'Publish New Research'}
                       </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
