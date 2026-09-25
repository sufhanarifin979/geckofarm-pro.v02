import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Check, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Venus as FemaleIcon,
  Mars as MaleIcon,
  HelpCircle,
  Camera,
  Layers,
  Scale,
  Activity,
  Calendar,
  Sparkles,
  Info,
  GitGraph,
  BookOpen
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gecko, UserProfile, WeightLog, ActivityLog } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, increment, getDocs, orderBy, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInYears, differenceInMonths } from 'date-fns';
import { cn, formatDateDMY, getParentLineageDisplay } from '../lib/utils';
import ConfirmationModal from './ConfirmationModal';
import LineageChart from './LineageChart';
import PedigreeSearchSelect from './PedigreeSearchSelect';
import { autoCropToSquare, uploadGeckoImage, deleteGeckoImage } from '../lib/imageUtils';
import Tooltip from './ui/Tooltip';
import { Loader2 } from 'lucide-react';
import { useGeckos } from '../GeckoProvider';

const AFT_PLACEHOLDERS = [
  "E.G. WHITEOUT HET OREO",
  "Whiteout",
  "Whiteout Het Oreo",
  "Oreo",
  "Ghost",
  "Zulu",
  "Granite",
  "Patternless",
  "Caramel Albino",
  "Whiteout Oreo"
];

interface RegistryProps {
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function Registry({ profile, setProfile }: RegistryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { geckos, loading, refreshData } = useGeckos();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGecko, setSelectedGecko] = useState<Gecko | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'details' | 'lineage'>('details');
  const [editingGecko, setEditingGecko] = useState<Gecko | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [geckoToDelete, setGeckoToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aftPlaceholder, setAftPlaceholder] = useState("E.G. WHITEOUT HET OREO");

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const initialFormData: Partial<Gecko> = {
    name: '',
    morph: '',
    birthDate: '',
    gender: 'unsex',
    status: 'available',
    albinoStrain: 'None',
    species: 'Leopard Gecko',
    sireId: '',
    damId: '',
    sireName: '',
    damName: '',
    sireMorph: '',
    damMorph: '',
    info: '',
    note: '',
    photoUrl: '',
    photos: [],
    purchasePrice: undefined
  };

  // Form states
  const [formData, setFormData] = useState<Partial<Gecko>>(initialFormData);
  const [sellWorkflow, setSellWorkflow] = useState<{
    isOpen: boolean;
    geckoId?: string;
    geckoName: string;
    geckoMorph: string;
    purchasePrice: number;
    salePrice: string;
    buyer: string;
    date: string;
    notes?: string;
  } | null>(null);
  const [pendingSale, setPendingSale] = useState<{
    salePrice: number;
    buyer: string;
    date: string;
    notes?: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [viewSlideIndex, setViewSlideIndex] = useState(0);

  const [displayLimit, setDisplayLimit] = useState(4);

  useEffect(() => {
    if (selectedGecko?.id && isViewModalOpen) {
      fetchLogs(selectedGecko.id);
      fetchAiInsight(selectedGecko.id);
      setActiveViewTab('details');
      setViewSlideIndex(0);
    }
  }, [selectedGecko, isViewModalOpen]);

  // Handle auto-open and prefilled data from Hatching flow
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoOpen && state?.prefilledData) {
      const prefilled = state.prefilledData;
      setFormData(prev => ({
        ...initialFormData,
        ...prefilled
      }));
      const prefilledPhotos = (prefilled.photos && prefilled.photos.length > 0)
        ? prefilled.photos
        : (prefilled.photoUrl ? [prefilled.photoUrl] : []);
      setFormPhotos(prefilledPhotos);
      setActivePhotoIndex(0);
      setIsModalOpen(true);
      
      // Clean up state so it doesn't trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Helper for age formatting
  const getAge = (birthDate: string) => {
    if (!birthDate) return "0y 0m";
    try {
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return "0y 0m";
      const now = new Date();
      
      const totalMonths = differenceInMonths(now, birth);
      if (totalMonths < 0) return "0y 0m";
      
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return `${years}y ${months}m`;
    } catch (e) {
      return "0y 0m";
    }
  };

  const currentSire = geckos.find(g => g.id === selectedGecko?.sireId);
  const currentDam = geckos.find(g => g.id === selectedGecko?.damId);

  // Grandparents lookups
  const sireOfSire = currentSire ? geckos.find(g => g.id === currentSire.sireId) : null;
  const damOfSire = currentSire ? geckos.find(g => g.id === currentSire.damId) : null;
  const sireOfDam = currentDam ? geckos.find(g => g.id === currentDam.sireId) : null;
  const damOfDam = currentDam ? geckos.find(g => g.id === currentDam.damId) : null;

  const fetchLogs = async (geckoId: string) => {
    const wRef = collection(db, 'geckos', geckoId, 'weight_history');
    const aRef = collection(db, 'geckos', geckoId, 'activity_logs');
    
    const [wSnap, aSnap] = await Promise.all([
      getDocs(query(wRef, orderBy('date', 'desc'))),
      getDocs(query(aRef, orderBy('date', 'desc')))
    ]);

    setWeightLogs(wSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightLog)));
    setActivityLogs(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
  };

  const fetchAiInsight = async (geckoId: string) => {
    try {
      const res = await fetch('/api/geckos/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geckoId })
      });
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (e) {
      console.error(e);
    }
  };

  const onSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex?: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const readFileAndCrop = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const result = reader.result?.toString() || '';
          if (result) {
            try {
              const cropped = await autoCropToSquare(result);
              resolve(cropped);
            } catch {
              resolve(result);
            }
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    };

    try {
      const croppedList: string[] = [];
      for (const file of files) {
        const cropped = await readFileAndCrop(file);
        if (cropped) croppedList.push(cropped);
      }

      if (croppedList.length === 0) return;

      setFormPhotos(prev => {
        let updated = [...prev];
        if (targetIndex !== undefined) {
          updated[targetIndex] = croppedList[0];
        } else {
          for (const item of croppedList) {
            if (updated.length < 3) {
              updated.push(item);
            }
          }
        }
        const trimmed = updated.slice(0, 3);
        setFormData(fd => ({
          ...fd,
          photos: trimmed,
          photoUrl: trimmed[0] || ''
        }));
        return trimmed;
      });

      if (targetIndex !== undefined) {
        setActivePhotoIndex(targetIndex);
      } else {
        setActivePhotoIndex(prev => Math.min(prev, 2));
      }
    } catch (err) {
      console.error("Error processing photos:", err);
      addToast("Gagal memproses foto", "error");
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFormPhotos(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setFormData(fd => ({
        ...fd,
        photos: updated,
        photoUrl: updated[0] || ''
      }));
      return updated;
    });
    setActivePhotoIndex(prev => {
      if (prev >= indexToRemove && prev > 0) return prev - 1;
      return 0;
    });
  };

  const handleSetMainPhoto = (index: number) => {
    if (index === 0) return;
    setFormPhotos(prev => {
      const target = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      const updated = [target, ...rest];
      setFormData(fd => ({
        ...fd,
        photos: updated,
        photoUrl: updated[0] || ''
      }));
      return updated;
    });
    setActivePhotoIndex(0);
    addToast("Foto utama diperbarui!");
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.morph?.trim()) errors.morph = 'Morph is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!validateForm()) {
      return;
    }

    if (!editingGecko && profile.geckoCount >= profile.planLimit) {
      addToast("Registration quota exceeded. Upgrade to Premium for more slots.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('[DEBUG] Starting handleSubmit sequence (base64 mode)');
      
      // Process all photos
      const processedPhotos: string[] = [];
      for (let i = 0; i < formPhotos.length; i++) {
        const photo = formPhotos[i];
        if (photo.startsWith('data:image')) {
          setUploadProgress(Math.round(((i + 0.5) / formPhotos.length) * 80));
          const compressed = await uploadGeckoImage(profile.uid, '', photo);
          processedPhotos.push(compressed);
        } else {
          processedPhotos.push(photo);
        }
      }
      setUploadProgress(90);

      const finalPhotoUrl = processedPhotos[0] || '';

      const batch = writeBatch(db);
      let geckoId = editingGecko?.id;
      const isEditing = !!geckoId;

      if (!isEditing) {
        console.log('[DEBUG] Mode: New Registration');
        const newGeckoRef = doc(collection(db, 'geckos'));
        geckoId = newGeckoRef.id;
        
        const rawData = { 
          ...formData, 
          photoUrl: finalPhotoUrl,
          photos: processedPhotos,
          ownerId: profile.uid,
          createdAt: serverTimestamp(),
          gecko_id: geckoId
        };
        const finalData = Object.fromEntries(
          Object.entries(rawData).filter(([key, value]) => value !== undefined && key !== 'id')
        );
        batch.set(newGeckoRef, finalData);
        batch.update(doc(db, 'users', profile.uid), { geckoCount: increment(1) });
      } else {
        console.log('[DEBUG] Mode: Edit Profile', { geckoId });
        const rawData = { 
          ...formData, 
          photoUrl: finalPhotoUrl, 
          photos: processedPhotos,
          ownerId: profile.uid,
          createdAt: formData.createdAt || serverTimestamp()
        };
        const finalData = Object.fromEntries(
          Object.entries(rawData).filter(([key, value]) => value !== undefined && key !== 'id')
        );
        batch.update(doc(db, 'geckos', geckoId!), finalData);
      }

      // Automatically create a sale transaction on Finance if status is 'sold' and pendingSale is defined
      if (formData.status === 'sold' && pendingSale) {
        const newTransRef = doc(collection(db, 'finance_transactions'));
        batch.set(newTransRef, {
          userId: profile.uid,
          type: 'sale',
          category: 'gecko_sale',
          amount: pendingSale.salePrice,
          geckoId: geckoId,
          buyer: pendingSale.buyer,
          date: pendingSale.date,
          notes: pendingSale.notes || '',
          createdAt: serverTimestamp()
        });
      }

      // Commit everything in one go
      console.log('[DEBUG] Committing Firestore batch');
      await batch.commit();
      console.log('[DEBUG] Firestore data saved');
      
      try {
        await refreshData();
      } catch (e) {
        console.warn("Soft refresh failed after gecko save:", e);
      }
      
      if (!isEditing) {
        setProfile(prev => prev ? { ...prev, geckoCount: prev.geckoCount + 1 } : null);
      }
      resetForm();
      addToast(isEditing ? "Profil berhasil diperbarui!" : "Gecko baru berhasil diregistrasi!");
    } catch (error) {
      console.error("[DEBUG] handleSubmit global catch", error);
      let errorMsg = "Gagal menyimpan data.";
      
      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
          errorMsg = "Akses ditolak. Pastikan Anda sudah login dengan benar dan akun Anda aktif.";
        } else if (error.message.includes("quota-exceeded")) {
          errorMsg = "Kuota penyimpanan penuh. Silakan upgrade plan Anda.";
        } else {
          errorMsg = `Terjadi kesalahan: ${error.message}`;
        }
      }
      
      addToast(errorMsg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setFormPhotos([]);
    setActivePhotoIndex(0);
    setIsModalOpen(false);
    setEditingGecko(null);
    setIsUploading(false);
    setPendingSale(null);
    setAftPlaceholder("E.G. WHITEOUT HET OREO");
  };

  const handleConfirmSale = async () => {
    if (!profile || !sellWorkflow) return;
    const saleAmt = parseFloat(sellWorkflow.salePrice);
    if (isNaN(saleAmt) || saleAmt < 0) {
      addToast("Harga penjualan tidak valid.", "error");
      return;
    }

    try {
      setFormData(prev => ({ ...prev, status: 'sold' }));
      setPendingSale({
        salePrice: saleAmt,
        buyer: sellWorkflow.buyer.trim() || '',
        date: sellWorkflow.date,
        notes: (sellWorkflow.notes || '').trim()
      });
      setSellWorkflow(null);
      addToast("Rincian penjualan disimpan! Ingat untuk menekan tombol 'Simpan' di form utama.");
    } catch (err: any) {
      console.error("Error confirming sale:", err);
      addToast("Gagal memproses rincian penjualan: " + err.message, "error");
    }
  };

  const handleCancelSale = () => {
    setFormData(prev => ({ 
      ...prev, 
      status: editingGecko?.status || 'available' 
    }));
    setSellWorkflow(null);
  };

  const handleEdit = (gecko: Gecko) => {
    setEditingGecko(gecko);
    const geckoSpecies = gecko.species || 'Leopard Gecko';
    const existingPhotos = (gecko.photos && gecko.photos.length > 0)
      ? [...gecko.photos]
      : (gecko.photoUrl ? [gecko.photoUrl] : []);

    setFormData({
      name: gecko.name || '',
      morph: gecko.morph || '',
      birthDate: gecko.birthDate || '',
      gender: gecko.gender || 'unsex',
      status: gecko.status || 'available',
      albinoStrain: gecko.albinoStrain || 'None',
      species: geckoSpecies,
      sireId: gecko.sireId || '',
      damId: gecko.damId || '',
      sireName: gecko.sireName || '',
      damName: gecko.damName || '',
      sireMorph: gecko.sireMorph || '',
      damMorph: gecko.damMorph || '',
      info: gecko.info || '',
      note: gecko.note || '',
      photoUrl: existingPhotos[0] || '',
      photos: existingPhotos,
      createdAt: gecko.createdAt,
      purchasePrice: gecko.purchasePrice
    });
    setFormPhotos(existingPhotos);
    setActivePhotoIndex(0);
    if (geckoSpecies === 'African Fat-Tailed Gecko') {
      const rand = AFT_PLACEHOLDERS[Math.floor(Math.random() * AFT_PLACEHOLDERS.length)];
      const prefix = rand.toUpperCase().startsWith("E.G.") ? "" : "E.G. ";
      setAftPlaceholder(`${prefix}${rand}`.toUpperCase());
    } else {
      setAftPlaceholder("E.G. WHITEOUT HET OREO");
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'geckos', id));
      batch.update(doc(db, 'users', profile.uid), { geckoCount: increment(-1) });
      await batch.commit();
      
      try {
        await refreshData();
      } catch (e) {
        console.warn("Soft refresh failed after gecko delete:", e);
      }
      
      // Also delete image from storage (best effort)
      await deleteGeckoImage(profile.uid, id);
      
      setProfile(prev => prev ? { ...prev, geckoCount: Math.max(0, prev.geckoCount - 1) } : null);
      addToast("Gecko berhasil dihapus.");
    } catch (error) {
      console.error(error);
      addToast("Gagal menghapus gecko.", "error");
    }
  };

  const filteredGeckos = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = geckos.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(q) || 
                           g.morph.toLowerCase().includes(q);
      const matchesGender = genderFilter === 'all' || g.gender === genderFilter;
      const matchesSpecies = speciesFilter === 'all' || (g.species || 'Leopard Gecko') === speciesFilter;
      const statusLower = (g.status || 'available').toLowerCase();
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'available' && statusLower === 'available') ||
                            (statusFilter === 'holdback' && (statusLower === 'holdback' || statusLower === 'keep')) ||
                            (statusFilter === 'sold' && statusLower === 'sold');
      return matchesSearch && matchesGender && matchesSpecies && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const getMs = (g: Gecko) => {
        if (!g.createdAt) return Infinity;
        if (typeof g.createdAt.toMillis === 'function') return g.createdAt.toMillis();
        if (typeof g.createdAt.toDate === 'function') return g.createdAt.toDate().getTime();
        if (g.createdAt.seconds !== undefined) return g.createdAt.seconds * 1000 + Math.floor((g.createdAt.nanoseconds || 0) / 1000000);
        const parsed = Date.parse(g.createdAt);
        if (!isNaN(parsed)) return parsed;
        if (typeof g.createdAt === 'number') return g.createdAt;
        return 0;
      };
      const msA = getMs(a);
      const msB = getMs(b);
      if (msB !== msA) return msB - msA;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [geckos, search, genderFilter, speciesFilter, statusFilter]);

  useEffect(() => {
    setDisplayLimit(4);
  }, [search, genderFilter, speciesFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-1">Stock Collection</h2>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gecko Registry</h1>
        </div>
        <Tooltip content="Add a new gecko to your collection">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full sm:w-auto btn-primary py-4 px-8 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Gecko
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={18} />
          </div>
          <input 
            type="text" 
            placeholder="SEARCH BY NAME OR MORPH..." 
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all uppercase placeholder:text-slate-500 tracking-wider"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>

        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {/* Species Filter */}
          <div className="flex bg-white p-1 h-14 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            {['all', 'Leopard Gecko', 'African Fat-Tailed Gecko'].map(s => (
              <button
                key={s}
                onClick={() => setSpeciesFilter(s)}
                className={`flex-1 px-4 sm:px-6 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex items-center justify-center min-w-[70px] ${
                  speciesFilter === s 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                {s === 'all' ? 'All' : (s === 'Leopard Gecko' ? 'Leopard' : 'AFT')}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex bg-white p-1 h-14 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            {['all', 'male', 'female', 'unsex'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`flex-1 px-4 sm:px-6 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex items-center justify-center min-w-[70px] ${
                  genderFilter === g 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end -mt-1 md:-mt-3">
        <div className="flex bg-white p-1 h-14 rounded-2xl border border-slate-200 shadow-sm shrink-0 w-full md:w-auto">
          {['all', 'available', 'holdback', 'sold'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 px-3 sm:px-6 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden flex items-center justify-center min-w-[70px] sm:min-w-[90px] ${
                statusFilter === st 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative w-16 h-16"
          >
            <div className="absolute inset-0 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
              <img 
                src="https://i.ibb.co.com/chZdXkQz/Logo.png" 
                alt="Logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity text-emerald-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
                }}
              />
            </div>
          </motion.div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Syncing Records</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredGeckos.slice(0, displayLimit).map((gecko) => (
              <motion.div 
                key={gecko.id} 
                className="bg-white px-4 pt-2.5 pb-1.5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between m-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0 relative overflow-hidden ring-2 ring-slate-50 group-hover:ring-emerald-100 transition-all">
                    {gecko.photoUrl || (gecko.photos && gecko.photos[0]) ? (
                      <img src={gecko.photoUrl || gecko.photos?.[0]} alt={gecko.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Camera size={20} />
                      </div>
                    )}
                    {gecko.photos && gecko.photos.length > 1 && (
                      <div className="absolute top-1 right-1 px-1 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] font-black text-white flex items-center gap-0.5 shadow-sm leading-none">
                        <Layers size={8} />
                        <span>{gecko.photos.length}</span>
                      </div>
                    )}
                    <div className={`absolute bottom-0 inset-x-0 h-1.5 ${
                       gecko.gender === 'male' ? 'bg-blue-500' : 
                       gecko.gender === 'female' ? 'bg-rose-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight whitespace-normal">{gecko.name}</h3>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        gecko.status === 'keep' 
                          ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                          : gecko.status === 'sold' 
                          ? 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.5)]' 
                          : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      }`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-bold text-slate-600 tracking-tight uppercase whitespace-normal leading-tight">{gecko.morph}</p>
                      <Tooltip content="Search morph in Knowledge Base">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/knowledge?q=${encodeURIComponent(gecko.morph)}`);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-emerald-500 transition-colors"
                        >
                          <BookOpen size={10} />
                        </button>
                      </Tooltip>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-1.5 flex">
                      {(() => {
                        const s = (gecko.status || 'available').toLowerCase();
                        if (s === 'keep' || s === 'holdback') {
                          return (
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-blue-100/60 text-blue-800 border border-blue-200/30">
                              Holdback
                            </span>
                          );
                        } else if (s === 'sold') {
                          return (
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/30">
                              Sold
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-emerald-100/60 text-emerald-800 border border-emerald-200/30">
                              Available
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-[3px] mb-1 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Tooltip content="View Details">
                      <button 
                        onClick={() => { setSelectedGecko(gecko); setIsViewModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Eye size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Edit Profile">
                      <button 
                        onClick={() => handleEdit(gecko)}
                        className="p-2.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Edit2 size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Remove Gecko">
                      <button 
                        onClick={() => { setGeckoToDelete(gecko.id!); setIsDeleteModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-slate-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>

                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${
                    gecko.gender === 'male' ? 'bg-blue-50 text-blue-600' : 
                    gecko.gender === 'female' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {gecko.gender}
                  </span>
                </div>
              </motion.div>
            ))}
            {filteredGeckos.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 text-slate-400">
                 <Layers size={32} className="mx-auto mb-2 opacity-50" />
                 <p className="text-xs font-bold uppercase tracking-widest">No matching geckos</p>
              </div>
            )}
          </div>

          {filteredGeckos.length > displayLimit && (
            <div className="flex justify-center mt-4">
              <Tooltip content="Load more geckos">
                <button 
                  onClick={() => setDisplayLimit(prev => prev + 4)}
                  className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2"
                >
                  Lihat Lainnya
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-[90vw] sm:max-w-xs transition-all">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "w-full px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-xl",
                toast.type === 'success' ? "bg-slate-900 border-slate-800" : "bg-rose-600 border-rose-500"
              )}
            >
              {toast.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-rose-600">
                  <AlertTriangle size={12} />
                </div>
              )}
              <p className="text-[11px] font-black text-white uppercase tracking-wider">{toast.message}</p>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-auto text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedGecko && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setIsViewModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg max-h-[95vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            >
               <Tooltip content="Close details" position="left">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-black/40 transition-all"
                >
                  <X size={18} />
                </button>
              </Tooltip>

              {/* Header Image 1:1 with Multi-Photo Slide Carousel */}
              {(() => {
                const detailPhotos = (selectedGecko.photos && selectedGecko.photos.length > 0)
                  ? selectedGecko.photos
                  : (selectedGecko.photoUrl ? [selectedGecko.photoUrl] : []);

                return (
                  <div className="w-full aspect-square bg-slate-900 relative flex-shrink-0 overflow-hidden select-none group">
                    {detailPhotos.length > 0 ? (
                      <>
                        <motion.img 
                          key={viewSlideIndex}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          src={detailPhotos[viewSlideIndex] || detailPhotos[0]} 
                          alt={`${selectedGecko.name} - Foto ${viewSlideIndex + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                          loading="lazy" 
                        />

                        {/* Navigation controls if more than 1 photo */}
                        {detailPhotos.length > 1 && (
                          <>
                            {/* Prev Button */}
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewSlideIndex(prev => (prev === 0 ? detailPhotos.length - 1 : prev - 1));
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-lg active:scale-95 z-20 cursor-pointer"
                              aria-label="Foto sebelumnya"
                            >
                              <ChevronLeft size={20} />
                            </button>

                            {/* Next Button */}
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewSlideIndex(prev => (prev === detailPhotos.length - 1 ? 0 : prev + 1));
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-lg active:scale-95 z-20 cursor-pointer"
                              aria-label="Foto berikutnya"
                            >
                              <ChevronRight size={20} />
                            </button>

                            {/* Counter Badge */}
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 z-20 flex items-center gap-1.5 shadow-sm">
                              <span>{viewSlideIndex + 1}</span>
                              <span className="opacity-40">/</span>
                              <span>{detailPhotos.length}</span>
                            </div>

                            {/* Bottom Dots */}
                            <div className="absolute bottom-3 inset-x-0 flex flex-col items-center gap-2 z-20 pointer-events-none">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/15 pointer-events-auto shadow-lg">
                                {detailPhotos.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewSlideIndex(idx);
                                    }}
                                    className={`h-2 rounded-full transition-all cursor-pointer ${
                                      viewSlideIndex === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/50 hover:bg-white'
                                    }`}
                                    aria-label={`Slide ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                        <Camera size={64} className="mb-2 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Photo Available</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tabs */}
              <div className="flex bg-slate-50/50 px-4 sm:px-8 py-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex w-full justify-between items-center gap-4">
                  <Tooltip content="Show general information">
                    <button 
                      onClick={() => setActiveViewTab('details')}
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        activeViewTab === 'details' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Info size={14} />
                      Details
                    </button>
                  </Tooltip>
                  <Tooltip content="Show lineage chart">
                    <button 
                      onClick={() => setActiveViewTab('lineage')}
                      className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        activeViewTab === 'lineage' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <GitGraph size={14} />
                      Lineage
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                {activeViewTab === 'details' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                      <div className="flex-1 min-w-0 w-full">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight break-words">{selectedGecko.name}</h2>
                        <div className="mt-3 space-y-3">
                          <p className="text-sm sm:text-lg font-bold text-emerald-600 uppercase tracking-widest leading-relaxed break-words">
                            {selectedGecko.morph}
                          </p>
                          <Tooltip content="Open Encyclopedia">
                            <button 
                              onClick={() => navigate(`/knowledge?q=${encodeURIComponent(selectedGecko.morph)}`)}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            >
                              <BookOpen size={12} />
                              Cari di Ensiklopedia
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        selectedGecko.gender === 'male' ? 'bg-blue-100 text-blue-600' :
                        selectedGecko.gender === 'female' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {selectedGecko.gender}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Row 1: Albino Strain & Hatch Date */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50 relative">
                        <div className="space-y-1 pr-4 border-r border-slate-100">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Albino Strain</div>
                          <div className="text-base font-black text-emerald-600">
                            {selectedGecko.albinoStrain && selectedGecko.albinoStrain !== 'None' ? selectedGecko.albinoStrain : 'None'}
                          </div>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Hatch Date</div>
                          <div className="text-base font-black text-slate-800">{formatDateDMY(selectedGecko.birthDate)}</div>
                        </div>
                      </div>

                      {/* Row 2: Sire & Dam Lineage */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50 relative">
                        <div className="space-y-1 pr-4 border-r border-slate-100">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sire Lineage</div>
                          <div className="text-sm font-bold text-slate-800 uppercase leading-snug break-words">
                            {getParentLineageDisplay('sire', selectedGecko, geckos).display}
                          </div>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Dam Lineage</div>
                          <div className="text-sm font-bold text-slate-800 uppercase leading-snug break-words">
                            {getParentLineageDisplay('dam', selectedGecko, geckos).display}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Purchase Price & Status */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50 relative">
                        <div className="space-y-1 pr-4 border-r border-slate-100">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Purchase Price</div>
                          <div className="text-base font-black text-slate-800">
                            {selectedGecko.purchasePrice ? `Rp ${selectedGecko.purchasePrice.toLocaleString('id-ID')}` : '-'}
                          </div>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status</div>
                          {(() => {
                            const s = (selectedGecko.status || 'available').toLowerCase();
                            if (s === 'keep' || s === 'holdback') {
                              return <div className="text-base font-black text-blue-600">Holdback</div>;
                            } else if (s === 'sold') {
                              return <div className="text-base font-black text-slate-500">Sold</div>;
                            } else {
                              return <div className="text-base font-black text-emerald-600">Available</div>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {selectedGecko.info && (
                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 italic font-medium text-slate-800 text-sm leading-relaxed">
                        "{selectedGecko.info}"
                      </div>
                    )}

                    {selectedGecko.note && (
                      <div className="mt-4 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-slate-900 text-sm leading-relaxed">
                        <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Internal Note</div>
                        {selectedGecko.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LineageChart 
                      subject={selectedGecko} 
                      allGeckos={geckos} 
                      onSelectGecko={(g) => setSelectedGecko(g)}
                    />
                    
                    {/* Genetic Intelligence Legend */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">Genetic Trait Indicators</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: 'Tremper', color: 'bg-orange-400' },
                          { name: 'Bell', color: 'bg-red-400' },
                          { name: 'Rainwater', color: 'bg-yellow-400' },
                          { name: 'Eclipse', color: 'bg-slate-900' },
                          { name: 'Mack Snow', color: 'bg-slate-300' },
                          { name: 'Enigma', color: 'bg-purple-400' },
                          { name: 'Black Night', color: 'bg-slate-950' },
                          { name: 'Pied', color: 'bg-white border-slate-200' },
                        ].map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full shadow-sm ${t.color}`} />
                             <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight">{t.name}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-[8px] font-medium text-slate-600 italic">
                        * Trait dots appear automatically based on name and morph descriptions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Add Modal - Simplified to same design */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={resetForm}
            />
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            >
                <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-30">
                   <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{editingGecko ? 'Edit' : 'Add'} Gecko Profile</h2>
                   <Tooltip content="Cancel and close">
                     <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                   </Tooltip>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                    <form id="gecko-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pb-12">
                        <div className="space-y-6">
                            {/* Multi-Photo Slide & Upload Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">
                                        Foto Gecko ({formPhotos.length}/3)
                                    </label>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Slide Multi-Foto
                                    </span>
                                </div>

                                {/* Main Preview Area */}
                                <div className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                                    {formPhotos.length > 0 && formPhotos[activePhotoIndex] ? (
                                        <div className="relative w-full h-full bg-slate-900">
                                            <img 
                                                src={formPhotos[activePhotoIndex]} 
                                                alt={`Gecko preview ${activePhotoIndex + 1}`}
                                                className="w-full h-full object-cover" 
                                                referrerPolicy="no-referrer"
                                            />

                                            {/* Badge Info */}
                                            <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
                                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-white/20">
                                                    Foto {activePhotoIndex + 1} / {formPhotos.length}
                                                </span>
                                                {activePhotoIndex === 0 && (
                                                    <span className="px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
                                                        Utama
                                                    </span>
                                                )}
                                            </div>

                                            {/* Slide Arrows (if more than 1 photo) */}
                                            {formPhotos.length > 1 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePhotoIndex(prev => (prev === 0 ? formPhotos.length - 1 : prev - 1))}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95 z-10 cursor-pointer"
                                                        aria-label="Foto sebelumnya"
                                                    >
                                                        <ChevronLeft size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePhotoIndex(prev => (prev === formPhotos.length - 1 ? 0 : prev + 1))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95 z-10 cursor-pointer"
                                                        aria-label="Foto berikutnya"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </>
                                            )}

                                            {/* Overlay Controls */}
                                            <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-2 z-10 flex-wrap">
                                                <Tooltip content="Ganti foto slot ini">
                                                    <label className="px-3.5 py-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-white/20 cursor-pointer hover:bg-black/80 transition-all flex items-center gap-1.5 shadow-sm">
                                                        <Upload size={12} />
                                                        <span>Ganti</span>
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={(e) => onSelectFiles(e, activePhotoIndex)} 
                                                        />
                                                    </label>
                                                </Tooltip>

                                                {activePhotoIndex !== 0 && (
                                                    <Tooltip content="Jadikan foto utama (tampil di ID Card & Label)">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetMainPhoto(activePhotoIndex)}
                                                            className="px-3.5 py-2 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-emerald-400/30 hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                        >
                                                            <Check size={12} />
                                                            <span>Set Utama</span>
                                                        </button>
                                                    </Tooltip>
                                                )}

                                                <Tooltip content="Hapus foto dari slot ini">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePhoto(activePhotoIndex)}
                                                        className="px-3.5 py-2 bg-rose-600/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-rose-400/30 hover:bg-rose-600 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Hapus</span>
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ) : (
                                        <Tooltip content="Pilih foto untuk gecko Anda (hingga 3 foto)">
                                            <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center hover:bg-slate-100/50 transition-colors p-6">
                                                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Camera size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest block">Upload Foto Gecko</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 block">Maks. 3 foto (slide) • Format kotak disarankan</span>
                                                    <span className="text-[9px] font-semibold text-emerald-600 mt-2 inline-block px-3 py-1 bg-emerald-50 rounded-full">Bisa pilih 1 - 3 foto sekaligus</span>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={(e) => onSelectFiles(e)} 
                                                />
                                            </label>
                                        </Tooltip>
                                    )}
                                </div>

                                {/* 3 Photo Thumbnails / Slots */}
                                <div className="grid grid-cols-3 gap-2.5 pt-1">
                                    {[0, 1, 2].map((slotIdx) => {
                                        const photo = formPhotos[slotIdx];
                                        const isActive = formPhotos.length > 0 && activePhotoIndex === slotIdx;
                                        
                                        return (
                                            <div 
                                                key={slotIdx}
                                                onClick={() => {
                                                    if (photo) {
                                                        setActivePhotoIndex(slotIdx);
                                                    }
                                                }}
                                                className={`aspect-square rounded-2xl relative overflow-hidden transition-all flex flex-col items-center justify-center ${
                                                    isActive 
                                                        ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-sm' 
                                                        : 'hover:border-slate-300'
                                                } ${
                                                    photo 
                                                        ? 'bg-slate-900 cursor-pointer' 
                                                        : 'bg-slate-50 border-2 border-dashed border-slate-200'
                                                }`}
                                            >
                                                {photo ? (
                                                    <>
                                                        <img 
                                                            src={photo} 
                                                            alt={`Slot ${slotIdx + 1}`} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] font-black text-white uppercase tracking-wider">
                                                            {slotIdx === 0 ? 'Utama' : `#${slotIdx + 1}`}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemovePhoto(slotIdx);
                                                            }}
                                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm"
                                                            title="Hapus foto"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center group/slot">
                                                        <Plus size={16} className="text-slate-400 group-hover/slot:text-emerald-500 transition-colors" />
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mt-1">
                                                            {slotIdx === 0 ? '+ Utama' : `+ Foto ${slotIdx + 1}`}
                                                        </span>
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={(e) => onSelectFiles(e, slotIdx)} 
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[9px] font-medium text-slate-400 italic px-1">
                                    * Foto #1 otomatis digunakan sebagai foto utama pada ID Card & Label.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] px-1">Sexing Selection</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['male', 'female', 'unsex'].map(g => (
                                      <button 
                                        key={g}
                                        type="button" 
                                        onClick={() => setFormData(prev => ({...prev, gender: g as any}))}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                          formData.gender === g 
                                            ? 'bg-emerald-500 text-white shadow-md' 
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                      >
                                          {g === 'male' ? <MaleIcon size={14} /> : 
                                          g === 'female' ? <FemaleIcon size={14} /> : 
                                          <HelpCircle size={14} />}
                                          <span>{g}</span>
                                      </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">
                                  Species
                                </label>
                                <select 
                                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none focus:border-emerald-500 transition-all outline-none" 
                                  value={formData.species || 'Leopard Gecko'} 
                                  onChange={e => {
                                    const newSpecies = e.target.value as any;
                                    setFormData({
                                      ...formData,
                                      species: newSpecies,
                                      albinoStrain: 'None'
                                    });
                                    if (newSpecies === 'African Fat-Tailed Gecko') {
                                      const rand = AFT_PLACEHOLDERS[Math.floor(Math.random() * AFT_PLACEHOLDERS.length)];
                                      const prefix = rand.toUpperCase().startsWith("E.G.") ? "" : "E.G. ";
                                      setAftPlaceholder(`${prefix}${rand}`.toUpperCase());
                                    }
                                  }}
                                >
                                    <option value="Leopard Gecko">Leopard Gecko</option>
                                    <option value="African Fat-Tailed Gecko">African Fat-Tailed Gecko</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex justify-between px-1">
                                  Gecko Name
                                  {formErrors.name && <span className="text-red-500 text-[8px] animate-pulse">{formErrors.name}</span>}
                                </label>
                                <input 
                                  placeholder="e.g. Apollo"
                                  className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold transition-all text-sm uppercase ${
                                    formErrors.name ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-emerald-500'
                                  }`} 
                                  value={formData.name} 
                                  onChange={e => {
                                    setFormData({...formData, name: e.target.value.toUpperCase()});
                                    if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}));
                                  }} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex justify-between px-1">
                                  Morph Genetics
                                  {formErrors.morph && <span className="text-red-500 text-[8px] animate-pulse">{formErrors.morph}</span>}
                                </label>
                                <input 
                                  placeholder={formData.species === 'African Fat-Tailed Gecko' ? aftPlaceholder : "e.g. Mack Snow Eclipse"}
                                  className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold transition-all text-sm uppercase ${
                                    formErrors.morph ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-emerald-500'
                                  }`} 
                                  value={formData.morph} 
                                  onChange={e => {
                                    setFormData({...formData, morph: e.target.value.toUpperCase()});
                                    if (formErrors.morph) setFormErrors(prev => ({...prev, morph: ''}));
                                  }} 
                                />
                            </div>
                            {formData.species !== 'African Fat-Tailed Gecko' && (
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">
                                    Albino Strain
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['None', 'Tremper', 'Bell', 'Rainwater'].map(strain => (
                                      <button
                                        key={strain}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, albinoStrain: strain as any }))}
                                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                          formData.albinoStrain === strain
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                      >
                                        {strain}
                                      </button>
                                    ))}
                                  </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="min-h-[2.25rem] flex items-end">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 pb-1">Birth/Hatch Date</label>
                                    </div>
                                    <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <div className="min-h-[2.25rem] flex items-end">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 pb-1">Availability</label>
                                    </div>
                                    <select 
                                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none" 
                                      value={formData.status} 
                                      onChange={e => {
                                        const newStatus = e.target.value as any;
                                        if (newStatus === 'sold' && formData.status !== 'sold') {
                                          setSellWorkflow({
                                            isOpen: true,
                                            geckoId: editingGecko?.id || '',
                                            geckoName: formData.name || 'Unnamed Gecko',
                                            geckoMorph: formData.morph || 'Unknown Morph',
                                            purchasePrice: formData.purchasePrice || 0,
                                            salePrice: '',
                                            buyer: '',
                                            date: new Date().toISOString().split('T')[0],
                                            notes: ''
                                          });
                                        } else {
                                          setFormData({...formData, status: newStatus});
                                        }
                                      }}
                                    >
                                        <option value="available">Available</option>
                                        <option value="keep">Holdback</option>
                                        <option value="sold">Sold</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <div className="min-h-[2.25rem] flex items-end">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 pb-1">Purchase Price (Rp)</label>
                                    </div>
                                    <input 
                                      type="number" 
                                      placeholder="e.g. 500000"
                                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" 
                                      value={formData.purchasePrice !== undefined ? formData.purchasePrice : ''} 
                                      onChange={e => setFormData({...formData, purchasePrice: e.target.value ? Number(e.target.value) : undefined})} 
                                    />
                                </div>
                            </div>

                            {/* Sire & Dam Pedigree Search & Selection */}
                            <div className="space-y-4">
                                <PedigreeSearchSelect
                                  label="Sire Pedigree (Father)"
                                  type="sire"
                                  species={formData.species || 'Leopard Gecko'}
                                  currentGeckoId={editingGecko?.id}
                                  allGeckos={geckos}
                                  selectedId={formData.sireId}
                                  manualName={formData.sireName}
                                  onSelect={(gecko) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      sireId: gecko ? gecko.id : '',
                                      sireName: gecko ? gecko.name : prev.sireName,
                                      sireMorph: gecko ? gecko.morph : prev.sireMorph
                                    }));
                                  }}
                                  onManualNameChange={(name) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      sireName: name,
                                      sireId: prev.sireId && geckos.find(g => g.id === prev.sireId)?.name !== name ? '' : prev.sireId
                                    }));
                                  }}
                                />

                                <PedigreeSearchSelect
                                  label="Dam Pedigree (Mother)"
                                  type="dam"
                                  species={formData.species || 'Leopard Gecko'}
                                  currentGeckoId={editingGecko?.id}
                                  allGeckos={geckos}
                                  selectedId={formData.damId}
                                  manualName={formData.damName}
                                  onSelect={(gecko) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      damId: gecko ? gecko.id : '',
                                      damName: gecko ? gecko.name : prev.damName,
                                      damMorph: gecko ? gecko.morph : prev.damMorph
                                    }));
                                  }}
                                  onManualNameChange={(name) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      damName: name,
                                      damId: prev.damId && geckos.find(g => g.id === prev.damId)?.name !== name ? '' : prev.damId
                                    }));
                                  }}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Additional Notes</label>
                                <textarea 
                                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm min-h-[120px] focus:border-emerald-500 outline-none transition-all uppercase" 
                                  placeholder="Temperament, health history, or special traits..."
                                  value={formData.note} 
                                  onChange={e => setFormData({...formData, note: e.target.value.toUpperCase()})} 
                                />
                            </div>
                            <div className="flex justify-center pt-10 pb-8">
                                  <Tooltip content={editingGecko ? 'Save changes to profile' : 'Register new gecko to stock'} className="w-full max-w-sm">
                                <button 
                                  className="group relative w-full py-6 px-10 bg-slate-900 text-white rounded-[2.5rem] font-bold uppercase tracking-[0.18em] text-[12px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.4)] active:scale-[0.97] transition-all overflow-hidden border border-white/5 disabled:opacity-70 disabled:cursor-not-allowed" 
                                  type="submit"
                                  disabled={isUploading}
                                >
                                    {/* Subtle gradient fill on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_100%] animate-shimmer" />
                                    
                                    <span className="relative flex items-center justify-center gap-5">
                                      {isUploading ? (
                                        <>
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2">
                                              <Loader2 size={16} className="animate-spin text-emerald-400" />
                                              <span className="mt-0.5">{uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Syncing...'}</span>
                                            </div>
                                            {uploadProgress > 0 && (
                                              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-emerald-400 transition-all duration-300" 
                                                  style={{ width: `${uploadProgress}%` }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      ) : editingGecko ? (
                                        <>
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-white animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                          <span className="mt-0.5">Update Record</span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-white animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                          <span className="mt-0.5">Save Gecko</span>
                                        </>
                                      )}
                                    </span>
                                </button>
                              </Tooltip>
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setGeckoToDelete(null); }}
        onConfirm={() => geckoToDelete && handleDelete(geckoToDelete)}
        title="Delete Gecko"
        message="Are you sure you want to delete this gecko record? This action cannot be undone and will update your collection quota."
      />

      {/* Sell Gecko Popup Modal */}
      {sellWorkflow?.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => handleCancelSale()} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => handleCancelSale()}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                💰
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sell Gecko</h3>
                <p className="text-xs text-slate-400">Record a sale transaction for this Gecko</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 space-y-2 border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Gecko</span>
                <span className="font-black text-slate-900">{sellWorkflow.geckoName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Morph</span>
                <span className="font-black text-emerald-600 uppercase text-[10px] tracking-wider">{sellWorkflow.geckoMorph}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase">Purchase Price</span>
                <span className="font-black text-slate-700">
                  {sellWorkflow.purchasePrice > 0 
                    ? `Rp ${sellWorkflow.purchasePrice.toLocaleString('id-ID')}` 
                    : '-'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Sale Price (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 750000"
                  value={sellWorkflow.salePrice}
                  onChange={e => setSellWorkflow({ ...sellWorkflow, salePrice: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Buyer</label>
                <input
                  type="text"
                  placeholder="e.g. Nama Pembeli"
                  value={sellWorkflow.buyer}
                  onChange={e => setSellWorkflow({ ...sellWorkflow, buyer: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Date</label>
                <input
                  type="date"
                  required
                  value={sellWorkflow.date}
                  onChange={e => setSellWorkflow({ ...sellWorkflow, date: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sold via WhatsApp"
                  value={sellWorkflow.notes || ''}
                  onChange={e => setSellWorkflow({ ...sellWorkflow, notes: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCancelSale()}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-sans font-bold rounded-2xl transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSale()}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-black rounded-2xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                >
                  Confirm Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
