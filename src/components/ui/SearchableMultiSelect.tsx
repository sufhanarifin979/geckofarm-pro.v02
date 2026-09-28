import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Search, ChevronDown, Check } from 'lucide-react';

interface SearchableMultiSelectProps {
  label: string;
  sublabel?: string;
  placeholder?: string;
  selected: string[];
  onChange: (items: string[]) => void;
  options: string[];
  allowCustom?: boolean;
  customAddText?: string;
  chipColor?: 'emerald' | 'indigo' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
  icon?: React.ReactNode;
}

export function SearchableMultiSelect({
  label,
  sublabel,
  placeholder = 'Cari atau pilih...',
  selected = [],
  onChange,
  options = [],
  allowCustom = true,
  customAddText = '+ Tambah Item Baru',
  chipColor = 'emerald',
  icon
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available options (exclude already selected, match query)
  const availableOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(opt => {
      const isAlreadySelected = selected.some(s => s.toLowerCase() === opt.toLowerCase());
      if (isAlreadySelected) return false;
      if (!q) return true;
      return opt.toLowerCase().includes(q);
    });
  }, [options, selected, query]);

  const canAddCustom = useMemo(() => {
    if (!allowCustom) return false;
    const q = query.trim();
    if (!q) return false;
    const isAlreadySelected = selected.some(s => s.toLowerCase() === q.toLowerCase());
    return !isAlreadySelected;
  }, [allowCustom, query, selected]);

  const handleSelect = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setQuery('');
    inputRef.current?.focus();
  };

  const handleRemove = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== itemToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (availableOptions.length > 0) {
        // If query matches first option closely or user presses enter
        if (query.trim()) {
          const exact = availableOptions.find(o => o.toLowerCase() === query.trim().toLowerCase());
          if (exact) {
            handleSelect(exact);
            return;
          }
        }
        if (canAddCustom) {
          handleSelect(query.trim());
          return;
        }
        handleSelect(availableOptions[0]);
      } else if (canAddCustom) {
        handleSelect(query.trim());
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      // Remove last selected chip
      onChange(selected.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Color classes for chips
  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 hover:border-indigo-500/40',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:border-amber-500/40',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:border-blue-500/40',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:border-purple-500/40',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:border-rose-500/40',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {sublabel && (
          <span className="text-[9px] text-slate-400 font-medium italic">{sublabel}</span>
        )}
      </div>

      {/* Main Box containing Chips and Search Input */}
      <div 
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`min-h-[56px] w-full p-2.5 bg-white dark:bg-slate-900 border rounded-2xl transition-all cursor-text flex flex-wrap items-center gap-2 ${
          isOpen 
            ? 'border-emerald-500 ring-4 ring-emerald-500/5 shadow-md' 
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Selected Chips */}
        {selected.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all animate-in fade-in zoom-in-95 ${colorMap[chipColor]}`}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => handleRemove(item, e)}
              className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title={`Hapus ${item}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}

        {/* Search Input inline */}
        <div className="flex-1 min-w-[140px] flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : 'Ketik untuk menambah...'}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none px-2 py-1"
          />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-auto cursor-pointer"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Custom Add Option if query is typed */}
          {canAddCustom && (
            <div
              onClick={() => handleSelect(query.trim())}
              className="p-3 bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 cursor-pointer border-b border-emerald-500/10 transition-colors"
            >
              <Plus size={15} className="text-emerald-500" />
              <span>{customAddText}: <strong className="underline underline-offset-2">"{query.trim()}"</strong></span>
            </div>
          )}

          {/* Preset / Available Options List */}
          {availableOptions.length > 0 ? (
            <div className="p-1.5 space-y-0.5">
              {availableOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>{opt}</span>
                  <Plus size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : !canAddCustom ? (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              {query ? 'Tidak ada hasil yang cocok' : 'Semua opsi telah dipilih'}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
