import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Banknote, 
  Database, 
  HelpCircle, 
  X,
  Phone,
  ArrowRight,
  LayoutDashboard,
  Thermometer,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface HelpCenterProps {
  profile: UserProfile | null;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  items: FAQItem[];
}

export default function HelpCenter({ profile }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // FAQ Database matching the request exactly
  const categories: FAQCategory[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Ringkasan aktivitas dan analisis statistik',
      icon: LayoutDashboard,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      items: [
        {
          id: 'dash-1',
          question: 'Apa fungsi Dashboard?',
          answer: 'Dashboard memberikan ringkasan status farm Anda secara real-time. Anda dapat memantau total populasi gecko yang terdaftar, jumlah pasangan kawin aktif (Active Pairs), serta jumlah telur yang sedang diinkubasi (Incubating) secara langsung.'
        },
        {
          id: 'dash-2',
          question: 'Bagaimana membaca grafik analisis di Dashboard?',
          answer: 'Grafik analisis menyajikan data populasi gecko Anda secara visual, mencakup persentase sebaran jenis kelamin (Male, Female, Unsex) serta sebaran morph populer di farm Anda guna membantu perencanaan breeding yang lebih strategis.'
        },
        {
          id: 'dash-3',
          question: 'Apa itu Recent Registry?',
          answer: 'Recent Registry adalah daftar ringkas yang menampilkan beberapa gecko terakhir yang baru saja Anda tambahkan ke dalam sistem, lengkap dengan nama/ID, foto, jenis kelamin, serta status terbarunya.'
        }
      ]
    },
    {
      id: 'registry',
      title: 'Registry',
      description: 'Manajemen data gecko individual',
      icon: BookOpen,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      items: [
        {
          id: 'reg-1',
          question: 'Apa fungsi Registry?',
          answer: 'Registry adalah pusat data utama farm Anda tempat Anda menyimpan dan mengelola semua informasi gecko secara individual. Di sini Anda dapat melacak morf/genotipe, jenis kelamin, tanggal lahir (hatch date), silsilah (sire & dam), foto, harga beli, hingga catatan khusus untuk masing-masing gecko Anda.'
        },
        {
          id: 'reg-2',
          question: 'Bagaimana menambahkan gecko baru?',
          answer: 'Buka menu Registry dari sidebar, lalu klik tombol "Add Gecko" di pojok kanan atas. Isi formulir data seperti Nama/ID, Genotipe/Morf, Jenis Kelamin (Male, Female, Unsex), Tanggal Lahir (Hatch Date), status ketersediaan, silsilah induk (Sire/Dam), harga pembelian, foto, dan informasi tambahan. Terakhir, klik "Save Gecko" untuk menyimpannya.'
        },
        {
          id: 'reg-3',
          question: 'Apa arti status Available?',
          answer: 'Status Available menandakan bahwa gecko tersebut siap untuk dijual, diadopsi, atau ditawarkan kepada calon pembeli lain yang tertarik.'
        },
        {
          id: 'reg-4',
          question: 'Apa arti status Holdback?',
          answer: 'Status Holdback berarti gecko tersebut sengaja disimpan oleh farm Anda karena diproyeksikan sebagai calon indukan masa depan atau untuk kelanjutan line breeding sendiri.'
        },
        {
          id: 'reg-5',
          question: 'Apa arti status Sold?',
          answer: 'Status Sold menandakan gecko tersebut telah terjual. Saat status diubah menjadi Sold, sistem secara otomatis memberikan opsi untuk mengarahkan Anda mencatat transaksi penjualannya ke modul Finance.'
        },
        {
          id: 'reg-6',
          question: 'Bagaimana mengedit data gecko?',
          answer: 'Pada halaman Registry, cari gecko yang ingin diubah, klik tombol aksi atau ikon pensil (Edit) di sebelah baris data gecko tersebut. Ubah informasi yang Anda inginkan pada formulir, lalu klik "Save Changes" untuk menyimpan pembaruan data.'
        }
      ]
    },
    {
      id: 'breeding',
      title: 'Breeding Pair',
      description: 'Pencatatan persilangan dan telur',
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      items: [
        {
          id: 'breed-1',
          question: 'Bagaimana membuat Breeding Pair?',
          answer: 'Buka menu Breeding Pair (Pairs), lalu klik tombol "Create Pair". Pilih gecko jantan (Sire) dan gecko betina (Dam) yang bersesuaian dari dropdown list. Masukkan nama pasangan, tanggal mulai kawin (pairing date), serta catatan tambahan. Klik "Create Pair" untuk menyimpannya.'
        },
        {
          id: 'breed-2',
          question: 'Bagaimana mencatat telur?',
          answer: 'Pada pasangan yang aktif di menu Pairs, klik tombol "Log Clutch" atau kelola telur. Masukkan tanggal bertelur (lay date), jumlah telur (biasanya 1 atau 2 butir), status fertilitas awal (fertile/infertile/slug), lokasi inkubator, serta estimasi tanggal menetas berdasarkan suhu inkubasi.'
        },
        {
          id: 'breed-3',
          question: 'Bagaimana mencatat hatchling?',
          answer: 'Ketika telur menetas, buka daftar telur Anda pada menu Incubator atau Breeding Pair, klik tombol "Mark as Hatched". Sistem akan meminta data bobot lahir, tanggal menetas, dan otomatis membuat entri baru untuk anakan (hatchling) tersebut di Registry Anda.'
        },
        {
          id: 'breed-4',
          question: 'Bagaimana mengubah status breeding?',
          answer: 'Anda dapat memperbarui status pasangan kawin (misal dari "Active pairing" ke "Separated", "Resting", atau "Completed") dengan mengklik opsi "Edit Status" pada kartu breeding pair yang bersangkutan untuk melacak musim kawin secara rapi.'
        }
      ]
    },
    {
      id: 'incubator',
      title: 'Incubator',
      description: 'Pemantauan telur yang diinkubasi',
      icon: Thermometer,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      items: [
        {
          id: 'inc-1',
          question: 'Apa fungsi Incubator?',
          answer: 'Incubator adalah modul khusus untuk memantau semua telur (clutches) hasil perkawinan gecko yang sedang diinkubasi hingga menetas, mempermudah pelacakan suhu, durasi hari, dan status penetasan.'
        },
        {
          id: 'inc-2',
          question: 'Bagaimana estimasi waktu menetas dihitung?',
          answer: 'Estimasi tanggal menetas dan sisa waktu inkubasi (Days Left) dihitung secara otomatis oleh sistem berdasarkan Tanggal Bertelur (Lay Date) serta suhu inkubasi yang Anda konfigurasikan untuk telur tersebut.'
        },
        {
          id: 'inc-3',
          question: 'Bagaimana mencatat telur yang telah menetas?',
          answer: 'Ketika salah satu atau kedua telur menetas, buka menu Incubator, klik tombol "Mark as Hatched" di kartu clutch terkait. Sistem akan menuntun Anda mendaftarkan anakannya langsung ke Registry dengan mewarisi silsilah induk (Sire & Dam) secara otomatis.'
        },
        {
          id: 'inc-4',
          question: 'Bagaimana jika telur rusak atau tidak menetas?',
          answer: 'Jika telur rusak, tidak fertil, atau menyusut, Anda dapat menandai statusnya sebagai "Infertile/Bad" atau "Slug" agar persentase keberhasilan breeding pair Anda tercatat secara akurat.'
        }
      ]
    },
    {
      id: 'ai',
      title: 'Breeder AI',
      description: 'Kalkulator genetik dan prediksi pintar',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      items: [
        {
          id: 'ai-1',
          question: 'Bagaimana menggunakan Breeder AI Analysis?',
          answer: 'Buka menu Breeder AI (Genetic Calc / Analysis). Pilih indukan jantan (Sire) dan indukan betina (Dam). AI Generator dan kalkulator genetik kami akan langsung mensimulasikan hukum segregasi Mendel pada gen dominan, kodominan, co-dominant, maupun resesif untuk memberikan prediksi hasil anakannya.'
        },
        {
          id: 'ai-2',
          question: 'Apa arti Combo Probability?',
          answer: 'Combo Probability menunjukkan probabilitas persentase peluang munculnya kombinasi fenotipe/genotipe tertentu dari anakan hasil perkawinan pasangan tersebut, dihitung secara akurat berdasarkan hukum probabilitas genetik reptil.'
        },
        {
          id: 'ai-3',
          question: 'Bagaimana membaca Holdback Priority?',
          answer: 'Holdback Priority adalah skor rekomendasi pintar yang diberikan oleh sistem kami untuk memprioritaskan anakan mana yang sebaiknya di-hold (disimpan) berdasarkan keunikan kombinasi genetik baru atau morph langka yang dihasilkan.'
        },
        {
          id: 'ai-4',
          question: 'Apa arti Project Score?',
          answer: 'Project Score memberikan penilaian seberapa bernilai proyek perkawinan tersebut bagi kemajuan genetika farm Anda, membantu Anda fokus pada pairing berkualitas tinggi dibanding kuantitas belaka.'
        }
      ]
    },
    {
      id: 'finance',
      title: 'Finance',
      description: 'Pencatatan keuangan dan analisis laba rugi',
      icon: Banknote,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      items: [
        {
          id: 'fin-1',
          question: 'Bagaimana mencatat penjualan gecko?',
          answer: 'Masuk ke menu Finance, klik tombol "Add Transaction" lalu pilih tipe "Income" (Pemasukan). Masukkan judul transaksi (misal: "Penjualan Gecko #005"), jumlah uang, tanggal, kategori (Reptile Sale), dan Anda juga dapat menautkannya langsung dengan ID gecko yang terjual.'
        },
        {
          id: 'fin-2',
          question: 'Bagaimana mencatat pengeluaran?',
          answer: 'Masuk ke menu Finance, klik tombol "Add Transaction" lalu pilih tipe "Expense" (Pengeluaran). Isi rincian seperti pengeluaran pakan (jangkrik/ulat), obat-obatan, pemeliharaan kandang, listrik, atau peralatan inkubator, lalu klik simpan.'
        },
        {
          id: 'fin-3',
          question: 'Bagaimana profit dihitung?',
          answer: 'Profit bersih dihitung dengan rumus sederhana: Total Revenue (Pemasukan) dikurangi Total Expenses (Pengeluaran). Grafik performa finansial di dashboard akan menyajikan rincian ini secara periodik agar Anda mengetahui profitabilitas nyata farm Anda.'
        },
        {
          id: 'fin-4',
          question: 'Apa perbedaan Revenue dan Expense?',
          answer: 'Revenue adalah semua aliran uang masuk yang diterima oleh farm Anda (misalnya dari penjualan reptil, pakan, atau jasa kawin), sedangkan Expense adalah seluruh uang keluar untuk membiayai operasional farm sehari-hari.'
        }
      ]
    },
    {
      id: 'morph',
      title: 'Morph Database',
      description: 'Ensiklopedia genetik terlengkap',
      icon: Database,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      items: [
        {
          id: 'morph-1',
          question: 'Apa fungsi Morph Database?',
          answer: 'Morph Database (Knowledge Base) berfungsi sebagai ensiklopedia referensi genetik lengkap yang berisi informasi morfologi leopard gecko maupun reptil lainnya, termasuk karakteristik visual dan sifat genetik (dominan, resesif, co-dom, dll).'
        },
        {
          id: 'morph-2',
          question: 'Bagaimana mencari morph?',
          answer: 'Buka menu Knowledge, gunakan bilah pencarian di bagian atas halaman untuk mengetik nama morph yang Anda cari (misalnya: "Tremper Albino", "Eclipse", "White and Yellow"). Sistem akan memfilter database secara realtime.'
        },
        {
          id: 'morph-3',
          question: 'Bagaimana membaca data genetika morph?',
          answer: 'Setiap kartu morph menyajikan informasi berupa klasifikasi genetik (misal: Recessive, Co-Dominant, atau Polygenetic), kecocokan visual, efek kombinasi genetik, dan tips penting dalam menyilangkan morph tersebut.'
        }
      ]
    },
    {
      id: 'export',
      title: 'Data Export',
      description: 'Cetak sertifikat, label QR, dan backup',
      icon: Download,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      items: [
        {
          id: 'exp-1',
          question: 'Apa fungsi Data Export?',
          answer: 'Modul ini memungkinkan Anda untuk mengunduh, mencetak, atau membackup data farm Anda dalam berbagai format dokumen profesional sesuai kebutuhan administrasi farm.'
        },
        {
          id: 'exp-2',
          question: 'Bagaimana mencetak label kandang?',
          answer: 'Buka tab "Label" di menu Export, pilih gecko yang diinginkan, dan sesuaikan tampilannya. Anda bisa mencetak langsung label identitas yang dilengkapi QR Code unik untuk ditempel di kandang fisik guna mempercepat identifikasi.'
        },
        {
          id: 'exp-3',
          question: 'Apa itu Pro Certificate Card?',
          answer: 'Pro Certificate Card adalah sertifikat fisik eksklusif berdesain profesional yang menampilkan silsilah keluarga (lineage) gecko Anda. Anda dapat mencetaknya untuk diberikan kepada pembeli sebagai jaminan orisinalitas genetika gecko Anda.'
        },
        {
          id: 'exp-4',
          question: 'Bagaimana mengekspor data ke Excel atau PDF?',
          answer: 'Buka tab "Batch Export", tentukan pilihan gecko Anda, lalu klik "Export to Excel" atau "Export to PDF" untuk mendownload tabel komprehensif data gecko Anda secara instan.'
        },
        {
          id: 'exp-5',
          question: 'Bagaimana melakukan Backup Database?',
          answer: 'Gunakan tab "Database" untuk melakukan ekspor basis data cadangan lengkap dalam format JSON. File ini dapat Anda simpan secara lokal untuk menjaga keamanan arsip data farm Anda secara mandiri.'
        }
      ]
    }
  ];

  // Real-time search filter
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeCategoryFilter) {
        return categories.filter(c => c.id === activeCategoryFilter);
      }
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories.map(category => {
      const matchingItems = category.items.filter(item => 
        item.question.toLowerCase().includes(query) || 
        item.answer.toLowerCase().includes(query)
      );
      return {
        ...category,
        items: matchingItems
      };
    }).filter(category => category.items.length > 0);
  }, [searchQuery, activeCategoryFilter]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Panduan Pengguna</h2>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <span>❓</span> Help Center
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Temukan jawaban atas pertanyaan seputar penggunaan Gecko Farm Pro dengan mudah dan cepat.
        </p>
      </div>

      {/* Search Bar & Stats */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            placeholder="Cari bantuan (misal: 'menambahkan gecko', 'profit', 'breeding')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Kategori:</span>
          <button 
            onClick={() => setActiveCategoryFilter(null)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeCategoryFilter === null && !searchQuery
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => {
                setActiveCategoryFilter(cat.id);
                setSearchQuery(''); // Clear search query when changing filter
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeCategoryFilter === cat.id && !searchQuery
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Help Content - Categories & Accordions */}
      <div className="flex flex-col gap-8">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id} className="space-y-4">
              {/* Category Title Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className={`p-2 rounded-xl ${category.color} flex items-center justify-center`}>
                  <category.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-none">{category.title}</h3>
                  <p className="text-slate-400 text-xs mt-1">{category.description}</p>
                </div>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-md">
                  {category.items.length} Topik
                </span>
              </div>

              {/* Accordion Questions */}
              <div className="space-y-3">
                {category.items.map((item) => {
                  const isOpen = !!openItems[item.id];
                  return (
                    <div 
                      key={item.id}
                      className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${
                        isOpen 
                          ? 'border-emerald-500 shadow-md shadow-emerald-500/5' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Accordion Header / Question Toggle */}
                      <button 
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-800 hover:text-emerald-600 transition-colors gap-4"
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {item.question}
                        </span>
                        <div className={`p-1 rounded-lg ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} transition-colors`}>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {/* Accordion Body / Answer */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                          >
                            <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-slate-50 text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Hasil Pencarian Tidak Ditemukan</h3>
            <p className="text-slate-500 text-sm max-w-md">
              Kami tidak dapat menemukan panduan yang sesuai dengan kata kunci "{searchQuery}". Coba gunakan kata kunci lainnya.
            </p>
            <button 
              onClick={handleClearSearch}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Support Assistance */}
      <div className="bg-emerald-600 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Phone size={12} /> Live Support
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">Butuh Bantuan Lebih Lanjut?</h3>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-lg font-medium">
            Jika Anda memiliki pertanyaan spesifik seputar upgrade premium, kendala teknis, atau penyesuaian fitur farm Anda, silakan hubungi Customer Support kami via WhatsApp.
          </p>
        </div>
        <a 
          href="https://wa.me/6285777719980" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-6 py-4 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-xs sm:text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 shrink-0 active:scale-95 group hover:shadow-xl hover:shadow-emerald-950/10"
        >
          <span>Chat WhatsApp</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}
