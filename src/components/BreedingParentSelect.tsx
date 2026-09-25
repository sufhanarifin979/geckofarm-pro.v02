import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Mars, Venus, Check, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import { Gecko } from '../types';

interface BreedingParentSelectProps {
  label: string;
  type: 'sire' | 'dam';
  allGeckos: Gecko[];
  selectedId: string;
  manualName: string;
  partnerGeckoId?: string;
  onSelect: (gecko: Gecko | null) => void;
  onManualNameChange: (name: string) => void;
}

export default function BreedingParentSelect({
  label,
  type,
  allGeckos,
  selectedId,
  manualName,
  partnerGeckoId,
  onSelect,
  onManualNameChange,
}: BreedingParentSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSire = type === 'sire';
  const targetGender = isSire ? 'male' : 'female';

  // Find partner gecko if already chosen
  const partnerGecko = useMemo(() => {
    if (!partnerGeckoId) return null;
    return allGeckos.find(g => g.id === partnerGeckoId) || null;
  }, [partnerGeckoId, allGeckos]);

  const partnerSpecies = partnerGecko ? (partnerGecko.species || 'Leopard Gecko') : null;

  // Filter available stock for this parent role
  const eligibleGeckos = useMemo(() => {
    return allGeckos.filter(g => {
      // Must match gender
      if (g.gender !== targetGender) return false;
      // Must be active (not sold and not dead)
      if (g.status === 'sold' || g.status === 'dead') return false;
      // If partner is selected, must match partner's species
      if (partnerSpecies) {
        const gSpecies = g.species || 'Leopard Gecko';
        if (gSpecies !== partnerSpecies) return false;
      }
      return true;
    });
  }, [allGeckos, targetGender, partnerSpecies]);

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
      const project = (g.project || '').toLowerCase();
      const species = (g.species || '').toLowerCase();
      return name.includes(q) || morph.includes(q) || albino.includes(q) || project.includes(q) || species.includes(q);
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
    <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
      isSire ? 'bg-blue-50/30 border-blue-100' : 'bg-pink-50/30 border-pink-100'
    } space-y-3.5 relative`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isSire ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]'
          }`} />
          <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            {isSire ? <Mars size={14} className="text-blue-500 stroke-[2.5]" /> : <Venus size={14} className="text-pink-500 stroke-[2.5]" />}
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {partnerSpecies && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {partnerSpecies === 'African Fat-Tailed Gecko' ? 'AFT' : 'Leopard'}
            </span>
          )}
          <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
            {eligibleGeckos.length} {isSire ? 'Jantan' : 'Betina'}
          </span>
        </div>
      </div>

      {/* Selected Gecko Card OR Search Input */}
      {selectedGecko ? (
        <div className={`p-3.5 bg-white rounded-2xl border-2 transition-all shadow-sm flex items-center justify-between gap-3 ${
          isSire ? 'border-blue-300 bg-blue-50/40 ring-2 ring-blue-500/10' : 'border-pink-300 bg-pink-50/40 ring-2 ring-pink-500/10'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {selectedGecko.photoUrl ? (
              <img
                src={selectedGecko.photoUrl}
                alt={selectedGecko.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isSire ? 'bg-blue-100/80 text-blue-600 border-blue-200' : 'bg-pink-100/80 text-pink-600 border-pink-200'
              }`}>
                {isSire ? <Mars size={22} className="stroke-[2.5]" /> : <Venus size={22} className="stroke-[2.5]" />}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm text-slate-900 uppercase truncate">
                  {selectedGecko.name}
                </span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isSire ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-pink-100 text-pink-800 border-pink-300'
                }`}>
                  Tersinkronisasi
                </span>
                <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {(selectedGecko.species || 'Leopard Gecko') === 'African Fat-Tailed Gecko' ? 'AFT' : 'Leopard'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 truncate uppercase mt-0.5">
                {selectedGecko.morph}
                {selectedGecko.albinoStrain && selectedGecko.albinoStrain !== 'None' ? ` • ${selectedGecko.albinoStrain}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  selectedGecko.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                  selectedGecko.status === 'keep' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  Status: {selectedGecko.status}
                </span>
                {selectedGecko.weight && (
                  <span className="text-[9px] font-bold text-slate-500">
                    {selectedGecko.weight}g
                  </span>
                )}
                {selectedGecko.project && (
                  <span className="text-[9px] font-bold text-slate-400">
                    Proj: {selectedGecko.project}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-slate-200 hover:border-rose-200 shadow-2xs active:scale-95 cursor-pointer"
              title="Ganti atau batalkan pilihan indukan ini"
            >
              <X size={13} />
              <span>Ganti</span>
            </button>
          </div>
        </div>
      ) : (
        /* Search Combobox Input */
        <div className="relative" ref={containerRef}>
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
              isOpen ? (isSire ? 'text-blue-500' : 'text-pink-500') : 'text-slate-400'
            }`} />
            <input
              ref={inputRef}
              type="text"
              placeholder={isSire ? "Cari nama / morph Sire di koleksi..." : "Cari nama / morph Dam di koleksi..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className={`w-full pl-10 pr-10 py-3 bg-white border rounded-2xl text-xs font-bold text-slate-800 uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                isOpen 
                  ? (isSire ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-pink-500 ring-2 ring-pink-500/20')
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
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                <span>
                  {searchQuery ? `Hasil Pencarian (${filteredGeckos.length})` : `Pilih Indukan ${isSire ? 'Jantan' : 'Betina'} (${filteredGeckos.length})`}
                </span>
                <span className="text-[9px] text-slate-400 lowercase font-medium">klik untuk memilih</span>
              </div>

              {filteredGeckos.length > 0 ? (
                <div className="p-1 space-y-0.5">
                  {filteredGeckos.map((gecko) => {
                    const geckoSpecies = gecko.species || 'Leopard Gecko';
                    return (
                      <div
                        key={gecko.id}
                        onClick={() => handleSelect(gecko)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                          isSire ? 'hover:bg-blue-50/60' : 'hover:bg-pink-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {gecko.photoUrl ? (
                            <img
                              src={gecko.photoUrl}
                              alt={gecko.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isSire ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-pink-50 text-pink-500 border-pink-100'
                            }`}>
                              {isSire ? <Mars size={18} /> : <Venus size={18} />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-slate-800 uppercase group-hover:text-slate-900 transition-colors truncate">
                                {gecko.name}
                              </span>
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                                {geckoSpecies === 'African Fat-Tailed Gecko' ? 'AFT' : 'Leopard'}
                              </span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-500 truncate uppercase mt-0.5">
                              {gecko.morph} {gecko.albinoStrain && gecko.albinoStrain !== 'None' ? `• ${gecko.albinoStrain}` : ''}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-medium">
                              {gecko.weight && <span>{gecko.weight}g</span>}
                              {gecko.project && <span>• Proj: {gecko.project}</span>}
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
                          <div className={`w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center transition-all ${
                            isSire ? 'group-hover:bg-blue-600 group-hover:text-white' : 'group-hover:bg-pink-600 group-hover:text-white'
                          }`}>
                            <Check size={14} className="stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    Tidak ada indukan cocok dengan &ldquo;{searchQuery}&rdquo;
                  </p>
                  {partnerSpecies && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                      (Hanya menampilkan {partnerSpecies === 'African Fat-Tailed Gecko' ? 'African Fat-Tailed Gecko' : 'Leopard Gecko'} karena pasangan telah dipilih)
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Ketik nama secara manual di kolom bawah jika menggunakan pejantan/betina dari luar koleksi.
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
          <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">
            {selectedGecko ? 'Nama Indukan (Otomatis Tersinkron):' : 'Atau Masukkan Nama Manual (Indukan Luar Registry):'}
          </label>
          {selectedGecko && (
            <span className="text-[8px] font-medium text-emerald-600">
              ID: {selectedGecko.id.slice(0, 8)}...
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder={isSire ? "Nama Jantan Manual (cth: Blood Red X - Luar Registry)" : "Nama Betina Manual (cth: Tangerine Enigma - Luar Registry)"}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-2xs"
          value={manualName || ''}
          onChange={(e) => onManualNameChange(e.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
