import { useState, useEffect } from 'react';
import { db, setFirestoreQuotaExceeded } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { UserProfile, FinanceTransaction } from '../types';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  X, 
  Loader2, 
  Calendar, 
  FileText, 
  Trash2, 
  Tag,
  PiggyBank,
  TrendingUp,
  ShoppingBag,
  CircleDollarSign,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinanceProps {
  profile: UserProfile | null;
}

const EXPENSE_CATEGORIES = [
  { value: 'Feed', label: 'Feed (Pakan)' },
  { value: 'Supplement', label: 'Supplement (Suplemen)' },
  { value: 'Electricity', label: 'Electricity (Listrik)' },
  { value: 'Equipment', label: 'Equipment (Peralatan)' },
  { value: 'Veterinary', label: 'Veterinary (Medis/Dokter)' },
  { value: 'Other', label: 'Other (Lainnya)' }
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export default function Finance({ profile }: FinanceProps) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Improvements State
  const [monthFilter, setMonthFilter] = useState<'this-month' | 'last-month' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'expense'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
  const [selectedGeckoDetails, setSelectedGeckoDetails] = useState<any | null>(null);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: 'Feed',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    // 1. Immediately feed UI with the instant offline cache to prevent empty screen or loaders
    try {
      const cached = localStorage.getItem(`cache_transactions_${profile.uid}`);
      if (cached) {
        setTransactions(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Failed to load local cache into Finance component:", e);
    }

    // Safe query without composite index by sorting in-memory
    const q = query(
      collection(db, 'finance_transactions'),
      where('userId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: FinanceTransaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as FinanceTransaction);
      });

      // Sort in-memory by date (descending), secondary sort by id or timestamp
      list.sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || '').localeCompare(a.id || '');
      });

      setTransactions(list);
      setLoading(false);

      // Update local storage cache
      try {
        localStorage.setItem(`cache_transactions_${profile.uid}`, JSON.stringify(list));
      } catch (e) {
        console.warn("Failed to update local storage transaction cache:", e);
      }
    }, (error) => {
      console.error("Error loading transactions:", error);
      setLoading(false);
      
      const errMsg = error instanceof Error ? error.message : String(error);
      const isQuota = errMsg.toLowerCase().includes('quota') || 
                      errMsg.toLowerCase().includes('resource-exhausted') || 
                      (error as any)?.code === 'resource-exhausted';
      
      if (isQuota) {
        setFirestoreQuotaExceeded(true);
      }

      // Re-load cache upon failure to ensure data presence
      try {
        const cached = localStorage.getItem(`cache_transactions_${profile.uid}`);
        if (cached) {
          setTransactions(JSON.parse(cached));
        }
      } catch (e) {
        console.warn("Failed to load local fallback cache on error:", e);
      }

      addToast(
        isQuota 
          ? "Firestore Daily Quota Terlampaui. Menampilkan data offline/cadangan." 
          : "Gagal menyinkronkan riwayat transaksi.", 
        "error"
      );
    });

    return () => unsubscribe();
  }, [profile]);

  // Fetch gecko details when a transaction is selected
  useEffect(() => {
    if (selectedTransaction && selectedTransaction.geckoId) {
      const fetchGecko = async () => {
        try {
          const d = await getDoc(doc(db, 'geckos', selectedTransaction.geckoId!));
          if (d.exists()) {
            setSelectedGeckoDetails(d.data());
          } else {
            setSelectedGeckoDetails(null);
          }
        } catch (err) {
          console.warn("Failed to fetch gecko details for transaction:", err);
          setSelectedGeckoDetails(null);
        }
      };
      fetchGecko();
    } else {
      setSelectedGeckoDetails(null);
    }
  }, [selectedTransaction]);

  // Month filter calculations
  const getFilterBounds = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-11
    
    const pad = (n: number) => String(n).padStart(2, '0');
    
    if (monthFilter === 'this-month') {
      const firstDay = `${y}-${pad(m + 1)}-01`;
      const lastDayDate = new Date(y, m + 1, 0).getDate();
      const lastDay = `${y}-${pad(m + 1)}-${pad(lastDayDate)}`;
      return { start: firstDay, end: lastDay };
    } else if (monthFilter === 'last-month') {
      const prevY = m === 0 ? y - 1 : y;
      const prevM = m === 0 ? 11 : m - 1;
      const firstDay = `${prevY}-${pad(prevM + 1)}-01`;
      const lastDayDate = new Date(prevY, prevM + 1, 0).getDate();
      const lastDay = `${prevY}-${pad(prevM + 1)}-${pad(lastDayDate)}`;
      return { start: firstDay, end: lastDay };
    }
    return { start: '', end: '' };
  };

  const bounds = getFilterBounds();

  // 1. Filtered Transactions strictly based on Period Month Filter
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    if (monthFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      if (customStartDate && t.date < customStartDate) return false;
      if (customEndDate && t.date > customEndDate) return false;
      return true;
    }
    return t.date >= bounds.start && t.date <= bounds.end;
  });

  // 2. Calculations based on currently filtered period
  const revenue = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const profit = revenue - expenses;

  // Sold Gecko is the count of gecko_sale transactions
  const soldGeckoCount = filteredTransactions.filter(t => t.type === 'sale' && t.category === 'gecko_sale').length;

  // Quick Summary auto calculations
  const sales = filteredTransactions.filter(t => t.type === 'sale');
  const highestSale = sales.length > 0 ? Math.max(...sales.map(t => t.amount || 0)) : 0;
  const avgSalePrice = sales.length > 0 ? sales.reduce((sum, t) => sum + (t.amount || 0), 0) / sales.length : 0;

  // Top Expense Category (highest accumulated spend)
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
  const expenseByCategory = expenseTransactions.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
    return acc;
  }, {});

  let topExpenseCategory = 'N/A';
  let maxExpenseAmt = 0;
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    if (amt > maxExpenseAmt) {
      maxExpenseAmt = amt;
      topExpenseCategory = cat;
    }
  });

  // Recharts Chart Data
  const chartData = Object.entries(expenseByCategory).map(([name, value]) => {
    let displayName = name;
    if (name === 'Veterinary') displayName = 'Medicine';
    return { name: displayName, value };
  }).filter(item => item.value > 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const amountNum = parseFloat(expenseForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addToast("Please enter a valid amount", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'finance_transactions'), {
        userId: profile.uid,
        type: 'expense',
        category: expenseForm.category,
        amount: amountNum,
        date: expenseForm.date,
        notes: expenseForm.notes.trim() || '',
        createdAt: serverTimestamp()
      });

      addToast("Expense successfully recorded!");
      setIsExpenseModalOpen(false);
      // Reset form
      setExpenseForm({
        category: 'Feed',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err: any) {
      console.error("Error saving expense:", err);
      addToast(err.message || "Failed to save transaction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, 'finance_transactions', id));
      addToast("Transaction deleted successfully");
      if (selectedTransaction?.id === id) {
        setSelectedTransaction(null);
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      addToast("Failed to delete transaction", "error");
    }
  };

  // Formatting helpers
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthIndex] || parts[1]} ${year}`;
    }
    return dateStr;
  };

  const getMonthFilterLabel = () => {
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (monthFilter === 'this-month') {
      return `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else if (monthFilter === 'last-month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${months[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
    } else if (monthFilter === 'custom') {
      if (!customStartDate && !customEndDate) return "Semua Periode";
      return `${formatDate(customStartDate) || '?'} s/d ${formatDate(customEndDate) || '?'}`;
    }
    return "Semua Periode";
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.notes || (t.buyer ? `Buyer: ${t.buyer}` : t.category === 'gecko_sale' ? `Gecko ID: ${t.geckoId || ''}` : ''),
      t.amount
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gecko_Farm_Pro_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Report exported successfully!");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header branding
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Gecko Farm Pro", 15, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("FINANCIAL STATEMENT & REPORT", 15, 30);
    
    // Details
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Farm Profile:", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(profile?.farmName || "Gecko Farm Pro Partner", 15, 62);
    doc.text(`Email: ${profile?.email || 'N/A'}`, 15, 68);
    
    doc.setFont("helvetica", "bold");
    doc.text("Report Period:", 130, 55);
    doc.setFont("helvetica", "normal");
    doc.text(getMonthFilterLabel(), 130, 62);
    doc.text(`Generated At: ${new Date().toLocaleDateString('id-ID')}`, 130, 68);
    
    // Summary Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, 78, 180, 28, 3, 3, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("REVENUE", 25, 87);
    doc.text("EXPENSES", 85, 87);
    doc.text("NET PROFIT", 145, 87);
    
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(formatIDR(revenue), 25, 96);
    
    doc.setTextColor(239, 68, 68); // rose-500
    doc.text(formatIDR(expenses), 85, 96);
    
    const rProfit = profit >= 0 ? 15 : 239;
    const gProfit = profit >= 0 ? 23 : 68;
    const bProfit = profit >= 0 ? 42 : 68;
    doc.setTextColor(rProfit, gProfit, bProfit);
    doc.setFont("helvetica", "bold");
    doc.text(formatIDR(profit), 145, 96);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Sold Geckos in Period: ${soldGeckoCount}`, 15, 114);
    
    // Transaction details header
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text("Transaction History Details", 15, 125);
    
    // Build table row array
    const tableRows = filteredTransactions.map(t => [
      formatDate(t.date),
      t.type.toUpperCase(),
      t.category === 'gecko_sale' ? 'Gecko Sale' : t.category,
      t.notes || (t.buyer ? `Buyer: ${t.buyer}` : t.geckoId ? `Gecko ID: ${t.geckoId}` : '-'),
      `${t.type === 'sale' ? '+' : '-'} ${formatIDR(t.amount)}`
    ]);
    
    autoTable(doc, {
      startY: 130,
      head: [['Date', 'Type', 'Category', 'Notes / Description', 'Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    doc.save(`Gecko_Farm_Pro_Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    addToast("PDF Report exported successfully!");
  };

  // 3. Search and filter transaction list for table presentation
  let processedTransactions = filteredTransactions;
  if (typeFilter !== 'all') {
    processedTransactions = processedTransactions.filter(t => t.type === typeFilter);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    processedTransactions = processedTransactions.filter(t => {
      const dateStr = formatDate(t.date).toLowerCase();
      const typeStr = t.type.toLowerCase();
      const catStr = (t.category || '').toLowerCase();
      const buyerStr = (t.buyer || '').toLowerCase();
      const notesStr = (t.notes || '').toLowerCase();
      const amountStr = String(t.amount);
      const geckoIdStr = (t.geckoId || '').toLowerCase();
      return dateStr.includes(q) || 
             typeStr.includes(q) || 
             catStr.includes(q) || 
             buyerStr.includes(q) || 
             notesStr.includes(q) || 
             amountStr.includes(q) ||
             geckoIdStr.includes(q);
    });
  }

  // Sorting
  processedTransactions.sort((a, b) => {
    if (sortOption === 'newest') {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;
      return (b.id || '').localeCompare(a.id || '');
    } else if (sortOption === 'oldest') {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.id || '').localeCompare(b.id || '');
    } else if (sortOption === 'highest') {
      return (b.amount || 0) - (a.amount || 0);
    } else if (sortOption === 'lowest') {
      return (a.amount || 0) - (b.amount || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Finance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl border text-xs font-bold pointer-events-auto flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <X size={14} className="opacity-60 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>

      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Financial overview</h2>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Export Action Menu */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-sans font-bold rounded-2xl transition-all text-xs flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileText size={16} />
              Export
            </button>
            {isExportDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportDropdownOpen(false)} />
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      handleExportPDF();
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>📄</span> Export PDF
                  </button>
                  <button
                    onClick={() => {
                      handleExportCSV();
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>📊</span> Export CSV
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-sans font-bold rounded-2xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/10 cursor-pointer"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Month Filters segment */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(['this-month', 'last-month', 'custom'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setMonthFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                monthFilter === filter
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {filter === 'this-month' ? 'This Month' : filter === 'last-month' ? 'Last Month' : 'Custom Range'}
            </button>
          ))}
        </div>
        
        {monthFilter === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-400 text-xs font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">Income</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Revenue</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{formatIDR(revenue)}</h3>
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-[9px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-0.5 rounded-lg">Expense</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Expenses</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{formatIDR(expenses)}</h3>
          </div>
        </div>

        {/* Card 3: Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
            }`}>
              <PiggyBank size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
              profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
            }`}>
              {profit >= 0 ? 'Net Profit' : 'Loss'}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Profit</p>
            <h3 className={`text-lg sm:text-2xl font-black leading-none ${profit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {formatIDR(profit)}
            </h3>
          </div>
        </div>

        {/* Card 4: Sold Gecko */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={20} />
            </div>
            <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg">Sales</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Sold Gecko</p>
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{soldGeckoCount}</h3>
          </div>
        </div>
      </div>

      {/* Quick Summary & Pie Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Summary list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Quick Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 h-full">
            {/* Highest Sale */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Highest Sale</p>
                <h4 className="text-base font-black text-slate-900 leading-none">
                  {highestSale > 0 ? formatIDR(highestSale) : 'Rp 0'}
                </h4>
              </div>
            </div>

            {/* Top Expense */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Top Expense</p>
                <h4 className="text-base font-black text-slate-900 leading-none">
                  {topExpenseCategory !== 'N/A' ? topExpenseCategory : '-'}
                </h4>
                {maxExpenseAmt > 0 && (
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{formatIDR(maxExpenseAmt)}</p>
                )}
              </div>
            </div>

            {/* Average Sale */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Average Sale</p>
                <h4 className="text-base font-black text-slate-900 leading-none">
                  {avgSalePrice > 0 ? formatIDR(avgSalePrice) : 'Rp 0'}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Category Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Expense Share</h3>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight">by Category</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[260px]">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                  <PieChartIcon size={20} className="stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">No Expense Data</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">No expenses have been recorded for the selected period.</p>
              </div>
            ) : (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [formatIDR(value), 'Total']} 
                      contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main empty state or table view */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 sm:p-20 text-center flex flex-col items-center justify-center shadow-sm max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
            <CircleDollarSign size={40} className="stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Financial Records Yet</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mb-8 leading-relaxed font-sans">
            Start by selling your first gecko or recording your first expense.
          </p>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-sans font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      ) : (
        /* Transaction History Panel */
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Transaction History</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold tracking-tight bg-white border px-3 py-1 rounded-xl shadow-sm">
              Total {processedTransactions.length} of {filteredTransactions.length} Transactions
            </span>
          </div>

          {/* Search, Sort, Type filter toolbar */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by category, buyer, note, or amount..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-50/50 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sort</span>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-black text-slate-700 uppercase tracking-wider focus:outline-none appearance-none pr-4 relative cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shrink-0">
                {(['all', 'sale', 'expense'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      typeFilter === type
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'sale' ? 'Sales' : 'Expenses'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {processedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <CircleDollarSign size={24} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">No matching transactions found</p>
                <p className="text-slate-400 text-xs">Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Notes / Buyer</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processedTransactions.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTransaction(t)}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-medium text-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          <span>{formatDate(t.date)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                          t.type === 'sale'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700 font-bold capitalize">
                        <div className="flex items-center gap-1.5">
                          <Tag size={12} className="text-slate-400 shrink-0" />
                          <span>{t.category === 'gecko_sale' ? 'Gecko Sale' : t.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                        {t.buyer && <span className="font-bold text-slate-700 block mb-0.5">Buyer: {t.buyer}</span>}
                        {t.notes ? (
                          <div className="flex items-center gap-1">
                            <FileText size={12} className="text-slate-300 shrink-0" />
                            <span>{t.notes}</span>
                          </div>
                        ) : (
                          t.category === 'gecko_sale' ? (
                            <span className="text-slate-400 italic">Gecko ID: {t.geckoId || '-'}</span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )
                        )}
                      </td>
                      <td className={`py-4 px-6 text-right font-black text-sm tracking-tight ${
                        t.type === 'sale' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {t.type === 'sale' ? '+' : '-'} {formatIDR(t.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent modal opening
                            handleDeleteTransaction(t.id!);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedTransaction.type === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
              }`}>
                {selectedTransaction.type === 'sale' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
              </div>
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                  selectedTransaction.type === 'sale'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {selectedTransaction.type === 'sale' ? 'Sale / Income' : 'Expense'}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">Transaction Details</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction Date</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{formatDate(selectedTransaction.date)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {selectedTransaction.category === 'gecko_sale' ? 'Gecko Sale' : selectedTransaction.category}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Nominal</p>
                  <p className={`text-xl font-black tracking-tight mt-0.5 ${
                    selectedTransaction.type === 'sale' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {selectedTransaction.type === 'sale' ? '+' : '-'} {formatIDR(selectedTransaction.amount)}
                  </p>
                </div>
              </div>

              {selectedTransaction.type === 'sale' ? (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gecko Sale Detail</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Buyer</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{selectedTransaction.buyer || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gecko Registry Name / ID</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {selectedGeckoDetails?.name || selectedTransaction.geckoId || '-'}
                      </p>
                    </div>
                    {selectedGeckoDetails && (
                      <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-[11px] font-medium text-slate-500">
                        🦎 <span className="font-bold text-slate-700">{selectedGeckoDetails.name}</span> ({selectedGeckoDetails.morph})
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Purchase Price</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {selectedGeckoDetails?.purchasePrice ? formatIDR(selectedGeckoDetails.purchasePrice) : 'Rp 0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sale Price</p>
                      <p className="text-xs font-black text-emerald-600 mt-1">{formatIDR(selectedTransaction.amount)}</p>
                    </div>
                    <div className="col-span-2 border-t border-dashed border-slate-200 pt-3 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimated Profit</span>
                      <span className="text-sm font-black text-emerald-600">
                        {formatIDR(selectedTransaction.amount - (selectedGeckoDetails?.purchasePrice || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Expense Detail</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">{selectedTransaction.category}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nominal</p>
                      <p className="text-xs font-black text-slate-800 mt-1">{formatIDR(selectedTransaction.amount)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notes / Description</p>
                <p className="text-xs text-slate-600 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 min-h-[3rem]">
                  {selectedTransaction.notes || '-'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteTransaction(selectedTransaction.id!);
                  }}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-sans font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold rounded-2xl transition-all text-xs flex justify-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal Form */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Add Expense</h3>
                <p className="text-xs text-slate-400">Record a new farm expense transaction</p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none focus:border-emerald-500 transition-all focus:outline-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Amount (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 200000"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Notes</label>
                <textarea
                  placeholder="e.g. Purina food 5kg, calcium supplement"
                  rows={2}
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-sans font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Record Expense</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
