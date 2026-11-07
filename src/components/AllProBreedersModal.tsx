import React, { useState, useMemo } from 'react';
import { ProBreeder } from '../types';
import { X, Search, Crown, ShieldCheck } from 'lucide-react';

interface AllProBreedersModalProps {
  isOpen: boolean;
  onClose: () => void;
  breeders: ProBreeder[];
}

export default function AllProBreedersModal({
  isOpen,
  onClose,
  breeders
}: AllProBreedersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBreeders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return breeders;
    return breeders.filter(b => b.farmName.toLowerCase().includes(q));
  }, [breeders, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight leading-tight">Breeder Pro Aktif</h3>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Daftar breeder terverifikasi di GeckoFarm Pro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama farm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2.5 px-1">
            <span className="text-[11px] font-bold text-slate-500">
              Total {filteredBreeders.length} Farm Terdaftar
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Status Resmi Aktif
            </span>
          </div>
        </div>

        {/* Breeders List - ONLY Photo and Farm Name */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBreeders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Crown className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-600">Tidak ada farm yang cocok</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan kata kunci pencarian lainnya.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBreeders.map((breeder) => (
                <div
                  key={breeder.id}
                  className="flex items-center gap-3.5 p-3.5 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs group"
                >
                  {/* Farm Logo / Photo - Large & Circular */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-slate-200/90 shrink-0 shadow-sm flex items-center justify-center p-0.5">
                    {breeder.farmPhotoUrl ? (
                      <img
                        src={breeder.farmPhotoUrl}
                        alt={breeder.farmName}
                        className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="font-black text-emerald-700 text-sm tracking-wider uppercase">${breeder.farmName.substring(0, 2)}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="font-black text-emerald-700 text-sm tracking-wider uppercase">
                        {breeder.farmName.substring(0, 2)}
                      </span>
                    )}
                  </div>

                  {/* Strictly Farm Name & Verified Badge ONLY */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 truncate leading-snug group-hover:text-emerald-700 transition-colors">
                      {breeder.farmName}
                    </h4>
                    <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/80">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Pro Member</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-medium text-slate-400">
            Hanya menampilkan identitas resmi farm pengguna terverifikasi GeckoFarm Pro.
          </p>
        </div>
      </div>
    </div>
  );
}
