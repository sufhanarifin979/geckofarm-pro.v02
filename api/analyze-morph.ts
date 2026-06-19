import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// Cache client instance across serverless warm starts to prevent 504 timeouts and cold init penalties
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Permintaan kosong (No prompt provided)" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Serverless] GEMINI_API_KEY is missing");
    return res.status(500).json({ error: "API Key Gemini tidak ditemukan. Silakan tambahkan GEMINI_API_KEY di pengaturan rahasia (Secrets)." });
  }

  try {
    const ai = getAiClient(apiKey);

    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah pakar genetika reptil profesional (Herpticulture Geneticist) yang berspesialisasi dalam Leopard Gecko.
Tugas Anda adalah memberikan laporan intelijen breeder yang sangat teknis, akurat, dan strategis dalam BAHASA INDONESIA.

STRUKTUR LAPORAN (WAJIB):

### **1. ANALISIS STRATEGI BREEDER**
(Fokus pada interaksi fenotipe, warna, dan kualitas visual F1. Jelaskan bagaimana Morph Name akan berinteraksi secara visual.)

### **2. POTENSI GENETIK & HOLD BACK**
(Saran individu mana yang harus dipertahankan sebagai 'holdback' untuk memperkuat lineage. Identifikasi combo paling berharga.)

### **3. PENGEMBANGAN PROYEK MASA DEPAN**
(Saran pairing outcross atau F2 untuk mencapai peak visual performance di masa depan.)

### **4. ANALISIS KOMERSIAL & PASAR**
(Nilai combo ini di mata kolektor global. Seberapa kompetitif project ini?)

### **5. PERINGATAN KRITIS & RISIKO**
> Gunakan format blockquote ini untuk setiap peringatan risiko genetik, kesehatan, atau saran inbreeding yang harus dihindari.

PANDUAN GAYA:
- Gunakan istilah teknis breeder (lineage, outcross, F1, F2, selective breeding).
- Setiap menyebut nama morph atau combo, gunakan format Bold (Contoh: **Diablo Blanco**).
- Berikan analisis yang tajam dan tidak generic.`
      }
    });

    const text = response.text || "Tidak dapat menghasilkan analisis saat ini.";
    return res.status(200).json({ text });
  } catch (error: any) {

  console.error("================================");
  console.error("FULL GEMINI ERROR");
  console.error("STATUS:", error?.status);
  console.error("MESSAGE:", error?.message);
  console.error("ERROR OBJECT:");
  console.error(JSON.stringify(error, null, 2));
  console.error("================================");

  return res.status(error?.status || 500).json({
    error: error?.message || "Unknown Error"
  });
}