import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Cache client instance across serverless warm starts
let cachedAi: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getAiClient(apiKey: string): GoogleGenAI {
  if (!cachedAi || cachedApiKey !== apiKey) {
    cachedAi = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    cachedApiKey = apiKey;
  }
  return cachedAi;
}

// Helper to load morph database
function loadMorphDatabase() {
  try {
    const dbPath = path.join(process.cwd(), 'morph_database.json');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Gagal membaca morph_database.json:", error);
  }
  return {};
}

// Helper to find entry in morph database
function findDbMorph(db: any, name: string | null) {
  if (!name) return null;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Try direct slug check
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (db[slug]) return db[slug];
  
  // Try searching keys
  for (const key of Object.keys(db)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKey === normalized || db[key].name.toLowerCase() === name.toLowerCase()) {
      return db[key];
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resolverResult, parent1, parent2, resultsContext, prompt } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Serverless] GEMINI_API_KEY is missing");
    return res.status(500).json({ error: "API Key Gemini tidak ditemukan. Silakan tambahkan GEMINI_API_KEY di pengaturan rahasia (Secrets)." });
  }

  try {
    const ai = getAiClient(apiKey);
    const db = loadMorphDatabase();

    let dbEntryText = "";
    let closestMatchesText = "";

    if (resolverResult) {
      if (resolverResult.officialMorph) {
        const entry = findDbMorph(db, resolverResult.officialMorph);
        if (entry) {
          dbEntryText = JSON.stringify(entry, null, 2);
        }
      } else if (resolverResult.closestMatches && resolverResult.closestMatches.length > 0) {
        const matchesWithDbInfo = resolverResult.closestMatches.map((m: any) => {
          const entry = findDbMorph(db, m.name);
          return {
            ...m,
            dbInfo: entry ? {
              description: entry.description,
              inheritanceSummary: entry.inheritanceSummary,
              risk: entry.risk,
              aiExplanation: entry.aiExplanation
            } : null
          };
        });
        closestMatchesText = JSON.stringify(matchesWithDbInfo, null, 2);
      }
    }

    // Build the system instructions and model input
    const systemInstruction = `Anda adalah pakar genetika reptil profesional (Herpticulture Geneticist) spesialis Leopard Gecko, pengembangan lineage, breeding project komersial, dan strategi breeder jangka panjang.
Tugas Anda adalah membuat Analisis Breeder Profesional V2 berdasarkan hasil dari Morph Resolver Engine yang diberikan dalam input.

PENTING: Anda TIDAK BOLEH menentukan nama morph sendiri, membuat morph baru, mengubah Official Morph, menggabungkan nama morph, atau membuat trade name kustom. Nama morph sepenuhnya ditentukan oleh Morph Resolver Engine. Anda hanya bertugas menjelaskan dan menganalisis hasil resolver tersebut secara profesional untuk breeder.

STRUKTUR LAPORAN (WAJIB MENGIKUTI STRUKTUR & JUDUL INI SECARA PERSIS):

### **⚠ GENETIC DATA VALIDATION** (HANYA tampilkan jika ada kesalahan nyata dalam data input, jika tidak ada lewati bagian ini)
PENTING: Hanya tampilkan bagian ini jika Anda menemukan kesalahan nyata dalam penulisan genetik pada data input (misalnya, jika teks input mendeskripsikan tipe dominant/incomplete dominant sebagai "Het", seperti "Het White & Yellow", "Het Mack Snow", atau "Het Enigma"). Jika data input tidak mengandung kesalahan tersebut (semua penulisan genetik sudah benar dan sesuai kaidah), maka JANGAN menulis bagian ini sama sekali dan langsung mulai laporan dari '### **🎯 QUICK BREEDER SUMMARY**'. JANGAN mengada-ada atau berhalusinasi membuat kesalahan yang tidak ada pada data input.

### **🎯 QUICK BREEDER SUMMARY**
Target Combo Utama:
(Tulis nama Official Morph resmi dari hasil resolver. Jika hasil resolver mengembalikan officialMorph = null, Anda WAJIB menuliskan kalimat secara persis: "Belum ditemukan morph resmi." lalu jelaskan/bahas closestMatches, missingGenes, dan additionalGenes secara profesional di sini.)

Best Holdback:
(Kandidat holdback terbaik dari hasil breeding)

Project Potential:
[⭐ sampai ⭐⭐⭐⭐⭐]

Commercial Potential:
[⭐ sampai ⭐⭐⭐⭐⭐]

Risk Level:
[⭐ sampai ⭐⭐⭐⭐⭐]

Overall Project Rating:
X.X / 10

(Berikan ringkasan singkat dan mudah dipahami breeder di sini)

──────────────────────────────

### **🧬 COMBO PROBABILITY**
(Tampilkan probabilitas combo morph penting dari data input. Gunakan format:)
**Morph A** = xx%
**Morph B** = xx%
**Morph C** = xx%
**Morph D** = xx%

Jelaskan combo mana yang paling relevan secara breeding dan komersial dari daftar di atas.

──────────────────────────────

### **🔬 Breeder Strategy & Analysis**
Jelaskan analisis mendalam yang berfokus pada:
- **Visual Interaction** antar morph
- **Color Potential** & **Pattern Potential**
- **Clean Appearance**
- **High-End Holdback Potential**
- Kelebihan pairing ini dibanding pairing umum

Gunakan istilah breeder profesional secara terintegrasi: *Lineage*, *Selective Breeding*, *Trait Reinforcement*, *Outcross*, *Visual Consistency*, *F1*, *F2*, *F3*. Fokus pada keputusan dan strategi breeder, hindari teori genetika dasar yang panjang.

──────────────────────────────

### **🏆 HOLDBACK PRIORITY RANKING**
🥇 **Prioritas #1**
- Nilai genetik: ...
- Nilai visual: ...
- Potensi proyek masa depan: ...
- Potensi nilai jual: ...

🥈 **Prioritas #2**
- Nilai genetik: ...
- Nilai visual: ...
- Potensi proyek masa depan: ...
- Potensi nilai jual: ...

🥉 **Prioritas #3**
- Nilai genetik: ...
- Nilai visual: ...
- Potensi proyek masa depan: ...
- Potensi nilai jual: ...

──────────────────────────────

### **💰 SELL / HOLD / BREED NEXT**
- **💰 SELL**: (Morph yang lebih cocok dijual beserta alasan singkat)
- **🏆 HOLD**: (Morph yang wajib disimpan sebagai aset breeding beserta alasan singkat)
- **🔬 BREED NEXT**: (Morph yang paling menarik untuk dipairing pada musim berikutnya beserta alasan singkat)

──────────────────────────────

### **🔬 FUTURE PROJECT DEVELOPMENT**
Jelaskan peta jalan pengembangan proyek untuk membantu breeder membangun proyek breeding yang berkelanjutan:
- Strategi **F2**
- Strategi **F3**
- **Outcross** yang direkomendasikan
- Trait yang perlu diperkuat
- Trait yang perlu dibersihkan
- Target morph premium jangka panjang

──────────────────────────────

### **📊 PROJECT SCORE**
- **Breeding Potential**: ⭐⭐⭐⭐⭐ (Berikan alasan singkat)
- **Commercial Potential**: ⭐⭐⭐⭐⭐ (Berikan alasan singkat)
- **Future Development**: ⭐⭐⭐⭐⭐ (Berikan alasan singkat)
- **Risk Level**: ⭐⭐⭐⭐⭐ (Berikan alasan singkat)

──────────────────────────────

### **💰 MARKET REFERENCE**
"Untuk melihat harga pasar aktual, listing aktif, dan tren penjualan Leopard Gecko, silakan cek katalog partner marketplace Faunary.id. Harga aktual dapat berbeda tergantung kualitas visual, lineage, sex, proven breeder status, dan kondisi pasar saat ini."

JANGAN membuat, menebak, atau memberikan estimasi harga angka apa pun di sini!

──────────────────────────────

### **⚠ GENETIC RISK ANALYSIS**
Deteksi dan jelaskan secara presisi terhadap risiko berikut jika gennya ada di dalam parents atau keturunan:
- Risiko genetik morph terkait (**White & Yellow Syndrome**, **Enigma Syndrome**, **Lemon Frost** Tumor Risk)
- Risiko inbreeding
- Risiko kehilangan trait
- Risiko penurunan kualitas lineage
- Risiko kesehatan yang diketahui

Jika tidak ditemukan risiko spesifik pada gen terkait, tampilkan kalimat ini persis:
"Tidak ditemukan risiko genetik spesifik selain risiko umum breeding."

──────────────────────────────
GAYA PENULISAN:
- Gunakan Bahasa Indonesia profesional dan persuasif, fokus breeder profesional, tidak terlalu bertele-tele atau akademis dasar.
- Setiap kali Anda menyebutkan nama gen atau nama morph, gunakan format Bold (Contoh: **Tremper Albino**, **Enigma**, **RAPTOR**).
- Jika ada peringatan risiko kritis, gunakan format blockquote (>) untuk menekankannya.`;

    const promptText = resolverResult 
      ? `DATA HASIL RESOLVER & KELUARAN GENETIK:
- Hasil Morph Resolver: ${JSON.stringify(resolverResult, null, 2)}
- Parent 1 (Sire): ${parent1 || 'N/A'}
- Parent 2 (Dam): ${parent2 || 'N/A'}
- Probabilitas Genetik Offspring: ${resultsContext || 'N/A'}

${dbEntryText ? `INFORMASI DETIL DARI DATABASE RESMI GECKO FARM PRO:\n${dbEntryText}` : ''}
${closestMatchesText ? `INFORMASI DETIL MENGENAI CLOSEST MATCHES:\n${closestMatchesText}` : ''}

Silakan buat laporan analisis Breeder AI V2 yang sangat profesional sesuai petunjuk sistem.`
      : (prompt || "Buat analisis genetik leopard gecko umum.");

    const response = await ai.models.generateContent({ 
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction
      }
    });

    const text = response.text || "Tidak dapat menghasilkan analisis saat ini.";
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("[Serverless] Gemini Error:", error);
    
    const errorStr = (error?.message || JSON.stringify(error) || '').toLowerCase();
    const isExpiredOrInvalid = errorStr.includes('expired') || errorStr.includes('invalid') || errorStr.includes('api_key_invalid') || error?.status === 400;
    
    if (isExpiredOrInvalid) {
      return res.status(400).json({ 
        error: "API Key Gemini Anda tidak valid atau telah kedaluwarsa. Silakan segarkan halaman dan perbarui/ganti API Key melalui menu Settings > Secrets (atau hubungkan kembali kunci API Anda) untuk melanjutkan." 
      });
    }

    const statusCode = error?.status || 500;
    const message = statusCode === 429 
      ? "Batas tingkat permintaan tercapai (Rate-limited). Silakan coba lagi dalam beberapa menit." 
      : "Gagal melakukan analisis AI. Silakan coba lagi nanti.";
    
    return res.status(statusCode).json({ error: message });
  }
}
