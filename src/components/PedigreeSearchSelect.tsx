import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Mars, Venus, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Gecko } from '../types';

interface PedigreeSearchSelectProps {
  label: string;
  type: 'sire' | 'dam';
  species?: string;
  currentGeckoId?: string;
  allGeckos: Gecko[];
  selectedId?: string;
  manualName?: string;
  onSelect: (gecko: Gecko | null) => void;
  onManualNameChange: (name: string) => void;
}

export default function PedigreeSearchSelect({
  label,
  type,
  species = 'Leopard Gecko',
  currentGeckoId,
  allGeckos,
  selectedId,
  manualName,
  onSelect,
  onManualNameChange,
}: PedigreeSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSire = type === 'sire';
  const targetGender = isSire ? 'male' : 'female';
  const targetSpecies = species || 'Leopard Gecko';

  // Filter available stock for this parent role
  const eligibleGeckos = useMemo(() => {
    return allGeckos.filter(g => {
      // Cannot be self
      if (currentGeckoId && g.id === currentGeckoId) return false;
      // Match gender
      if (g.gender !== targetGender) return false;
      // Exclude dead
      if (g.status === 'dead') return false;
      // Match species
      const gSpecies = g.species || 'Leopard Gecko';
      if (gSpecies !== targetSpecies) return false;
      return true;
    });
  }, [allGeckos, currentGeckoId, targetGender, targetSpecies]);

  // Find currently selected gecko from registry
  const selectedGecko = useMemo(() => {
    if (!selectedId) return null;
    return allGeckos.find(g => g.id === selectedId) || null;
  }, [selectedId, allGeckos]);

  // Filtered results based on search query
  const filteredGeckos = useMemo(() => {
    if (!searchQuery.trim()) return eligibleGeckos;
    const q = searchQuery.toLowerCase().trim();
    return eligibleGeckos.filter(g => {
      const name = (g.name || '').toLowerCase();
      const morph = (g.morph || '').toLowerCase();
      const albino = (g.albinoStrain || '').toLowerCase();
      return name.includes(q) || morph.includes(q) || albino.includes(q);
    });
  }, [eligibleGeckos, searchQuery]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleSelect = (gecko: Gecko) => {
    onSelect(gecko);
    onManualNameChange(gecko.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3.5 relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSire ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
          <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-1.5">
            {isSire ? <Mars size={13} className="text-blue-500" /> : <Venus size={13} className="text-rose-500" />}
            {label}
          </span>
        </div>
        <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full">
          {eligibleGeckos.length} {isSire ? 'Jantan' : 'Betina'} di Registry
        </span>
      </div>

      {/* Selected Gecko Card or Search Selector */}
      {selectedGecko ? (
        <div className={`p-3 sm:p-3.5 bg-white rounded-2xl border-2 transition-all shadow-sm flex items-center justify-between gap-3 ${isSire ? 'border-blue-200 bg-blue-50/20' : 'border-rose-200 bg-rose-50/20'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {selectedGecko.photoUrl ? (
              <img
                src={selectedGecko.photoUrl}
                alt={selectedGecko.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isSire ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                {isSire ? <Mars size={22} /> : <Venus size={22} />}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs text-slate-900 uppercase truncate">
                  {selectedGecko.name}
                </span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${isSire ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  Terpilih dari Registry
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 truncate uppercase mt-0.5">
                {selectedGecko.morph}
                {selectedGecko.albinoStrain && selectedGecko.albinoStrain !== 'None' ? ` • ${selectedGecko.albinoStrain}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  selectedGecko.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                  selectedGecko.status === 'keep' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  Status: {selectedGecko.status}
                </span>
                <span className="text-[8px] font-semibold text-emerald-600">✓ Silsilah Terhubung</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border border-slate-200 hover:border-rose-200 active:scale-95 cursor-pointer"
              title="Lepas indukan ini"
            >
              <X size={12} />
              <span className="hidden sm:inline">Ganti</span>
            </button>
          </div>
        </div>
      ) : (
        /* Search Combobox Input */
        <div className="relative" ref={containerRef}>
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${isOpen ? (isSire ? 'text-blue-500' : 'text-rose-500') : 'text-slate-400'}`} />
            <input
              ref={inputRef}
              type="text"
              placeholder={isSire ? "Ketik nama/morph untuk cari Sire dari registry..." : "Ketik nama/morph untuk cari Dam dari registry..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className={`w-full pl-10 pr-10 py-3 bg-white border rounded-2xl text-xs font-bold text-slate-800 uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 outline-none transition-all shadow-sm ${
                isOpen 
                  ? (isSire ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-rose-500 ring-2 ring-rose-500/20')
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 overflow-hidden">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>
                  {searchQuery ? `Hasil Pencarian (${filteredGeckos.length})` : `Pilih Indukan ${isSire ? 'Jantan' : 'Betina'} (${filteredGeckos.length})`}
                </span>
                <span className="text-[9px] text-slate-400 lowercase font-medium">klik untuk memilih</span>
              </div>

              {filteredGeckos.length > 0 ? (
                <div className="p-1 space-y-0.5">
                  {filteredGeckos.map((gecko) => (
                    <div
                      key={gecko.id}
                      onClick={() => handleSelect(gecko)}
                      className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {gecko.photoUrl ? (
                          <img
                            src={gecko.photoUrl}
                            alt={gecko.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSire ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                            {isSire ? <Mars size={16} /> : <Venus size={16} />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-black text-xs text-slate-800 uppercase group-hover:text-emerald-600 transition-colors truncate">
                            {gecko.name}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400 truncate uppercase mt-0.5">
                            {gecko.morph} {gecko.albinoStrain && gecko.albinoStrain !== 'None' ? `• ${gecko.albinoStrain}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          gecko.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                          gecko.status === 'keep' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {gecko.status}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
                          <Check size={12} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Tidak ada indukan cocok dengan &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Anda bisa memasukkan nama secara manual di kolom input di bawah ini jika indukan berasal dari luar registry.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Input Field */}
      <div className="pt-0.5">
        <div className="flex items-center justify-between mb-1 px-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
            {selectedGecko ? 'Nama Indukan (Tersinkronisasi):' : 'Atau Masukkan Nama Manual (Indukan Luar Registry):'}
          </label>
          {selectedGecko && (
            <span className="text-[8px] font-medium text-emerald-600">
              Terhubung ke ID: {selectedGecko.id.slice(0, 8)}...
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder={isSire ? "Contoh: Blood Hypo Tangerine (Manual / Luar Registry)" : "Contoh: Super Hypo Tangerine Carrot Tail (Manual / Luar Registry)"}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          value={manualName || ''}
          onChange={(e) => onManualNameChange(e.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
