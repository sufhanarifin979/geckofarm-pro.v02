import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gecko, Species, UserProfile } from '../types';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  existingGeckos: Gecko[];
  onSuccess: (count: number) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

interface ParsedGeckoRow {
  rowIndex: number;
  name: string;
  morph: string;
  species: Species;
  albinoStrain: 'None' | 'Tremper' | 'Bell' | 'Rainwater';
  gender: 'male' | 'female' | 'unsex';
  birthDate: string;
  status: 'available' | 'keep' | 'sold' | 'dead';
  sireName: string;
  damName: string;
  purchasePrice?: number;
  note: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  profile,
  existingGeckos,
  onSuccess,
  addToast
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedGeckoRow[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Generate & Download Official Template Excel
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          "Nama / Tag ID": "LG-01",
          "Morph": "WY Tremper Het Raptor",
          "Spesies": "Leopard Gecko",
          "Albino Strain": "Tremper",
          "Jenis Kelamin": "Male",
          "Tanggal Menetas": "2024-05-15",
          "Status": "available",
          "Induk Jantan (Sire)": "Zeus",
          "Induk Betina (Dam)": "Hera",
          "Harga Beli (Rp)": 500000,
          "Catatan": "Makan lancar kalsium rutin"
        },
        {
          "Nama / Tag ID": "AFT-02",
          "Morph": "Whiteout Het Oreo",
          "Spesies": "African Fat-Tailed Gecko",
          "Albino Strain": "None",
          "Jenis Kelamin": "Female",
          "Tanggal Menetas": "2024-06-20",
          "Status": "keep",
          "Induk Jantan (Sire)": "",
          "Induk Betina (Dam)": "",
          "Harga Beli (Rp)": 1200000,
          "Catatan": "Calon indukan prospek"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Auto column widths
      worksheet['!cols'] = [
        { wch: 16 }, // Nama
        { wch: 25 }, // Morph
        { wch: 25 }, // Spesies
        { wch: 15 }, // Albino Strain
        { wch: 15 }, // Jenis Kelamin
        { wch: 18 }, // Tanggal Menetas
        { wch: 12 }, // Status
        { wch: 20 }, // Sire
        { wch: 20 }, // Dam
        { wch: 18 }, // Harga Beli
        { wch: 30 }  // Catatan
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Gecko Registry");
      XLSX.writeFile(workbook, "Gecko_Registry_Template.xlsx");

      addToast("Template Excel berhasil diunduh!");
    } catch (err: any) {
      console.error("Gagal mengunduh template:", err);
      addToast("Gagal mengunduh template Excel", "error");
    }
  };

  // Helper date normalizer
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    
    // Excel serial number date
    if (typeof val === 'number') {
      const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    }

    const str = String(val).trim();
    if (!str) return '';

    // Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Fallback try Date.parse
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }

    return '';
  };

  // 2. Parse Uploaded File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoadingFile(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          addToast("File kosong atau format tidak sesuai", "error");
          setParsedData([]);
          setIsLoadingFile(false);
          return;
        }

        // Existing names map for duplicate detection
        const existingNamesSet = new Set(
          existingGeckos.map(g => (g.name || '').trim().toLowerCase())
        );

        // Normalize rows
        const parsedRows: ParsedGeckoRow[] = rawJson.map((row, index) => {
          const errors: string[] = [];

          // Find key helper (case-insensitive substring match)
          const getVal = (possibleKeys: string[]): string => {
            const foundKey = Object.keys(row).find(k => 
              possibleKeys.some(pk => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pk.toLowerCase().replace(/[^a-z0-9]/g, '')))
            );
            return foundKey ? String(row[foundKey]).trim() : '';
          };

          const rawName = getVal(['nama', 'tagid', 'tag', 'name', 'id']);
          const rawMorph = getVal(['morph', 'morfin', 'genetics', 'genetik']);
          const rawSpecies = getVal(['spesies', 'species']);
          const rawAlbino = getVal(['albinostrain', 'strain', 'albino']);
          const rawGender = getVal(['jeniskelamin', 'gender', 'sex', 'jk']);
          const rawBirthDate = getVal(['tanggalmenetas', 'tglmenetas', 'birthdate', 'hatchdate', 'dob', 'menetas']);
          const rawStatus = getVal(['status']);
          const rawSire = getVal(['indukjantan', 'sire', 'bapak', 'ayah']);
          const rawDam = getVal(['indukbetina', 'dam', 'ibu', 'induk']);
          const rawPrice = getVal(['hargabeli', 'purchaseprice', 'modal', 'beli']);
          const rawNote = getVal(['catatan', 'notes', 'note', 'info', 'keterangan']);

          // Validations
          if (!rawName) {
            errors.push('Nama / Tag ID wajib diisi');
          }
          if (!rawMorph) {
            errors.push('Morph wajib diisi');
          }

          // Normalize species
          let species: Species = 'Leopard Gecko';
          const lowerSpecies = rawSpecies.toLowerCase();
          if (lowerSpecies.includes('fat') || lowerSpecies.includes('aft')) {
            species = 'African Fat-Tailed Gecko';
          }

          // Normalize albino strain
          let albinoStrain: 'None' | 'Tremper' | 'Bell' | 'Rainwater' = 'None';
          const lowerAlbino = rawAlbino.toLowerCase();
          if (lowerAlbino.includes('tremper')) albinoStrain = 'Tremper';
          else if (lowerAlbino.includes('bell')) albinoStrain = 'Bell';
          else if (lowerAlbino.includes('rainwater')) albinoStrain = 'Rainwater';

          // Normalize gender
          let gender: 'male' | 'female' | 'unsex' = 'unsex';
          const lowerGender = rawGender.toLowerCase();
          if (lowerGender === 'male' || lowerGender.includes('jantan') || lowerGender === 'm') {
            gender = 'male';
          } else if (lowerGender === 'female' || lowerGender.includes('betina') || lowerGender === 'f') {
            gender = 'female';
          }

          // Normalize status
          let status: 'available' | 'keep' | 'sold' | 'dead' = 'available';
          const lowerStatus = rawStatus.toLowerCase();
          if (lowerStatus.includes('keep')) status = 'keep';
          else if (lowerStatus.includes('sold') || lowerStatus.includes('jual')) status = 'sold';
          else if (lowerStatus.includes('dead') || lowerStatus.includes('mati')) status = 'dead';

          // Normalize purchase price
          let purchasePrice: number | undefined = undefined;
          if (rawPrice) {
            const cleanPriceStr = String(rawPrice).replace(/[^0-9.-]+/g, '');
            const parsedPrice = parseFloat(cleanPriceStr);
            if (!isNaN(parsedPrice) && parsedPrice >= 0) {
              purchasePrice = parsedPrice;
            }
          }

          // Duplicate check
          const isDuplicate = existingNamesSet.has(rawName.toLowerCase());

          return {
            rowIndex: index + 2, // 1-based header is row 1
            name: rawName,
            morph: rawMorph,
            species,
            albinoStrain,
            gender,
            birthDate: parseExcelDate(rawBirthDate),
            status,
            sireName: rawSire,
            damName: rawDam,
            purchasePrice,
            note: rawNote,
            isValid: errors.length === 0,
            errors,
            isDuplicate
          };
        });

        setParsedData(parsedRows);
        addToast(`Berhasil memuat ${parsedRows.length} data gecko dari file.`);
      } catch (err: any) {
        console.error("Gagal membaca file Excel:", err);
        addToast("Format file tidak didukung atau rusak", "error");
      } finally {
        setIsLoadingFile(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // 3. Filter for table display
  const validRows = parsedData.filter(r => r.isValid && (!skipDuplicates || !r.isDuplicate));
  const invalidRows = parsedData.filter(r => !r.isValid || (skipDuplicates && r.isDuplicate));
  
  const displayedRows = activeTab === 'all' 
    ? parsedData 
    : activeTab === 'valid' 
      ? validRows 
      : invalidRows;

  // 4. Batch Import to Firestore
  const handleExecuteImport = async () => {
    if (!profile) return;
    if (validRows.length === 0) {
      addToast("Tidak ada data valid yang dapat diimpor", "error");
      return;
    }

    // Quota warning check
    if (profile.planLimit && (profile.geckoCount + validRows.length > profile.planLimit)) {
      const confirmExceed = window.confirm(
        `Perhatian: Kuota paket Anda adalah ${profile.planLimit} gecko. Menambahkan ${validRows.length} gecko akan melebihi kuota. Apakah Anda tetap ingin melanjutkan?`
      );
      if (!confirmExceed) return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Create quick name-to-id lookup for parent linking
      const nameToIdMap = new Map<string, string>();
      existingGeckos.forEach(g => {
        if (g.name && g.id) {
          nameToIdMap.set(g.name.trim().toLowerCase(), g.id);
        }
      });

      // Split into batches of 400 (Firestore max is 500 operations)
      const chunkSize = 400;
      const chunks: ParsedGeckoRow[][] = [];
      for (let i = 0; i < validRows.length; i += chunkSize) {
        chunks.push(validRows.slice(i, i + chunkSize));
      }

      let totalImported = 0;

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        const batch = writeBatch(db);

        chunk.forEach(row => {
          const newGeckoRef = doc(collection(db, 'geckos'));
          const sireId = row.sireName ? (nameToIdMap.get(row.sireName.trim().toLowerCase()) || '') : '';
          const damId = row.damName ? (nameToIdMap.get(row.damName.trim().toLowerCase()) || '') : '';

          const geckoData: Partial<Gecko> = {
            name: row.name,
            morph: row.morph,
            species: row.species,
            albinoStrain: row.albinoStrain,
            gender: row.gender,
            birthDate: row.birthDate || '',
            status: row.status,
            sireName: row.sireName || '',
            damName: row.damName || '',
            sireId,
            damId,
            purchasePrice: row.purchasePrice,
            note: row.note || '',
            info: row.note || '',
            ownerId: profile.uid,
            photoUrl: '',
            photos: [],
            createdAt: serverTimestamp()
          };

          // Clean undefined values
          const sanitized = Object.fromEntries(
            Object.entries(geckoData).filter(([_, v]) => v !== undefined)
          );

          batch.set(newGeckoRef, sanitized);
          totalImported++;
        });

        // Update profile geckoCount in the last batch
        if (c === chunks.length - 1) {
          const userRef = doc(db, 'users', profile.uid);
          batch.update(userRef, {
            geckoCount: increment(validRows.length)
          });
        }

        await batch.commit();
        setImportProgress(Math.round(((c + 1) / chunks.length) * 100));
      }

      addToast(`Selamat! ${totalImported} gecko berhasil diimpor ke Registry.`);
      onSuccess(totalImported);
      onClose();
    } catch (err: any) {
      console.error("Gagal melakukan import batch:", err);
      addToast(err.message || "Terjadi kesalahan saat menyimpan data", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Import Gecko dari Excel</h3>
              <p className="text-xs text-slate-400 font-medium">Tambah banyak data gecko sekaligus lewat file spreadsheet (.xlsx / .csv)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Step 1 & 2: Template Download & Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Template Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs">1</span>
                  Unduh Template Resmi
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gunakan format kolom yang sudah disesuaikan agar data gecko Anda langsung terbaca rapi.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Download size={16} className="text-emerald-600" />
                Download Template Excel (.xlsx)
              </button>
            </div>

            {/* Upload File Box */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">2</span>
                  Upload File Excel / CSV
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih file .xlsx, .xls, atau .csv dari perangkat Anda untuk dianalisis.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 active:scale-98 transition-all cursor-pointer"
                >
                  <Upload size={16} />
                  {file ? 'Ganti File Spreadsheet' : 'Pilih File Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Loading File State */}
          {isLoadingFile && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Membaca data file...</p>
            </div>
          )}

          {/* Parsed Results Section */}
          {!isLoadingFile && parsedData.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats & Options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({parsedData.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('valid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'valid' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    Siap Impor ({validRows.length})
                  </button>
                  {invalidRows.length > 0 && (
                    <button
                      onClick={() => setActiveTab('invalid')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'invalid' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <AlertTriangle size={13} />
                      Bermasalah / Duplikat ({invalidRows.length})
                    </button>
                  )}
                </div>

                {/* Skip duplicate toggle */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Lewati nama yang sudah ada di farm</span>
                </label>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Baris</th>
                      <th className="py-3 px-4">Status Validasi</th>
                      <th className="py-3 px-4">Nama / Tag</th>
                      <th className="py-3 px-4">Morph</th>
                      <th className="py-3 px-4">Spesies / Sex</th>
                      <th className="py-3 px-4">Tgl Menetas</th>
                      <th className="py-3 px-4">Sire & Dam</th>
                      <th className="py-3 px-4 text-right">Harga Beli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((row) => (
                      <tr 
                        key={row.rowIndex}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !row.isValid 
                            ? 'bg-rose-50/40' 
                            : row.isDuplicate && skipDuplicates 
                              ? 'bg-amber-50/40' 
                              : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-400">#{row.rowIndex}</td>
                        <td className="py-3 px-4">
                          {!row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md" title={row.errors.join(', ')}>
                              <AlertCircle size={12} />
                              {row.errors[0]}
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                              <AlertTriangle size={12} />
                              {skipDuplicates ? 'Duplikat (Dilewati)' : 'Duplikat'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={12} />
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-800">{row.name || '-'}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{row.morph || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">
                              {row.species === 'African Fat-Tailed Gecko' ? 'AFT' : 'LG'}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                              row.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                              row.gender === 'female' ? 'bg-pink-100 text-pink-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {row.gender}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{row.birthDate || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {(row.sireName || row.damName) ? (
                            <span>{row.sireName || '?'} × {row.damName || '?'}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatCurrency(row.purchasePrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Duplicate or validation info box */}
              {invalidRows.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                  <HelpCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Hanya baris yang <strong>Valid</strong> yang akan dimasukkan ke database. Baris tanpa Nama atau Morph akan otomatis diabaikan.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no file uploaded */}
          {!isLoadingFile && parsedData.length === 0 && (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2">
              <FileText size={32} className="text-slate-300" />
              <p className="text-xs font-bold text-slate-500">Belum ada file yang dipilih</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Unduh template resmi di atas, isi data gecko Anda, lalu upload kembali file tersebut untuk melihat pratinjau.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="text-xs text-slate-500">
            {validRows.length > 0 ? (
              <span>
                Siap mengimpor <strong className="text-emerald-600">{validRows.length} ekor gecko</strong> ke farm Anda.
              </span>
            ) : (
              <span>Silakan pilih file Excel terlebih dahulu.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 sm:flex-initial py-3 px-6 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold text-xs rounded-2xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || validRows.length === 0}
              className="flex-1 sm:flex-initial py-3 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengimpor... ({importProgress}%)</span>
                </>
              ) : (
                <span>Impor {validRows.length > 0 ? `(${validRows.length}) Gecko` : ''}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
