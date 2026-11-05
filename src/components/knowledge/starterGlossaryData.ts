import { collection, doc, getDocs, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, clearCachedGlossary } from '../../lib/firebase';
import { GeneticsGlossaryItem, GlossaryCategory } from '../../types';

export const DEFAULT_GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'Dasar Genetika',
  'Pola Pewarisan',
  'Status Genetik',
  'Persilangan',
  'Analisis Breeding',
  'Morph & Seleksi',
  'Risiko Genetik'
];

export const STARTER_GLOSSARY_ITEMS: GeneticsGlossaryItem[] = [
  // --- 1. DASAR GENETIKA ---
  {
    id: 'term-allele-alel',
    term: 'Allele (Alel)',
    slug: 'allele-alel',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: 'Variasi bentuk dari suatu gen pada posisi lokus tertentu. Selalu berpasangan (1 dari Sire, 1 dari Dam).',
    definition: 'Alel adalah pasangan kode genetik yang menempati lokasi (lokus) yang sama pada kromosom. Setiap gecko mewarisi satu alel dari induk jantan (Sire) dan satu alel dari induk betina (Dam). Jika kedua alel sama, gecko berstatus homozigot; jika berbeda, gecko berstatus heterozigot.',
    breedingExample: 'Pada gen Albino Tremper, seekor gecko menerima alel "a" dari bapak dan alel "A" (normal) dari ibu, menjadikannya bergenotipe Aa (Het Albino Tremper).',
    importantNotes: 'Alel mutasi resesif dari lokus berbeda tidak saling berpasangan. Tremper, Bell, dan Rainwater menempati lokus yang berbeda sehingga bukan alel dari gen yang sama.',
    relatedGuideId: 'guide-01-dasar-genetika',
    relatedGuideTitle: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    order: 1,
    status: 'published'
  },
  {
    id: 'term-fenotipe-phenotype',
    term: 'Fenotipe (Phenotype)',
    slug: 'fenotipe-phenotype',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: 'Penampilan fisik luar gecko (warna kulit, pola bercak, warna mata) yang dapat diamati langsung.',
    definition: 'Fenotipe adalah manifestasi fisik dari ekspresi genetik dan pengaruh lingkungan. Dua gecko dapat memiliki fenotipe yang identik (misalnya sama-sama bertubuh Normal atau Albino), tetapi memiliki susunan genetik dalam (genotipe) yang sangat berbeda karena membawa gen Het tersembunyi.',
    breedingExample: 'Gecko Normal Wild Type dan Gecko Normal 100% Het Blizzard memiliki fenotipe yang sama persis (keduanya bercak kuning-hitam), namun genotipenya berbeda.',
    importantNotes: 'Jangan pernah memastikan genotipe gecko hanya berdasarkan fenotipenya, terutama untuk gen resesif tersembunyi.',
    relatedGuideId: 'guide-01-dasar-genetika',
    relatedGuideTitle: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    order: 2,
    status: 'published'
  },
  {
    id: 'term-genotipe-genotype',
    term: 'Genotipe (Genotype)',
    slug: 'genotipe-genotype',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: 'Susunan kode genetik lengkap di dalam tubuh gecko, mencakup sifat visual maupun sifat tersembunyi (Het).',
    definition: 'Genotipe adalah komposisi alel aktual yang dimiliki seekor reptil untuk sifat tertentu. Genotipe menentukan potensi pewarisan sifat kepada generasi anakan berikutnya. Genotipe dituliskan dengan simbol huruf, misalnya AA (Homozygous Normal), Aa (Heterozygous), atau aa (Homozygous Mutant Visual).',
    breedingExample: 'Genotipe seekor Leopard Gecko Eclipse Het Tremper Albino adalah "ee Ta" (Visual Eclipse pembawa Het Tremper).',
    importantNotes: 'Genotipe hanya bisa dipastikan melalui pencatatan silsilah (lineage) yang valid atau melalui pembuktian perkawinan (prove out).',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 3,
    status: 'published'
  },
  {
    id: 'term-lokus-locus',
    term: 'Locus (Lokus)',
    slug: 'locus-lokus',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: 'Posisi atau koordinat spesifik tempat suatu gen berada pada rantai kromosom.',
    definition: 'Lokus adalah alamat fisik gen di dalam DNA. Mutasi gen yang menempati lokus yang sama disebut alelik. Gen resesif yang berbeda lokus tidak akan pernah saling melengkapi untuk menghasilkan anakan visual mutasi.',
    breedingExample: 'Lokus Tremper Albino dan Bell Albino berada di tempat berbeda pada kromosom Leopard Gecko. Mengawinkan Tremper × Bell menghasilkan anakan Wild Type Normal Double Het, bukan anakan Albino.',
    importantNotes: 'Memahami lokus mencegah breeder menyilangkan strain albino berbeda yang berpotensi merusak garis kemurnian strain.',
    relatedGuideId: 'guide-01-dasar-genetika',
    relatedGuideTitle: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    order: 4,
    status: 'published'
  },
  {
    id: 'term-mutasi-mutation',
    term: 'Mutasi (Mutation)',
    slug: 'mutasi-mutation',
    category: 'Dasar Genetika',
    species: 'Umum',
    shortDefinition: 'Perubahan spontan pada urutan DNA yang menghasilkan sifat baru (morph) berbeda dari wild type alami.',
    definition: 'Dalam dunia reptil hobi, mutasi adalah perubahan genetik yang dipertahankan dan dibiakkan secara selektif oleh manusia untuk menghasilkan variasi corak, pigmen (melanin, erythrin, xanthin), pola sisik, atau bentuk tubuh.',
    breedingExample: 'Tremper Albino pertama kali ditemukan oleh Ron Tremper pada tahun 1996 sebagai mutasi resesif spontan dari indukan normal.',
    importantNotes: 'Tidak semua mutasi aman. Sebagian mutasi memiliki efek samping neurologis atau tumorik (pleiotropik), seperti Enigma atau Lemon Frost.',
    relatedGuideId: 'guide-01-dasar-genetika',
    relatedGuideTitle: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    order: 5,
    status: 'published'
  },

  // --- 2. POLA PEWARISAN ---
  {
    id: 'term-recessive-resesif',
    term: 'Recessive (Resesif)',
    slug: 'recessive-resesif',
    category: 'Pola Pewarisan',
    species: 'Umum',
    shortDefinition: 'Gen yang membutuhkan 2 salinan penuh (1 dari Sire dan 1 dari Dam) agar tampil secara visual.',
    definition: 'Sifat resesif hanya dapat diekspresikan pada fenotipe jika kedua alel membawa mutasi tersebut (homozygous mutant, aa). Jika gecko hanya memiliki 1 salinan alel mutasi (heterozygous, Aa), gecko akan berpenampilan normal namun menjadi carrier (100% Het).',
    breedingExample: 'Tremper Albino, Bell, Rainwater, Blizzard, Murphy Patternless, Eclipse (LG), serta Oreo, Amel, Zulu, Patternless, Ghost, Caramel (AFT).',
    importantNotes: 'Jika Anda mengawinkan Visual Resesif dengan Normal non-carrier, 100% anaknya berpenampilan normal dan berstatus 100% Het.',
    relatedGuideId: 'guide-02-pola-pewarisan',
    relatedGuideTitle: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    order: 6,
    status: 'published'
  },
  {
    id: 'term-incomplete-dominant-codom',
    term: 'Incomplete Dominant (Co-Dominant)',
    slug: 'incomplete-dominant-codom',
    category: 'Pola Pewarisan',
    species: 'Umum',
    shortDefinition: 'Gen yang tampil visual pada 1 salinan alel, dan memiliki wujud lebih lanjut (Super Form) saat berjumlah 2 salinan.',
    definition: 'Pada pewarisan Incomplete Dominant, alel mutasi tidak menutupi alel normal secara total melainkan berbaur atau menunjukkan dosis gen. 1 salinan menghasilkan bentuk Heterozygous visual (misal Mack Snow atau Whiteout), sedangkan 2 salinan menghasilkan bentuk Homozygous yang berbeda drastis (Super Snow atau Super Whiteout).',
    breedingExample: 'Mack Snow (LG) dan Whiteout (AFT). Mengawinkan Mack Snow × Mack Snow menghasilkan 25% Super Snow, 50% Mack Snow, dan 25% Normal.',
    importantNotes: 'Berbeda dengan gen resesif, gen Incomplete Dominant TIDAK memiliki status Het tersembunyi—jika geckonya membawa gen, ia PASTI terlihat visual.',
    relatedGuideId: 'guide-02-pola-pewarisan',
    relatedGuideTitle: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    order: 7,
    status: 'published'
  },
  {
    id: 'term-dominant',
    term: 'Dominant',
    slug: 'dominant',
    category: 'Pola Pewarisan',
    species: 'Umum',
    shortDefinition: 'Pola pewarisan di mana cukup 1 salinan gen dari salah satu induk sudah langsung menampilkan sifat visual pada anakan.',
    definition: 'Gen dominan penuh mengekspresikan sifat yang sama persis baik dalam kondisi 1 salinan (heterozygous) maupun 2 salinan (homozygous). Tidak ada bentuk "Super" visual yang berbeda seperti halnya incomplete dominant.',
    breedingExample: 'Enigma dan White & Yellow (W&Y) pada Leopard Gecko tergolong dominan. Mengawinkan Enigma × Normal menghasilkan 50% anakan visual Enigma.',
    importantNotes: 'Sama seperti Incomplete Dominant, gen dominan tidak memiliki status "Het" tersembunyi. Jika anakan tidak visual, maka ia 100% tidak membawa gen tersebut.',
    relatedGuideId: 'guide-02-pola-pewarisan',
    relatedGuideTitle: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    order: 8,
    status: 'published'
  },
  {
    id: 'term-line-bred-polygenic',
    term: 'Line-Bred (Polygenic)',
    slug: 'line-bred-polygenic',
    category: 'Pola Pewarisan',
    species: 'Umum',
    shortDefinition: 'Sifat warna atau corak yang diwariskan oleh banyak gen dan diperkuat melalui seleksi ketat antargenerasi.',
    definition: 'Line-bred atau poligenik tidak mengikuti hukum persilangan Punnett Square satu gen sederhana. Kualitas warnanya seperti spektrum warna cat air: mengawinkan dua indukan berwarna jingga pekat (Tangerine) akan meningkatkan probabilitas anakan yang sangat jingga, namun tetap memiliki variasi gradasi.',
    breedingExample: 'Tangerine, Black Night, Blood, Clown, Bold Stripe, Jungle (pola tertentu).',
    importantNotes: 'Tidak ada istilah "Het Tangerine" atau "Het Black Night". Jangan membeli gecko normal dengan klaim "Het Black Night" karena sifat poligenik tidak dapat diturunkan sebagai gen tunggal tersembunyi.',
    relatedGuideId: 'guide-02-pola-pewarisan',
    relatedGuideTitle: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    order: 9,
    status: 'published'
  },
  {
    id: 'term-super-form',
    term: 'Super Form',
    slug: 'super-form',
    category: 'Pola Pewarisan',
    species: 'Umum',
    shortDefinition: 'Wujud visual Homozygous (2 salinan alel mutasi) dari gen Incomplete Dominant.',
    definition: 'Super form adalah ekspresi maksimal ketika kedua alel dari lokus gen incomplete dominant sama-sama bermutasi. Super form umumnya memiliki perubahan drastis pada warna dasar tubuh, pola corak, atau warna mata.',
    breedingExample: 'Super Snow pada Leopard Gecko (tubuh putih solid bercak ungu/hitam dengan mata solid hitam). Super Giant (tubuh berukuran sangat masif).',
    importantNotes: 'Pada beberapa mutasi, wujud Super bersifat letal (mematikan embrio), seperti Super Whiteout pada AFT atau Super Lemon Frost pada LG.',
    relatedGuideId: 'guide-02-pola-pewarisan',
    relatedGuideTitle: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    order: 10,
    status: 'published'
  },

  // --- 3. STATUS GENETIK ---
  {
    id: 'term-homozygous',
    term: 'Homozygous',
    slug: 'homozygous',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Kondisi memiliki sepasang alel identik pada satu lokus gen tertentu (2 salinan sama persis).',
    definition: 'Homozygous berarti gecko menerima alel yang sama dari kedua orang tuanya. Pada gen resesif, kondisi homozygous mutant (aa) menyebabkan sifat tersebut muncul secara visual. Pada gen normal, homozygous normal (AA) berarti non-carrier bebas mutasi.',
    breedingExample: 'Seekor Leopard Gecko Tremper Albino Visual pasti berstatus homozygous mutant untuk lokus Tremper Albino.',
    importantNotes: 'Jika homozygous mutant dikawinkan dengan sesama homozygous mutant dari jenis yang sama, 100% anaknya pasti visual.',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 11,
    status: 'published'
  },
  {
    id: 'term-het-heterozygous',
    term: 'Het (Heterozygous)',
    slug: 'het-heterozygous',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Kondisi memiliki 2 alel berbeda pada satu lokus (1 mutasi + 1 normal). Pada gen resesif, berarti pembawa sifat tersembunyi.',
    definition: 'Heterozygous atau disingkat "Het" berarti individu tersebut memiliki 1 alel normal dominan dan 1 alel mutasi resesif (genotipe Aa). Gecko berstatus Het tidak menunjukkan perubahan fisik pada warna kulitnya, tetapi mampu mewariskan alel mutasi tersebut kepada 50% keturunannya.',
    breedingExample: 'Gecko Normal 100% Het Blizzard: dari luar tampak seperti gecko liar berbintik, namun menyimpan kode gen Blizzard di dalam selnya.',
    importantNotes: 'Istilah Het HANYA berlaku untuk gen resesif. Tidak ada istilah Het untuk Mack Snow, Whiteout, Enigma, Tangerine, atau W&Y.',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 12,
    status: 'published'
  },
  {
    id: 'term-100-het',
    term: '100% Het',
    slug: '100-het',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Kepastian mutlak bahwa gecko membawa 1 salinan gen resesif tersembunyi karena salah satu induknya visual.',
    definition: 'Status 100% Het diperoleh ketika minimal salah satu induknya adalah homozygous visual untuk gen resesif tersebut, atau kedua induknya visual. Anakan PASTI menerima alel mutasi tersebut sehingga probabilitas kepemilikan gennya adalah 100% pasti, bukan dugaan.',
    breedingExample: 'Persilangan Jantan Visual Oreo × Betina Normal menghasikan 100% anakan Normal 100% Het Oreo.',
    importantNotes: 'Angka 100% ini bukan persentase visual, melainkan persentase kepastian genotipe carrier.',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 13,
    status: 'published'
  },
  {
    id: 'term-possible-het-ph',
    term: 'Possible Het (Poss Het / PH)',
    slug: 'possible-het-ph',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Peluang statistik bahwa seekor anakan berpenampilan normal membawa gen resesif tersembunyi (misal 66% PH atau 50% PH).',
    definition: 'Ketika indukan carrier disilangkan (Het × Het atau Het × Normal), anakan yang lahir berpenampilan normal memiliki kemungkinan membawa gen resesif atau sama sekali tidak membawa gen (wild type murni). Peluang ini dinyatakan sebagai 66% Poss Het (dari Het × Het) atau 50% Poss Het (dari Het × Normal).',
    breedingExample: 'Persilangan Het Tremper × Het Tremper menghasilkan anakan normal yang berstatus 66% Possible Het Tremper.',
    importantNotes: 'Nilai 66% bukan berarti gecko memiliki 66% bagian gen, melainkan peluang 2 banding 3 bahwa gecko tersebut adalah Het.',
    relatedGuideId: 'guide-05-membaca-hasil-genetik',
    relatedGuideTitle: '3. Membaca Hasil Genetik: Probabilitas, Persentase & Prove Out',
    order: 14,
    status: 'published'
  },
  {
    id: 'term-double-het-dh',
    term: 'Double Het (DH)',
    slug: 'double-het-dh',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Gecko yang membawa salinan tersembunyi untuk DUA gen resesif berbeda sekaligus secara pasti.',
    definition: 'Double Het adalah singkatan untuk individu yang berstatus heterozigot pada dua lokus gen resesif independen. Sangat berharga dalam proyek breeding untuk mencetak combo morph dua gen resesif.',
    breedingExample: 'Leopard Gecko Normal Double Het Blizzard & Eclipse (DH Diablo Blanco) hasil persilangan Blizzard × Eclipse.',
    importantNotes: 'Menyilangkan sesama Double Het hanya memberikan peluang 1 dari 16 (6.25%) per butir telur untuk menghasilkan anakan Visual Double Homozygous.',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 15,
    status: 'published'
  },
  {
    id: 'term-visual',
    term: 'Visual',
    slug: 'visual',
    category: 'Status Genetik',
    species: 'Umum',
    shortDefinition: 'Sifat mutasi genetik yang tampak jelas pada penampilan fisik luar gecko.',
    definition: 'Visual merujuk pada kondisi di mana mutasi gen berhasil diekspresikan pada tubuh reptil dan dapat dilihat oleh mata tanpa perlu pengujian genetik. Pada gen resesif, visual berarti berstatus homozygous mutant.',
    breedingExample: 'Gecko berpenampilan oranye terang dan putih Amelanistic adalah "Visual Amel".',
    importantNotes: 'Gecko Visual dapat mengaburkan gen lain (epistasis), seperti Blizzard yang menutupi pola Eclipse atau Tremper.',
    relatedGuideId: 'guide-08-membaca-genotipe-status-indukan',
    relatedGuideTitle: '1. Membaca Genotipe dan Status Genetik Indukan',
    order: 16,
    status: 'published'
  },

  // --- 4. PERSILANGAN ---
  {
    id: 'term-punnett-square',
    term: 'Punnett Square',
    slug: 'punnett-square',
    category: 'Persilangan',
    species: 'Umum',
    shortDefinition: 'Diagram kisi kotak untuk menghitung dan memvisualisasikan seluruh kemungkinan kombinasi gen anakan.',
    definition: 'Ditemukan oleh ahli genetika Reginald Punnett. Kotak Punnett menyusun alel sperma Sire di sumbu vertikal/horizontal dan alel sel telur Dam di sumbu lainnya untuk memetakan kombinasi genetik yang mungkin terbentuk pada zigot.',
    breedingExample: 'Persilangan Aa (Het) × Aa (Het) pada kotak Punnett 2×2 memperlihatkan 1 AA (Normal), 2 Aa (Het), dan 1 aa (Visual).',
    importantNotes: 'Punnett Square menunjukkan probabilitas teoritis per butir telur, bukan jaminan pasti dalam satu sarang (clutch).',
    relatedGuideId: 'guide-09-analisis-persilangan-peluang-anakan',
    relatedGuideTitle: '2. Analisis Persilangan dan Perhitungan Peluang Anakan',
    order: 17,
    status: 'published'
  },
  {
    id: 'term-prove-out',
    term: 'Prove Out',
    slug: 'prove-out',
    category: 'Persilangan',
    species: 'Umum',
    shortDefinition: 'Proses menguji gecko Possible Het melalui perkawinan terarah untuk membuktikan apakah benar membawa gen mutasi.',
    definition: 'Prove out adalah metode verifikasi genotipe empiris. Seekor gecko yang memiliki status Possible Het (misalnya 66% PH Albino) dikawinkan dengan pasangan Visual Albino atau 100% Het. Jika lahir minimal 1 anakan Visual Albino, maka gecko tersebut dinyatakan resmi TERBUKTI (Proven 100% Het).',
    breedingExample: 'Gecko jantan 66% PH Zulu dikawinkan dengan betina Visual Zulu. Menetas 1 anakan Visual Zulu -> Jantan resmi proven 100% Het Zulu.',
    importantNotes: 'Jika menghasilkan 10 butir telur normal berturut-turut tanpa visual, probabilitas gecko tersebut membawa gen sudah di bawah 0.1%, namun tetap tidak bisa dijamin nol.',
    relatedGuideId: 'guide-05-membaca-hasil-genetik',
    relatedGuideTitle: '3. Membaca Hasil Genetik: Probabilitas, Persentase & Prove Out',
    order: 18,
    status: 'published'
  },
  {
    id: 'term-outcross',
    term: 'Outcross',
    slug: 'outcross',
    category: 'Persilangan',
    species: 'Umum',
    shortDefinition: 'Mengawinkan gecko dengan pasangan dari garis keturunan berbeda (tidak sedarah) untuk memperkuat vitalitas.',
    definition: 'Outcross adalah praktik memasukkan genetika segar tanpa ikatan kekerabatan darah dekat ke dalam koloni penangkaran. Praktik ini meningkatkan heterozigositas umum, memperbaiki daya tahan tubuh, laju pertumbuhan, serta kesuburan telur.',
    breedingExample: 'Breeder mengawinkan jantan Black Night dengan betina Bold Stripe liar berukuran besar untuk memperkuat struktur tulang dan daya tahan anakan.',
    importantNotes: 'Outcross pada morph resesif akan menghasilkan anakan berpenampilan normal Het, sehingga membutuhkan 2 generasi untuk memunculkan kembali visual.',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 19,
    status: 'published'
  },
  {
    id: 'term-test-cross',
    term: 'Test Cross',
    slug: 'test-cross',
    category: 'Persilangan',
    species: 'Umum',
    shortDefinition: 'Perkawinan eksperimental dengan pasangan Homozygous Resesif Visual untuk mengidentifikasi genotipe yang belum pasti.',
    definition: 'Metode persilangan genetika klasik di mana individu berfenotipe normal diuji dengan cara dipasangkan langsung dengan pasangan homozygous resesif (aa). Ini adalah cara tercepat dan paling efisien untuk membuktikan status carrier.',
    breedingExample: 'Mengawinkan Leopard Gecko Normal x Tremper Albino Visual. Jika keluar anakan Albino, induk normal tersebut terbukti Het.',
    importantNotes: 'Jika diuji dengan sesama Het, peluang anakan visual hanya 25%, sehingga membutuhkan jumlah anakan jauh lebih banyak untuk membuktikan.',
    relatedGuideId: 'guide-09-analisis-persilangan-peluang-anakan',
    relatedGuideTitle: '2. Analisis Persilangan dan Perhitungan Peluang Anakan',
    order: 20,
    status: 'published'
  },
  {
    id: 'term-independent-events',
    term: 'Kejadian Independen (Independent Events)',
    slug: 'independent-events',
    category: 'Persilangan',
    species: 'Umum',
    shortDefinition: 'Prinsip probabilitas di mana peluang setiap butir telur menetas tidak dipengaruhi oleh hasil telur sebelumnya.',
    definition: 'Dalam biologi persilangan reptil, pembuahan setiap sel telur oleh sperma adalah kejadian acak yang berdiri sendiri. Jika peluang menetas anakan Visual adalah 25%, setiap telur yang dikeluarkan selalu memiliki peluang 25% yang sama, tanpa peduli apakah telur sebelumnya sudah menetas visual atau belum.',
    breedingExample: 'Jika 4 butir telur pertama dari pasangan Het × Het semuanya menetas Normal, telur ke-5 tetap memiliki peluang visual tepat 25%, bukan 100%.',
    importantNotes: 'Hindari "Gambler\'s Fallacy" (kesesatan penjudi) yang mengira bahwa jika belum mendapat visual maka telur berikutnya dijamin pasti visual.',
    relatedGuideId: 'guide-05-membaca-hasil-genetik',
    relatedGuideTitle: '3. Membaca Hasil Genetik: Probabilitas, Persentase & Prove Out',
    order: 21,
    status: 'published'
  },

  // --- 5. ANALISIS BREEDING ---
  {
    id: 'term-sire-dam',
    term: 'Sire & Dam',
    slug: 'sire-dam',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Sebutan silsilah resmi internasional untuk Induk Jantan (Sire/Bapak) dan Induk Betina (Dam/Ibu).',
    definition: 'Istilah standar dalam pencatatan lineage reptil. Sire merujuk pada gecko jantan penyedia sperma, sedangkan Dam merujuk pada gecko betina penghasil ovum dan yang bertelur. Keduanya memberikan kontribusi genetik 50% kromosom.',
    breedingExample: 'Pada sertifikat Lineage GeckoFarm Pro: "Sire: Male Super Snow Het Murphy Dam: Female Blizzard".',
    importantNotes: 'Catatan silsilah yang akurat wajib mencantumkan Sire dan Dam yang jelas, bukan sekadar "hasil pairing koloni".',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 22,
    status: 'published'
  },
  {
    id: 'term-clutch',
    term: 'Clutch',
    slug: 'clutch',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Satu kelompok telur yang dikeluarkan betina dalam satu periode bertelur (biasanya 1–2 butir pada gecko).',
    definition: 'Clutch adalah sebutan untuk kumpulan telur dalam satu siklus ovulasi. Leopard Gecko dan AFT betina sehat dapat menghasilkan 4 hingga 8 clutch per musim kawin, dengan interval 2 hingga 4 minggu antarsarang.',
    breedingExample: 'Dam bertelur Clutch #1 berisi 2 butir telur fertil yang diinkubasi pada suhu 28°C.',
    importantNotes: 'Telur infertil (slugs) tetap dihitung sebagai clutch namun tidak berkembang.',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 23,
    status: 'published'
  },
  {
    id: 'term-hatchling',
    term: 'Hatchling',
    slug: 'hatchling',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Bayi gecko yang baru menetas dari cangkang telur hingga usia awal adaptasi.',
    definition: 'Fase kehidupan pertama gecko setelah berhasil memotong cangkang telur menggunakan egg tooth. Biasanya berbobot 2–4 gram dan belum membutuhkan pakan sampai pergantian kulit (shedding) pertama selesai.',
    breedingExample: 'Hatchling nomor clutch CL-2026-001 menetas di hari inkubasi ke-48.',
    importantNotes: 'Warna dan corak hatchling seringkali sangat berbeda dengan wujud dewasanya (contoh: hatchling Mack Snow lahir bercak belang hitam-putih kontras).',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 24,
    status: 'published'
  },
  {
    id: 'term-holdback-keep',
    term: 'Holdback (Keep)',
    slug: 'holdback-keep',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Anakan berkualitas terbaik hasil ternak sendiri yang sengaja disimpan untuk calon indukan masa depan.',
    definition: 'Holdback adalah strategi seleksi breeder di mana individu anakan dengan kualitas visual terbaik, struktur tubuh ideal, atau genotipe kunci tidak dijual ke publik melainkan dirawat hingga dewasa untuk memperkuat proyek breeding sendiri.',
    breedingExample: 'Breeder menahan (holdback) seekor betina Black Night dengan persentase hitam 85% untuk dijadikan indukan F2.',
    importantNotes: 'Memilih holdback yang tepat adalah kunci utama kemajuan kualitas genetik dan reputasi peternakan (farm).',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 25,
    status: 'published'
  },
  {
    id: 'term-tsd-tsm-tsf',
    term: 'TSD (TSM / TSF)',
    slug: 'tsd-tsm-tsf',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Temperature-Dependent Sex Determination: Penentuan jenis kelamin embrio berdasarkan suhu inkubator telur.',
    definition: 'Leopard Gecko dan AFT tidak memiliki kromosom kelamin seks (seperti XX/XY). Jenis kelamin ditentukan oleh suhu rata-rata selama 3 minggu pertama inkubasi. Suhu rendah (26–27.5°C) menghasilkan betina (TSF), suhu sedang (30.5–31.5°C) menghasilkan jantan (TSM), dan suhu sangat tinggi (32.5°C+) menghasilkan "hot female" yang seringkali infertil/agresif.',
    breedingExample: 'Breeder menginkubasi telur pada suhu 31°C konstan untuk menargetkan penetasan Jantan (TSM).',
    importantNotes: 'TSD adalah kecenderungan statistik dengan akurasi 85–95%, bukan jaminan 100%. Pembuktian jenis kelamin mutlak baru bisa dilihat saat pori femoral berkembang di usia sub-dewasa.',
    relatedGuideId: 'guide-04-dasar-pairing',
    relatedGuideTitle: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    order: 26,
    status: 'published'
  },
  {
    id: 'term-expected-vs-actual',
    term: 'Expected Ratio vs Actual Outcome',
    slug: 'expected-ratio-vs-actual-outcome',
    category: 'Analisis Breeding',
    species: 'Umum',
    shortDefinition: 'Perbedaan antara rasio kalkulasi teori (kalkulator genetik) dengan realitas anakan yang menetas.',
    definition: 'Kalkulator genetik memberikan perbandingan harapan matematis (expected ratio). Pada populasi kecil (misal hanya 4–8 butir telur per musim), fluktuasi acak (sample size effect) sangat sering terjadi sehingga hasil nyata (actual outcome) bisa melenceng jauh dari rasio teori.',
    breedingExample: 'Teori memprediksi 50% anakan jantan dan 50% betina, namun dari 6 butir telur yang menetas semuanya kebetulan jantan.',
    importantNotes: 'Jangan menyimpulkan kalkulator atau rumus Punnett Square salah hanya karena dari 2 butir telur belum mendapatkan morph yang diinginkan.',
    relatedGuideId: 'guide-09-analisis-persilangan-peluang-anakan',
    relatedGuideTitle: '2. Analisis Persilangan dan Perhitungan Peluang Anakan',
    order: 27,
    status: 'published'
  },

  // --- 6. MORPH & SELEKSI ---
  {
    id: 'term-albino-strain-lg',
    term: 'Albino Strain (Tremper / Bell / Rainwater)',
    slug: 'albino-strain-lg',
    category: 'Morph & Seleksi',
    species: 'Leopard Gecko',
    shortDefinition: 'Tiga mutasi albino resesif berbeda pada Leopard Gecko yang tidak boleh saling disilangkan.',
    definition: 'Leopard Gecko memiliki 3 jalur mutasi amelanistik independen: Tremper Albino (1996), Rainwater/Las Vegas Albino (1998), dan Bell Albino (2000). Ketiganya menempati lokus genetik yang berbeda sehingga tidak kompatibel.',
    breedingExample: 'Tremper × Bell menghasilkan anakan Normal bertubuh liar yang membawa Double Het (AaBb), bukan Albino.',
    importantNotes: 'Mengawinkan strain albino berbeda dianggap sebagai kesalahan fatal ("albino cross contamination") dalam komunitas breeder karena merusak kemurnian silsilah dan membingungkan penghobi di kemudian hari.',
    relatedGuideId: 'guide-03a-mengenal-morph-lg',
    relatedGuideTitle: '3. Mengenal Morph, Strain Albino & Kombinasi (Leopard Gecko)',
    order: 28,
    status: 'published'
  },
  {
    id: 'term-amelanistic-amel-aft',
    term: 'Amelanistic (Amel AFT)',
    slug: 'amelanistic-amel-aft',
    category: 'Morph & Seleksi',
    species: 'African Fat-Tailed Gecko',
    shortDefinition: 'Mutasi resesif pada AFT yang menghilangkan pigmen melanin gelap, menghasilkan warna oranye dan krem cerah.',
    definition: 'Amelanistic adalah strain albino khas African Fat-Tailed Gecko. Tubuh gecko amelanistik bebas dari bercak hitam dan cokelat gelap, digantikan oleh warna jingga terang, krem hangat, dan mata berwarna merah ruby keperakan saat terkena cahaya.',
    breedingExample: 'Amel disilangkan dengan Oreo untuk memulai proyek combo White Knight (Oreo Amel).',
    importantNotes: 'Berbeda dengan LG yang memiliki 3 strain, AFT hanya memiliki 1 garis mutasi Amelanistik utama yang stabil.',
    relatedGuideId: 'guide-03b-mengenal-morph-aft',
    relatedGuideTitle: '3. Mengenal Morph & Karakter Genetik (African Fat-Tailed Gecko)',
    order: 29,
    status: 'published'
  },
  {
    id: 'term-combo-morph',
    term: 'Combo Morph',
    slug: 'combo-morph',
    category: 'Morph & Seleksi',
    species: 'Umum',
    shortDefinition: 'Gecko yang menggabungkan dua atau lebih mutasi genetik sekaligus dalam satu tubuh.',
    definition: 'Combo morph adalah hasil rekayasa selektif breeder untuk menggabungkan beberapa sifat mutasi (resesif, incomplete dominant, dominant, atau poligenik) ke dalam satu individu sehingga menghasilkan penampilan yang spektakuler.',
    breedingExample: 'Diablo Blanco (LG) = Tremper Albino + Blizzard + Eclipse. Oreo Patternless Whiteout (AFT) = Oreo + Patternless + Whiteout.',
    importantNotes: 'Nama dagang combo sering menyamarkan gen aslinya (misalnya nama "Raptor" adalah singkatan dari Red-eye Albino Patternless Tremper ORange). Pastikan selalu membaca silsilah kode genetiknya.',
    relatedGuideId: 'guide-11-kombinasi-gen-combo-morph',
    relatedGuideTitle: '4. Kombinasi Gen dan Pembentukan Combo Morph',
    order: 30,
    status: 'published'
  },
  {
    id: 'term-normal-wild-type',
    term: 'Normal / Wild Type',
    slug: 'normal-wild-type',
    category: 'Morph & Seleksi',
    species: 'Umum',
    shortDefinition: 'Tampilan alami asli spesies di alam liar tanpa ekspresi mutasi visual buatan.',
    definition: 'Wild type adalah standar dasar fenotipe alami gecko di habitat aslinya di Asia Tengah (LG) atau Afrika Barat (AFT). Pada Leopard Gecko, wild type memiliki tubuh dasar kuning berbintik hitam padat dengan ekor putih berbercak.',
    breedingExample: 'Gecko Normal murni sering digunakan dalam program outcross untuk menyegarkan garis keturunan yang terlalu sering mengalami inbreeding.',
    importantNotes: 'Gecko Normal liar belum tentu non-carrier jika berasal dari farm penangkaran—bisa jadi ia adalah 100% Het untuk gen resesif tertentu.',
    relatedGuideId: 'guide-01-dasar-genetika',
    relatedGuideTitle: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    order: 31,
    status: 'published'
  },
  {
    id: 'term-eclipse-solid-eyes',
    term: 'Eclipse / Solid Eyes',
    slug: 'eclipse-solid-eyes',
    category: 'Morph & Seleksi',
    species: 'Leopard Gecko',
    shortDefinition: 'Mutasi resesif pada Leopard Gecko yang mengubah pigmen pupil mata menjadi solid hitam atau solid ruby, sering disertai kaus kaki putih (white nose/feet).',
    definition: 'Eclipse adalah salah satu mutasi mata paling populer pada Leopard Gecko. Dapat mengekspresikan mata hitam pekat total (Full Solid Eclipse), mata setengah hitam (Snake Eyes), serta pola bercak putih khas pada ujung moncong dan keempat telapak kaki.',
    breedingExample: 'Kombinasi Eclipse dengan Tremper Albino menghasilkan "RAPTOR" dengan mata ruby merah menyala.',
    importantNotes: 'Snake Eyes (mata setengah hitam) memiliki kode genetik yang identik dengan Full Solid Eyes (keduanya sama-sama resesif Eclipse).',
    relatedGuideId: 'guide-03a-mengenal-morph-lg',
    relatedGuideTitle: '3. Mengenal Morph, Strain Albino & Kombinasi (Leopard Gecko)',
    order: 32,
    status: 'published'
  },

  // --- 7. RISIKO GENETIK ---
  {
    id: 'term-lethal-gene',
    term: 'Lethal Gene (Gen Letal)',
    slug: 'lethal-gene',
    category: 'Risiko Genetik',
    species: 'Umum',
    shortDefinition: 'Kombinasi genetik yang menyebabkan embrio gagal berkembang atau mati di dalam cangkang telur sebelum menetas.',
    definition: 'Alel mutasi letal adalah alel yang menyebabkan kematian organisme ketika berada dalam dosis homozygous tertentu. Pada reptil, embrio dengan gen letal homozigot biasanya mati saat pembentukan organ awal sehingga telur mengempis (bad egg) di inkubator.',
    breedingExample: 'Homozygous Super Whiteout pada African Fat-Tailed Gecko bersifat letal embrionik 100%.',
    importantNotes: 'Jangan pernah mengawinkan dua indukan yang sama-sama membawa gen letal homozigot (misalnya Whiteout × Whiteout pada AFT).',
    relatedGuideId: 'guide-06a-genetic-warning-lg',
    relatedGuideTitle: '5. Genetic Warning & Etika Breeding (Leopard Gecko)',
    order: 33,
    status: 'published'
  },
  {
    id: 'term-enigma-syndrome',
    term: 'Enigma Syndrome (ES)',
    slug: 'enigma-syndrome',
    category: 'Risiko Genetik',
    species: 'Leopard Gecko',
    shortDefinition: 'Gangguan neurologis bawaan pada gen Enigma yang menyebabkan gecko berputar-putar, kepala miring (stargazing), dan gagal menangkap mangsa.',
    definition: 'Enigma adalah mutasi dominan indah pada Leopard Gecko yang sayangnya terkait erat secara genetik dengan kelainan sistem saraf pusat. Gejala Enigma Syndrome (ES) bervariasi dari tremor ringan hingga berputar-putar tak terkendali (*death roll*) saat stres atau lapar.',
    breedingExample: 'Mengawinkan Enigma dengan morph apapun tetap membawa risiko gejala neurologis pada anakan visualnya.',
    importantNotes: 'Hingga kini belum ada garis Enigma yang 100% bebas dari risiko ES. Breeder bertanggung jawab wajib memberi tahu calon pembeli mengenai kondisi ini.',
    relatedGuideId: 'guide-06a-genetic-warning-lg',
    relatedGuideTitle: '5. Genetic Warning & Etika Breeding (Leopard Gecko)',
    order: 34,
    status: 'published'
  },
  {
    id: 'term-lemon-frost-tumor',
    term: 'Lemon Frost (Iridophoroma)',
    slug: 'lemon-frost-tumor',
    category: 'Risiko Genetik',
    species: 'Leopard Gecko',
    shortDefinition: 'Mutasi kuning cerah pada Leopard Gecko yang memiliki keterkaitan genetik mutlak dengan pembentukan tumor ganas iridofor.',
    definition: 'Lemon Frost menghasilkan warna kuning neon dan iris putih terang yang luar biasa. Namun, penelitian ilmiah genetika (Long et al., 2020) membuktikan bahwa mutasi pada gen SPINT1 ini secara otomatis memicu pembentukan tumor kanker kulit iridofora seiring bertambahnya usia gecko.',
    breedingExample: 'Bentuk homozigot (Super Lemon Frost) mengembangkan tumor masif yang memperpendek usia hidup secara fatal.',
    importantNotes: 'Sebagian besar asosiasi breeder internasional dan komunitas bertanggung jawab menghentikan pengembangbiakan komersial Lemon Frost demi kesejahteraan hewan (animal welfare).',
    relatedGuideId: 'guide-06a-genetic-warning-lg',
    relatedGuideTitle: '5. Genetic Warning & Etika Breeding (Leopard Gecko)',
    order: 35,
    status: 'published'
  },
  {
    id: 'term-white-yellow-syndrome',
    term: 'White & Yellow (W&Y) Syndrome',
    slug: 'white-yellow-syndrome',
    category: 'Risiko Genetik',
    species: 'Leopard Gecko',
    shortDefinition: 'Gejala gangguan keseimbangan neurologis ringan pada mutasi White & Yellow yang dipicu oleh inbreeding berlebih.',
    definition: 'White & Yellow adalah gen dominan dengan pola warna putih tinggi pada leher dan perut. Garis keturunan W&Y awal sering menunjukkan gejala keseimbangan goyah (*wobbly*) mirip Enigma ringan, meskipun dapat diminimalkan melalui program outcross selektif.',
    breedingExample: 'Breeder mengawinkan W&Y hanya dengan indukan non-W&Y dari garis darah outcross yang sehat dan kuat.',
    importantNotes: 'Jangan pernah mengawinkan W&Y dengan Enigma karena gejala gangguan neurologis keduanya dapat berlipat ganda pada anakan.',
    relatedGuideId: 'guide-06a-genetic-warning-lg',
    relatedGuideTitle: '5. Genetic Warning & Etika Breeding (Leopard Gecko)',
    order: 36,
    status: 'published'
  },
  {
    id: 'term-whiteout-lethal-super-aft',
    term: 'Whiteout Lethal Super (AFT)',
    slug: 'whiteout-lethal-super-aft',
    category: 'Risiko Genetik',
    species: 'African Fat-Tailed Gecko',
    shortDefinition: 'Sifat gen letal pada African Fat-Tailed Gecko ketika dua salinan alel Whiteout bertemu (Homozygous Whiteout).',
    definition: 'Whiteout adalah mutasi incomplete dominant pada AFT yang sangat populer. Namun dalam kondisi homozygous (Super Whiteout), mutasi ini menyebabkan kematian janin 100% di dalam telur sebelum menetas.',
    breedingExample: 'Whiteout × Whiteout menghasilkan 25% telur letal mati, 50% Whiteout hidup, dan 25% Normal.',
    importantNotes: 'Hindari pairing Whiteout × Whiteout. Aturan baku breeder AFT adalah selalu memasangkan Whiteout dengan pasangan Non-Whiteout (misal Whiteout × Normal atau Whiteout × Oreo).',
    relatedGuideId: 'guide-06b-genetic-warning-aft',
    relatedGuideTitle: '5. Genetic Warning, Lethal Gene & Kesuburan (AFT)',
    order: 37,
    status: 'published'
  },
  {
    id: 'term-infertilitas-ghost-caramel-aft',
    term: 'Infertilitas Betina Ghost & Caramel (AFT)',
    slug: 'infertilitas-ghost-caramel-aft',
    category: 'Risiko Genetik',
    species: 'African Fat-Tailed Gecko',
    shortDefinition: 'Tingkat kesuburan sangat rendah pada betina visual Ghost dan Caramel pada African Fat-Tailed Gecko.',
    definition: 'Dalam genetik African Fat-Tailed Gecko, betina berpenampilan Visual Ghost dan Visual Caramel sering kali mengalami kendala biologis reproduksi seperti ovulasi macet, telur tanpa cangkang (slugs), atau tidak mampu mempertahankan kehamilan.',
    breedingExample: 'Solusi standar breeder adalah menggunakan Jantan Visual Ghost/Caramel yang dipasangkan dengan Betina 100% Het Ghost/Caramel.',
    importantNotes: 'Jangan memaksakan betina visual Ghost/Caramel untuk bereproduksi jika kondisinya lemah; gunakan betina Het sebagai kunci proyek.',
    relatedGuideId: 'guide-06b-genetic-warning-aft',
    relatedGuideTitle: '5. Genetic Warning, Lethal Gene & Kesuburan (AFT)',
    order: 38,
    status: 'published'
  }
];

/**
 * Idempotently seeds starter glossary items into Firestore collection 'genetics_glossary'
 */
export async function seedStarterGlossaryToFirestore(): Promise<{ count: number; migrated: number }> {
  try {
    const existingSnap = await getDocs(query(collection(db, 'genetics_glossary')));
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    let batch = writeBatch(db);
    let opCount = 0;
    let seeded = 0;

    for (const item of STARTER_GLOSSARY_ITEMS) {
      if (!existingIds.has(item.id)) {
        const docRef = doc(collection(db, 'genetics_glossary'), item.id);
        batch.set(docRef, {
          term: item.term,
          slug: item.slug,
          category: item.category,
          species: item.species,
          shortDefinition: item.shortDefinition,
          definition: item.definition,
          breedingExample: item.breedingExample || '',
          importantNotes: item.importantNotes || '',
          relatedGuideId: item.relatedGuideId || '',
          relatedGuideTitle: item.relatedGuideTitle || '',
          order: item.order,
          status: item.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        opCount++;
        seeded++;

        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    clearCachedGlossary();
    return { count: seeded, migrated: 0 };
  } catch (err) {
    console.warn('Kendala seeding glosarium ke Firestore:', err);
    throw err;
  }
}
