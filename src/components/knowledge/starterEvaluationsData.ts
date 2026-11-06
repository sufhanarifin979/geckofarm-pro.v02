import { collection, doc, getDocs, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, clearCachedEvaluations } from '../../lib/firebase';
import { ClassEvaluationData } from '../../types';

export const STARTER_CLASS_EVALUATIONS: ClassEvaluationData[] = [
  // ==========================================================================
  // 1. KELAS PEMULA
  // ==========================================================================
  {
    id: 'eval-pemula',
    tier: 'Pemula',
    title: 'Rangkuman & Evaluasi Akhir Kelas Pemula',
    subtitle: 'Penutup pembelajaran dasar: Intisari 5 materi pemula, kompetensi utama, studi kasus terpadu, dan 10 soal uji pemahaman sebelum melangkah ke Kelas Menengah.',
    speciesScope: 'Umum (Leopard Gecko & African Fat-Tailed Gecko)',
    accessLevel: 'free',
    status: 'published',
    order: 1,
    estimatedMinutes: 15,
    summaryModules: [
      {
        moduleNumber: 1,
        moduleTitle: 'Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
        keyPoints: [
          'DNA reptil berfungsi seperti buku resep; anakan menerima 50% materi genetik dari Sire (Jantan) dan 50% dari Dam (Betina).',
          'Genotipe adalah susunan kode genetik bawaan dalam sel, sedangkan Fenotipe adalah wujud fisik nyata yang dapat dilihat oleh mata.',
          'Homozygous berarti memiliki 2 salinan alel yang identik (misal AA atau aa).',
          'Heterozygous (Het) berarti memiliki 2 alel berbeda pada lokus yang sama (misal Aa), biasanya membawa sifat mutasi tersembunyi.'
        ]
      },
      {
        moduleNumber: 2,
        moduleTitle: 'Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
        keyPoints: [
          'Recessive: Membutuhkan 2 salinan alel mutasi agar tampil visual. Membawa 1 salinan hanya berstatus 100% Het (carrier) tanpa perubahan fisik.',
          'Incomplete Dominant: 1 salinan menampilkan wujud visual (misal Mack Snow/Whiteout), sedangkan 2 salinan menghasilkan bentuk Super Form.',
          'Dominant: 1 salinan sudah cukup menampilkan visual secara penuh; tidak memiliki bentuk Het tersembunyi.',
          'Line-Bred (Poligenik): Sifat akumulatif yang dipengaruhi oleh kombinasi puluhan gen lewat seleksi terarah multi-generasi (misal Tangerine, Red Stripe).'
        ]
      },
      {
        moduleNumber: 3,
        moduleTitle: 'Mengenal Morph, Strain Albino & Istilah Genetik',
        keyPoints: [
          'Tiga strain albino Leopard Gecko (Tremper, Bell, Rainwater) adalah mutasi lokus independen yang TIDAK kompatibel satu sama lain.',
          'Mengawinkan Tremper Albino × Bell Albino hanya menghasilkan anakan normal berbintik hitam (Double Het) dan merusak kemurnian strain.',
          'African Fat-Tailed Gecko memiliki mutasi khas tersendiri (Oreo, Whiteout, Zulu, Amel, Zero) yang tidak boleh dicampuradukkan dengan morph Leopard Gecko.',
          'Pahami nama morph berdasarkan silsilah gen aslinya, bukan sekadar nama sebutan pasar.'
        ]
      },
      {
        moduleNumber: 4,
        moduleTitle: 'Dasar Pairing: Memahami Pewarisan Induk ke Anakan',
        keyPoints: [
          'Punnett Square adalah alat bantu memetakan kombinasi alel dari sperma jantan dan sel telur betina.',
          'Persilangan Visual Resesif × Normal non-carrier selalu menghasilkan 100% anakan Normal berstatus 100% Het.',
          'Persilangan Het × Normal menghasilkan 50% Het dan 50% Normal non-carrier (secara visual semuanya terlihat normal).',
          'Persilangan Het × Het menghasilkan rasio peluang 25% Visual, 50% Het, dan 25% Normal non-carrier.'
        ]
      },
      {
        moduleNumber: 5,
        moduleTitle: 'Genetic Warning: Membaca Risiko Lethal & Cacat Genetik',
        keyPoints: [
          'Homozygous Dominant Lethal: Beberapa mutasi tidak boleh dipasangkan sesamanya karena embrio homozygous (2 salinan) akan mati dalam telur (contoh Whiteout × Whiteout pada AFT, atau Lemon Frost × Lemon Frost pada LG).',
          'Sindrom Neurologis: Mutasi Enigma pada Leopard Gecko membawa Enigma Syndrome (gangguan keseimbangan, circling, star-gazing) yang tidak dapat dihilangkan dari gen tersebut.',
          'Sensitivitas Mata: Albino dan Eclipse memiliki sensitivitas tinggi terhadap cahaya terang; memerlukan pencahayaan redup dan naungan memadai.',
          'Breeder beretika selalu mengutamakan kesehatan satwa dan menghindari pairing yang menghasilkan kecacatan genetik.'
        ]
      }
    ],
    competencies: [
      'Membedakan dengan tepat antara susunan kode genetik tersembunyi (Genotipe) dan tampilan fisik luar (Fenotipe).',
      'Mengidentifikasi 4 pola pewarisan utama (Resesif, Incomplete Dominant, Dominant, Line-Bred) serta memahami implikasi keberadaan alel carrier (Het).',
      'Mengenali 3 strain albino independen pada Leopard Gecko dan morph dasar African Fat-Tailed Gecko tanpa mencampurnya.',
      'Mampu menghitung peluang persilangan dasar satu gen menggunakan logika Punnett Square sederhana.',
      'Memahami dan menghindari persilangan berisiko lethal serta mutasi yang membawa kelainan neurologis demi kesejahteraan satwa.'
    ],
    caseStudy: {
      title: 'Studi Kasus Pemula: Persilangan Jantan Mack Snow × Betina Normal 100% Het Tremper Albino',
      scenario: 'Seorang penghobi pemula ingin memulai proyek breeding pertamanya dengan memasangkan pejantan Leopard Gecko Mack Snow (Incomplete Dominant) dengan betina Normal 100% Het Tremper Albino (Carrier Recessive). Penghobi tersebut berharap langsung mendapatkan anakan Mack Snow Albino pada clutch pertama.',
      geneticBreakdown: [
        'Lokus 1 (Mack Snow - Incomplete Dominant): Jantan Mack Snow (Ss) × Betina Normal (ss). Hasil peluang lokus ini adalah 50% Mack Snow (Ss) dan 50% Normal (ss). Tidak ada istilah "Het Snow" karena sifat ini langsung tampak visual pada 1 salinan alel.',
        'Lokus 2 (Tremper Albino - Resesif): Jantan Normal non-carrier (AA) × Betina 100% Het Tremper (Aa). Hasil peluang lokus ini adalah 50% 100% Het Tremper (Aa) dan 50% Normal non-carrier (AA). Tidak ada peluang anakan menjadi Visual Albino (aa) karena jantan sama sekali tidak membawa gen Tremper.',
        'Hasil Kombinasi Gabungan: 25% Mack Snow 100% Het Tremper, 25% Mack Snow non-carrier, 25% Normal 100% Het Tremper, dan 25% Normal murni.',
        'Peluang Visual Mack Snow Albino: 0% pada generasi pertama (F1).'
      ],
      keyLesson: 'Untuk menghasilkan anakan visual resesif (seperti Albino), KEDUA INDUK wajib menyumbangkan minimal 1 salinan alel mutasi tersebut. Harapan mendapatkan anakan Mack Snow Albino pada clutch pertama tidak mungkin tercapai secara biologis, namun anakan F1 Mack Snow 100% Het Tremper dapat dibesarkan untuk proyek generasi berikutnya.'
    },
    questions: [
      {
        id: 'pemula-q1',
        question: 'Apa perbedaan mendasar antara Fenotipe dan Genotipe pada gecko?',
        options: [
          'Fenotipe adalah susunan DNA dalam sel, sedangkan Genotipe adalah warna fisik luar',
          'Fenotipe adalah tampilan fisik yang terlihat nyata, sedangkan Genotipe adalah susunan kode genetik bawaan',
          'Fenotipe hanya ada pada gecko jantan, sedangkan Genotipe hanya ada pada gecko betina',
          'Fenotipe selalu berubah setiap bulan, sedangkan Genotipe selalu bernilai 100% Het'
        ],
        correctIndex: 1,
        explanation: 'Fenotipe adalah ekspresi fisik luar yang dapat diamati (warna kulit, corak, bentuk mata), sedangkan Genotipe adalah susunan alel atau kode genetik yang disimpan dalam DNA individu.'
      },
      {
        id: 'pemula-q2',
        question: 'Kapan istilah "Het" (Heterozygous) tepat digunakan dalam deskripsi genetik reptil?',
        options: [
          'Hanya untuk mutasi resesif di mana gecko membawa 1 salinan gen tersembunyi tanpa terlihat visual',
          'Untuk semua gecko yang memiliki warna cerah',
          'Untuk gen dominan seperti Enigma dan White & Yellow',
          'Untuk mutasi incomplete dominant seperti Mack Snow yang belum kawin'
        ],
        correctIndex: 0,
        explanation: 'Istilah Het (Heterozygous carrier) hanya berlaku untuk gen resesif. Gen dominan dan incomplete dominant langsung tampak visual jika geckonya membawa mutasi, sehingga tidak memiliki bentuk Het tersembunyi.'
      },
      {
        id: 'pemula-q3',
        question: 'Pada pola pewarisan Incomplete Dominant (misalnya Mack Snow pada Leopard Gecko), apa yang terjadi jika gecko memiliki 2 salinan alel mutasi (Homozygous)?',
        options: [
          'Gecko akan mati sebelum menetas',
          'Gecko akan kembali berpenampilan Normal liar',
          'Gecko akan mengekspresikan wujud Super Form yang berbeda drastis dari bentuk single copy',
          'Gecko akan berubah menjadi albino'
        ],
        correctIndex: 2,
        explanation: 'Pada incomplete dominant, 1 salinan menghasilkan bentuk visual standar (Mack Snow), sedangkan 2 salinan menghasilkan bentuk Homozygous atau "Super Form" (Super Snow dengan mata solid dan pola bintik padat).'
      },
      {
        id: 'pemula-q4',
        question: 'Mengapa breeder dilarang menyilangkan dua strain albino berbeda (misal Tremper Albino × Bell Albino) pada Leopard Gecko?',
        options: [
          'Karena telur yang dihasilkan pasti akan membusuk',
          'Karena kedua strain berada pada lokus gen berbeda, sehingga anakannya hanya normal double het dan merusak kemurnian galur',
          'Karena anakannya akan langsung berubah menjadi Super Giant',
          'Karena strain Bell Albino tidak dapat kawin dengan strain lain'
        ],
        correctIndex: 1,
        explanation: 'Tremper, Bell, dan Rainwater adalah mutasi pada lokus gen terpisah dan tidak kompatibel (non-allelic). Persilangan antar-strain menghasilkan anakan berpenampilan normal liar yang membawa heterozigot ganda tersembunyi, mencemari garis silsilah kedua strain.'
      },
      {
        id: 'pemula-q5',
        question: 'Jika seekor Leopard Gecko Visual Tremper Albino dikawinkan dengan gecko Normal murni (non-carrier), bagaimana status genetik seluruh anakannya?',
        options: [
          '100% Visual Tremper Albino',
          '50% Visual Tremper Albino dan 50% Normal',
          '100% Normal berstatus 100% Het Tremper Albino',
          '25% Visual Tremper Albino, 50% Het, 25% Normal'
        ],
        correctIndex: 2,
        explanation: 'Induk visual menyumbangkan alel "a" dan induk normal murni menyumbangkan alel "A". Semua anakan menerima genotipe "Aa" (Normal 100% Het Tremper Albino).'
      },
      {
        id: 'pemula-q6',
        question: 'Apa ciri khas pola pewarisan Dominant penuh (seperti White & Yellow atau Enigma)?',
        options: [
          'Cukup 1 salinan alel dari salah satu induk untuk menampilkan ciri fisik mutasi pada anakan',
          'Memerlukan 2 salinan alel agar mutasinya terlihat visual',
          'Anakannya selalu berstatus Possible Het 66%',
          'Hanya dapat diwariskan dari induk betina kepada anak jantan'
        ],
        correctIndex: 0,
        explanation: 'Gen dominan penuh mengekspresikan sifat mutasinya secara utuh baik dalam kondisi 1 salinan (heterozygous) maupun 2 salinan, sehingga cukup 1 induk pembawa untuk menghasilkan keturunan visual.'
      },
      {
        id: 'pemula-q7',
        question: 'Mengapa breeder African Fat-Tailed Gecko TIDAK disarankan mengawinkan Whiteout × Whiteout?',
        options: [
          'Karena Whiteout adalah gen resesif',
          'Karena bentuk homozygous (Super Whiteout) bersifat lethal dan embrio umumnya mati di dalam telur',
          'Karena Whiteout tidak memiliki organ reproduksi',
          'Karena anakannya akan kehilangan semua corak ekor'
        ],
        correctIndex: 1,
        explanation: 'Gen Whiteout pada AFT memiliki sifat homozygous lethal; embrio yang menerima 2 salinan alel Whiteout tidak dapat berkembang sempurna dan mati dalam masa inkubasi.'
      },
      {
        id: 'pemula-q8',
        question: 'Berapa rasio fenotipe yang diprediksi dari persilangan sesama Mack Snow (Mack Snow × Mack Snow)?',
        options: [
          '100% Super Snow',
          '50% Mack Snow dan 50% Normal',
          '25% Super Snow, 50% Mack Snow, dan 25% Normal',
          '75% Super Snow dan 25% Normal'
        ],
        correctIndex: 2,
        explanation: 'Persilangan Ss × Ss menghasilkan rasio genotipe 25% SS (Super Snow), 50% Ss (Mack Snow), dan 25% ss (Normal wild type).'
      },
      {
        id: 'pemula-q9',
        question: 'Bagaimana sifat Line-Bred / Poligenik (seperti Tangerine atau Blood) diwariskan?',
        options: [
          'Sebagai gen resesif tunggal sederhana',
          'Secara bertahap melalui akumulasi kombinasi banyak faktor genetik lewat seleksi pemuliaan multi-generasi',
          'Hanya dapat diwariskan jika menggunakan suhu inkubasi 32 derajat Celcius',
          'Mengikuti aturan Punnett square 25% : 75%'
        ],
        correctIndex: 1,
        explanation: 'Sifat line-bred dipengaruhi oleh puluhan gen pendukung (poligenik). Kualitas intensitas warna atau pola ditingkatkan melalui seleksi indukan terbaik dari generasi ke generasi.'
      },
      {
        id: 'pemula-q10',
        question: 'Apa risiko genetik yang secara permanen melekat pada mutasi Enigma pada Leopard Gecko?',
        options: [
          'Kebutaan total sejak menetas',
          'Enigma Syndrome (gangguan neurologis seperti berputar-putar/circling dan kehilangan keseimbangan)',
          'Kegagalan pembentukan tulang rahang',
          'Kemandulan total pada gecko betina'
        ],
        correctIndex: 1,
        explanation: 'Enigma syndrome adalah kelainan neurologis bawaan yang terikat langsung dengan gen Enigma, menyebabkan gangguan koordinasi gerak dan orientasi ruang saat stres atau berburu.'
      }
    ],
    nextTierIntro: {
      targetTierTitle: 'Kelas Menengah: Analisis & Interpretasi Breeding',
      targetTierLevel: 'Menengah',
      description: 'Selamat atas keberhasilan Anda menguasai fondasi genetika reptil! Di Kelas Menengah, Anda akan beralih dari sekadar penghobi menjadi breeder yang mampu membaca genotipe silsilah secara kritis, menghitung persilangan multi-lokus independen, merancang formula Combo Morph spektakuler, serta mengevaluasi kelayakan indukan secara profesional.',
      highlightTopics: [
        'Membaca Genotipe & Status Indukan (Visual, 100% Het, Possible Het, Non-carrier)',
        'Analisis Persilangan & Punnett Square Lanjutan (AaBb × AaBb)',
        'Membaca Probabilitas Genetik, 66% Poss Het & Metodologi Prove Out',
        'Kombinasi Gen & Pembentukan Combo Morph (LG vs AFT)',
        'Empat Aspek Utama Evaluasi Indukan & Perencanaan Pairing'
      ]
    }
  },

  // ==========================================================================
  // 2. KELAS MENENGAH
  // ==========================================================================
  {
    id: 'eval-menengah',
    tier: 'Menengah',
    title: 'Rangkuman & Evaluasi Akhir Kelas Menengah',
    subtitle: 'Penutup pembelajaran tingkat menengah: Intisari analisis genotipe, probabilitas multi-lokus independen, combo morph, evaluasi indukan, studi kasus terpadu, dan 10 soal uji pemahaman sebelum melangkah ke Kelas Lanjutan.',
    speciesScope: 'Umum (Leopard Gecko & African Fat-Tailed Gecko)',
    accessLevel: 'free',
    status: 'published',
    order: 2,
    estimatedMinutes: 20,
    summaryModules: [
      {
        moduleNumber: 1,
        moduleTitle: 'Membaca Genotipe dan Status Genetik Indukan',
        keyPoints: [
          'Memahami 4 status kepastian genetik: Visual (terlihat nyata), 100% Het (carrier pasti), Possible Het (dugaan statistik), dan Non-carrier.',
          '100% Het hanya didapat jika salah satu atau kedua induknya visual, bukan dari asumsi tanpa data.',
          'Possible Het (66% PH atau 50% PH) adalah peluang statistik, bukan berarti gecko membawa 66% bagian gen.',
          'Pencatatan silsilah yang jujur adalah modal reputasi utama seorang breeder profesional.'
        ]
      },
      {
        moduleNumber: 2,
        moduleTitle: 'Analisis Persilangan dan Perhitungan Peluang Anakan',
        keyPoints: [
          'Persilangan multi-lokus independen mengikuti hukum pemilahan bebas Mendel; peluang masing-masing lokus dihitung secara terpisah lalu dikalikan.',
          'Persilangan sesama Double Het (AaBb × AaBb) menghasilkan 16 kotak kombinasi, di mana peluang Visual Double Homozygous adalah 1/16 atau 6,25%.',
          'Setiap butir telur merupakan kejadian acak independen; hasil telur pertama tidak memengaruhi peluang telur kedua.',
          'Jangan berekspektasi rasio buku teks akan persis muncul pada clutch kecil (2-4 butir telur).'
        ]
      },
      {
        moduleNumber: 3,
        moduleTitle: 'Membaca Hasil Genetik: Probabilitas, Persentase & Prove Out',
        keyPoints: [
          'Nilai 66% Poss Het berasal dari persilangan Het × Het jika anakan yang lahir berpenampilan normal (2 dari 3 peluang anakan non-visual adalah carrier).',
          'Nilai 50% Poss Het berasal dari persilangan Het × Normal non-carrier.',
          'Prove Out adalah proyek pembuktian untuk mengonfirmasi status carrier dengan mengawinkan Possible Het ke pasangan Visual.',
          'Jika Possible Het dikawinkan dengan Visual dan menelurkan minimal 1 anakan visual, maka statusnya terbukti 100% Het seumur hidup.'
        ]
      },
      {
        moduleNumber: 4,
        moduleTitle: 'Kombinasi Gen dan Pembentukan Combo Morph',
        keyPoints: [
          'Combo Morph menggabungkan dua atau lebih mutasi (resesif, incomplete dominant, dominant, atau poligenik) ke dalam satu individu.',
          'Dekonstruksi nama pasar: RAPTOR = Tremper Albino + Eclipse + Patternless Stripe. Diablo Blanco = Tremper + Blizzard + Eclipse.',
          'African Fat-Tailed Gecko memiliki combo mandiri seperti Whiteout Oreo dan Oreo Zulu tanpa percampuran gen Leopard Gecko.',
          'Nama komersial sering menyamarkan gen aslinya; breeder wajib selalu membaca susunan lokus genetik aslinya.'
        ]
      },
      {
        moduleNumber: 5,
        moduleTitle: 'Evaluasi Indukan dan Perencanaan Pairing',
        keyPoints: [
          'Evaluasi indukan bertumpu pada 4 pilar utama: Kondisi Fisik & Kesehatan, Evaluasi Genotipe, Evaluasi Fenotipe Line-Bred, dan Evaluasi Lineage.',
          'Kesehatan fisik dan berat badan betina (≥ 45-50 g pada LG, ≥ 40-45 g pada AFT) adalah syarat mutlak sebelum memperhitungkan morph.',
          'Tentukan tujuan pairing yang jelas: produksi combo tertentu, seleksi line-bred, pemeliharaan galur, atau uji prove out.',
          'Hindari sekadar mengejar combo mahal jika mengorbankan stamina betina dan masa depan perawatan anakan.'
        ]
      }
    ],
    competencies: [
      'Membaca dan memverifikasi sertifikat genetik indukan, membedakan status pasti 100% Het dari dugaan Possible Het.',
      'Menghitung peluang persilangan multi-lokus independen menggunakan rumus perkalian probabilitas Mendel.',
      'Memahami metodologi pengujian genetik (*prove out*) untuk membuktikan kebenaran Possible Het secara bertanggung jawab.',
      'Mendekonstruksi nama pasar combo morph menjadi daftar lokus genetik asli pada Leopard Gecko dan African Fat-Tailed Gecko.',
      'Menerapkan lembar kerja evaluasi indukan dan membuat rencana pairing tertulis yang mempertimbangkan kesehatan satwa dan daya tampung fasilitas.'
    ],
    caseStudy: {
      title: 'Studi Kasus Menengah: Proyek Cetak Combo RAPTOR & Pemilihan Pejantan',
      scenario: 'Seorang breeder memiliki 1 betina Leopard Gecko Normal Double Het Tremper Albino & Eclipse (DH RAPTOR) dengan bobot 56 gram. Breeder memiliki dua pilihan pejantan: Pejantan A (Visual Tremper Albino, 100% Het Eclipse) dan Pejantan B (Normal, 66% Possible Het Tremper Albino, non-carrier Eclipse). Target breeder adalah menghasilkan anakan combo Visual Tremper Albino + Visual Eclipse.',
      geneticBreakdown: [
        'Jika Menggunakan Pejantan A (aa Ee) × Betina (Aa Ee):',
        '• Lokus Tremper (aa × Aa): Peluang Visual Tremper = 50% (1/2), Peluang Het Tremper = 50%.',
        '• Lokus Eclipse (Ee × Ee): Peluang Visual Eclipse = 25% (1/4), Het Eclipse = 50%, Normal non-carrier = 25%.',
        '• Peluang Combo Visual Ganda (Tremper + Eclipse): 50% × 25% = 12,5% (1 dari 8 butir telur).',
        'Jika Menggunakan Pejantan B (A? EE) × Betina (Aa Ee):',
        '• Pejantan B sama sekali tidak membawa gen Eclipse (EE), sehingga peluang menghasilkan anakan Visual Eclipse adalah 0%. Akibatnya, peluang menghasilkan anakan combo Tremper Eclipse adalah 0% mutlak.',
        '• Status Tremper pada Pejantan B juga masih berupa kemungkinan (1/3 peluang bahwa ia adalah normal murni).'
      ],
      keyLesson: 'Pejantan A adalah pilihan rasional dan terukur. Angka 12,5% merupakan probabilitas per butir telur; dalam 1 musim (misal 8 butir telur), tidak ada jaminan pasti lahir tepat 1 ekor combo. Namun dengan Pejantan A, seluruh anakan non-visual memiliki status Het yang terkonfirmasi secara pasti, sedangkan Pejantan B hanya menghasilkan anakan dengan status dugaan yang membingungkan.'
    },
    questions: [
      {
        id: 'menengah-q1',
        question: 'Seekor gecko berpenampilan Normal lahir dari persilangan Het Albino × Het Albino. Apa status genetik gecko tersebut untuk gen albino?',
        options: [
          'Pasti 100% Het Albino',
          '66% Possible Het Albino',
          '50% Possible Het Albino',
          'Pasti Normal non-carrier murni'
        ],
        correctIndex: 1,
        explanation: 'Dari persilangan Het × Het, anakan non-visual hanya memiliki 3 kemungkinan kotak: 2 Het dan 1 Normal murni. Peluang gecko normal tersebut membawa gen resesif adalah 2 dari 3 atau sekitar 66% (66% Possible Het).'
      },
      {
        id: 'menengah-q2',
        question: 'Berapa peluang mendapatkan anakan Visual Double Homozygous (misal Visual Tremper + Visual Eclipse) dari persilangan sesama Double Het (AaBb × AaBb)?',
        options: [
          '50% (1 dari 2)',
          '25% (1 dari 4)',
          '12,5% (1 dari 8)',
          '6,25% (1 dari 16)'
        ],
        correctIndex: 3,
        explanation: 'Setiap lokus resesif memiliki peluang visual 25% (1/4). Karena kedua lokus memilah secara independen, peluang keduanya muncul bersamaan adalah 25% × 25% = 6,25% (1 dari 16 kotak Punnett Square).'
      },
      {
        id: 'menengah-q3',
        question: 'Apa arti dari prinsip "Independent Events" (Kejadian Bebas) dalam penetasan telur reptil?',
        options: [
          'Jika telur pertama menetas normal, maka telur kedua dijamin pasti menetas visual',
          'Setiap butir telur memiliki probabilitas genetik yang sama dan tidak dipengaruhi oleh hasil telur sebelumnya',
          'Semua telur dalam satu clutch pasti memiliki jenis kelamin dan morph yang seragam',
          'Peluang genetik hanya berlaku jika telur diinkubasi pada suhu yang sama'
        ],
        correctIndex: 1,
        explanation: 'Peleburan sperma dan sel telur pada setiap butir telur adalah peristiwa acak independen. Jika peluang combo adalah 25%, setiap telur memiliki peluang 25%, tidak peduli apa hasil telur sebelumnya.'
      },
      {
        id: 'menengah-q4',
        question: 'Apa formula mutasi genetik dasar yang membentuk Combo Morph "RAPTOR" pada Leopard Gecko?',
        options: [
          'Bell Albino + Enigma + Mack Snow',
          'Tremper Albino + Eclipse + Patternless Stripe',
          'Rainwater Albino + Blizzard + Murphy Patternless',
          'Tremper Albino + White & Yellow + Tangerine'
        ],
        correctIndex: 1,
        explanation: 'RAPTOR adalah akronim dari Red-eye Albino Patternless Tremper ORange, yang menggabungkan gen Tremper Albino (resesif), Eclipse (resesif), dan corak Patternless Stripe.'
      },
      {
        id: 'menengah-q5',
        question: 'Pada African Fat-Tailed Gecko (AFT), apa kombinasi genetik yang terkandung dalam morph "Whiteout Oreo"?',
        options: [
          'Incomplete Dominant (Whiteout) + Recessive (Oreo)',
          'Double Recessive (Whiteout + Oreo)',
          'Dominant (Whiteout) + Line-bred (Oreo)',
          'Incomplete Dominant (Whiteout) + Dominant (Oreo)'
        ],
        correctIndex: 0,
        explanation: 'Whiteout adalah mutasi incomplete dominant (memiliki bentuk Super Whiteout lethal), sedangkan Oreo adalah mutasi resesif murni khas AFT.'
      },
      {
        id: 'menengah-q6',
        question: 'Bagaimana metode paling efisien untuk melakukan prove out (uji pembuktian) pada jantan yang berstatus Possible Het Tremper Albino?',
        options: [
          'Mengawinkannya dengan betina Normal murni non-carrier',
          'Mengawinkannya dengan betina Visual Tremper Albino',
          'Mengawinkannya dengan betina Bell Albino',
          'Melihat perubahan warna matanya di bawah sinar ultraviolet'
        ],
        correctIndex: 1,
        explanation: 'Mengawinkan kandidat Possible Het dengan betina Visual Albino akan langsung membuktikan statusnya: jika menetas minimal 1 ekor anakan visual, maka jantan tersebut 100% terbukti carrier (Het).'
      },
      {
        id: 'menengah-q7',
        question: 'Dari persilangan Jantan 100% Het Blizzard × Betina Normal murni non-carrier, apa status anakan yang berpenampilan normal?',
        options: [
          '100% Het Blizzard',
          '66% Possible Het Blizzard',
          '50% Possible Het Blizzard',
          'Semuanya pasti non-carrier murni'
        ],
        correctIndex: 2,
        explanation: 'Persilangan Het (Aa) × Normal (AA) menghasilkan 50% Aa (Het) dan 50% AA (Normal). Karena keduanya berpenampilan normal dan tidak dapat dibedakan secara visual, seluruh anakan berstatus 50% Possible Het.'
      },
      {
        id: 'menengah-q8',
        question: 'Mengapa berat badan dan kondisi fisik betina menjadi syarat nomor satu sebelum memasangkan indukan?',
        options: [
          'Karena betina yang kurus hanya akan menghasilkan anakan berjenis kelamin jantan',
          'Karena produksi telur membutuhkan cadangan kalsium dan energi yang sangat besar; betina kurus berisiko tinggi mengalami egg-binding atau kematian',
          'Karena gen resesif hanya dapat diwariskan jika betina memiliki berat di atas 80 gram',
          'Karena warna anakan akan pudar jika induk betina kurang makan'
        ],
        correctIndex: 1,
        explanation: 'Ovulasi dan pembentukan cangkang telur menguras cadangan lemak dan kalsium tubuh betina. Memaksakan betina yang kurang bobot dapat menyebabkan distosia (egg-binding), MBD akut, atau kematian.'
      },
      {
        id: 'menengah-q9',
        question: 'Seorang breeder mengawinkan sesama Double Het (AaBb × AaBb) dan menetaskan 4 butir telur, namun tidak satu pun anakan yang visual combo. Apakah perhitungan probabilitas salah?',
        options: [
          'Ya, perhitungan genetik kalkulator tidak akurat',
          'Tidak, karena sampel 4 butir telur terlalu kecil untuk mencerminkan rasio statistik 1 banding 16 (6,25%)',
          'Ya, karena seharusnya minimal ada 1 butir telur yang pasti visual',
          'Tidak, tetapi ini membuktikan bahwa kedua indukan pasti bukan carrier'
        ],
        correctIndex: 1,
        explanation: 'Peluang 6,25% (1 dari 16) berarti peluang gagal mendapatkan combo pada 1 telur adalah 93,75%. Pada clutch kecil (4 telur), peluang tidak mendapatkan satu pun combo adalah sekitar 77%.'
      },
      {
        id: 'menengah-q10',
        question: 'Apa fungsi utama pembuatan rencana pairing tertulis sebelum musim kawin dimulai?',
        options: [
          'Hanya sebagai syarat pendaftaran kontes reptil',
          'Memetakan target genetik, memperhitungkan risiko clutch, dan mengevaluasi kesesuaian prediksi dengan hasil aktual',
          'Memastikan seluruh telur pasti menetas pada hari ke-45',
          'Menaikkan harga jual gecko secara otomatis di media sosial'
        ],
        correctIndex: 1,
        explanation: 'Rencana pairing tertulis mendokumentasikan ID indukan, susunan genotipe, target anakan, dan catatan kesehatan sehingga breeder dapat mengevaluasi program pemuliaannya secara terukur dari musim ke musim.'
      }
    ],
    nextTierIntro: {
      targetTierTitle: 'Kelas Lanjutan: Arsitektur Proyek Pemuliaan & Seleksi Holdback',
      targetTierLevel: 'Lanjutan',
      description: 'Selamat atas kelulusan Anda di Kelas Menengah! Anda telah memiliki pemahaman mendalam tentang kalkulasi persilangan multi-lokus dan evaluasi indukan. Di Kelas Lanjutan (Modul Eksklusif GFP Premium), Anda akan mempelajari strategi pemuliaan tingkat ahli: arsitektur proyek multi-generasi (F1-F3), optimasi holdback, seleksi poligenik intensif, pemurnian galur mutasi langka, serta mitigasi risiko inbreeding.',
      highlightTopics: [
        'Arsitektur Proyek Breeding Multi-Generasi F1–F3',
        'Seleksi Poligenik Tingkat Lanjut & Stacking Mutasi',
        'Strategi Pemilihan Holdback Berdasarkan Skor Anatomi & Potensi Genetik',
        'Manajemen Inbreeding, Line-Breeding & Outcrossing Terencana',
        'Etika Pemuliaan Profesional, Standar Silsilah & Mitigasi Risiko Genetik'
      ]
    }
  },

  // ==========================================================================
  // 3. KELAS LANJUTAN
  // ==========================================================================
  {
    id: 'eval-lanjutan',
    tier: 'Lanjutan',
    title: 'Rangkuman & Evaluasi Akhir Kelas Lanjutan',
    subtitle: 'Puncak kurikulum genetika: Arsitektur breeding multi-generasi, seleksi poligenik holdback, outcross terencana, integritas garis keturunan, studi kasus terpadu, dan 10 soal uji kompetensi breeder profesional.',
    speciesScope: 'Umum (Leopard Gecko & African Fat-Tailed Gecko)',
    accessLevel: 'premium',
    status: 'published',
    order: 3,
    estimatedMinutes: 25,
    summaryModules: [
      {
        moduleNumber: 1,
        moduleTitle: 'Interaksi Gen dan Pembentukan Combo Morph',
        keyPoints: [
          'Kombinasi gen adalah kehadiran beberapa gen dalam satu individu, sedangkan interaksi gen terjadi saat suatu gen memengaruhi, menutupi, atau memperkuat ekspresi gen lain.',
          'Kategori interaksi mencakup epistatis (misal Blizzard menutupi corak lain), modifikasi pigmen melanin/pteridin, dan efek aditif poligenik.',
          'Combo morph harus dibedakan antara mutasi independen (misal Mack Snow + Tremper Albino) dan interaksi langsung antar lokus.',
          'Identifikasi visual combo morph wajib didukung oleh pemahaman genotipe indukan untuk menghindari mislabeling komersial.'
        ]
      },
      {
        moduleNumber: 2,
        moduleTitle: 'Analisis Genetik Multi-Gene dan Persilangan Kompleks',
        keyPoints: [
          'Persilangan multi-gene melibatkan dua atau lebih lokus independen yang diwariskan secara terpisah (Hukum Asortasi Bebas Mendel).',
          'Probabilitas anakan multi-locus dihitung dengan mengalikan peluang pada masing-masing lokus (Rule of Multiplication).',
          'Penggunaan diagram alur bertingkat atau kalkulator genetika membantu memetakan rasio fenotipe dan genotipe yang kompleks.',
          'Hindari jebakan Possible Het berantai: kepastian genotipe menurun drastis pada anakan dari indukan multi-carrier yang belum terbukti.'
        ]
      },
      {
        moduleNumber: 3,
        moduleTitle: 'Risiko Genetik, Mutasi, dan Pertimbangan Kesehatan',
        keyPoints: [
          'Tidak semua mutasi genetika bersifat netral; beberapa mutasi terkait langsung dengan kelainan neurologis, sindrom pleiotropik, atau kondisi letal.',
          'Mutasi letal (seperti Super Whiteout pada AFT atau Super Enigma pada LG) menyebabkan kematian embrio di dalam telur.',
          'Sindrom neurologis (seperti Enigma Syndrome pada LG) memerlukan evaluasi etika ketat: hindari membiakkan individu bergejala parah.',
          'Breeder beretika memprioritaskan kesehatan, daya tahan, dan kesejahteraan hewan di atas nilai estetika atau nilai jual semata.'
        ]
      },
      {
        moduleNumber: 4,
        moduleTitle: 'Line-Breeding, Polygenic Selection, dan Pengembangan Bloodline',
        keyPoints: [
          'Line-breeding memanfaatkan hubungan kekerabatan terarah untuk mengunci dan menstabilkan karakteristik unggul dalam satu garis keturunan.',
          'Sifat poligenik (seperti intensitas warna Tangerine) menampilkan variasi kontinu dan dipengaruhi oleh faktor lingkungan serta akumulasi alel minor.',
          'Perbedaan tajam antara selective breeding (memilih sifat tanpa batasan silsilah), line-breeding (kekerabatan terarah), dan inbreeding tak terkontrol.',
          'Outcrossing berkala wajib disisipkan setiap 3–4 generasi untuk memutus inbreeding depression, memulihkan fertilitas, dan menjaga daya tetas telur.'
        ]
      },
      {
        moduleNumber: 5,
        moduleTitle: 'Strategi Proyek Breeding dan Evaluasi Hasil Genetik',
        keyPoints: [
          'Perencanaan proyek breeding modern dibagi menjadi 3 target: Genetic Project (mutasi Mendelian), Phenotype Project (sifat poligenik), atau Bloodline Development.',
          'Evaluasi indukan pra-pairing wajib memverifikasi 5 pilar: genotipe pasti, kualitas fenotipe, riwayat silsilah, status kesehatan prima, dan kematangan usia.',
          'Expected outcome adalah probabilitas statistik jangka panjang, sedangkan actual outcome pada clutch kecil selalu mengalami fluktuasi deviasi sampling.',
          'Penerapan timeline 6 tahap, tabel 7 indikator evaluasi objektif, dan pencatatan master sheet 15 parameter menjamin integritas dan keberhasilan proyek.'
        ]
      }
    ],
    competencies: [
      'Mampu merancang diagram alur (flowchart) proyek breeding 3 generasi (F1-F3) dengan estimasi probabilitas dan kapasitas fasilitas yang realistis.',
      'Menguasai metodologi seleksi kumulatif untuk meningkatkan sifat poligenik dalam kombinasi morph resesif.',
      'Menerapkan sistem scoring anatomi dan genotipe dalam memilih anakan holdback berkualitas tinggi.',
      'Mampu mengelola keseimbangan antara line-breeding terarah dan outcrossing strategis untuk mencegah inbreeding depression.',
      'Menjalankan praktik pemuliaan reptil dengan standar etika tertinggi, transparansi silsilah, dan komitmen perlindungan satwa.'
    ],
    caseStudy: {
      title: 'Studi Kasus Lanjutan: Program 3 Musim Pemurnian Galur Tangerine & Stacking Tremper Albino',
      scenario: 'Sebuah fasilitas breeding ingin mencetak galur "Extreme Tangerine Tremper Albino" dengan saturasi oranye solid hingga ke kepala dan ekor. Breeder memulai dengan pejantan Extreme Tangerine non-albino berkualitas kontes dan betina Tremper Albino berpostur besar.',
      geneticBreakdown: [
        'Musim 1 (F1): Jantan Extreme Tangerine (Poligenik pekat, AA) × Betina Tremper Albino (aa). Seluruh anakan F1 berpenampilan Normal 100% Het Tremper (Aa) dengan saturasi oranye menengah (50% kontribusi poligenik). Breeder menyeleksi 2 betina F1 dengan intensitas oranye tertinggi sebagai calon holdback.',
        'Musim 2 (F2): Pejantan Extreme Tangerine awal di-backcross ke betina holdback F1 terbaik (Aa). Hasil: 50% anakan memiliki warna oranye yang semakin jenuh (75% poligenik), di mana separuhnya berstatus 50% Possible Het Tremper. Di sini, breeder harus mengidentifikasi individu yang terbukti membawa alel Tremper.',
        'Musim 3 (F3): Mengawinkan jantan holdback F2 terpilih yang terbukti Het Tremper dengan betina holdback F2 sesama carrier oranye pekat. Hasil: 25% anakan menetas sebagai Visual Tremper Albino berbadan Tangerine super jenuh dengan anatomi prima.',
        'Manajemen Vitalitas: Di generasi F4, breeder menjadwalkan outcross ke galur Tangerine lain untuk mencegah penurunan daya tetas akibat backcross berturut-turut.'
      ],
      keyLesson: 'Pengembangan morph tingkat tinggi memerlukan kombinasi pemahaman matematika Mendel untuk gen resesif dan disiplin seleksi ketat untuk sifat poligenik. Proyek multi-musim yang sukses dibangun di atas kesabaran, pencatatan teliti per clutch, dan komitmen menyeleksi anakan holdback terbaik.'
    },
    questions: [
      {
        id: 'lanjutan-q1',
        question: 'Dalam arsitektur breeding multi-generasi, apa tujuan utama pembuatan generasi F1 dari dua indukan berlainan sifat murni?',
        options: [
          'Langsung menjual seluruh anakan dengan harga tertinggi',
          'Mencetak individu carrier (Heterozygous) yang menyatukan alel dari kedua induk untuk dipersiapkan pada tahap persilangan F2',
          'Menghilangkan seluruh sifat poligenik liar',
          'Menguji apakah indukan betina tahan terhadap suhu dingin'
        ],
        correctIndex: 1,
        explanation: 'Generasi F1 berfungsi sebagai jembatan genetik untuk menghimpun alel-alel target ke dalam satu individu carrier (Het/Double Het) yang kemudian diseleksi untuk menghasilkan kombinasi visual di F2 atau F3.'
      },
      {
        id: 'lanjutan-q2',
        question: 'Apa dampak biologis negatif yang paling sering muncul akibat inbreeding berlebihan (inbreeding depression) pada reptil?',
        options: [
          'Anakan tumbuh dua kali lebih cepat dari biasanya',
          'Penurunan fertilitas telur, penurunan daya tetas embrio, dan kerentanan tinggi terhadap infeksi penyakit',
          'Semua anakan berubah warna menjadi putih polos',
          'Ekor gecko tidak bisa putus saat diserang predator'
        ],
        correctIndex: 1,
        explanation: 'Inbreeding depression terjadi saat alel resesif berbahaya yang merugikan terakumulasi dalam kondisi homozygous, menyebabkan mortalitas embrio tinggi, cacat kongenital, dan imunitas yang rapuh.'
      },
      {
        id: 'lanjutan-q3',
        question: 'Kapan teknik "Outcrossing" (persilangan darah luar) wajib diterapkan dalam program pemuliaan line-bred?',
        options: [
          'Setiap kali telur pertama menetas',
          'Saat mulai terlihat gejala penurunan vitalitas, daya tetas telur menurun, atau ukuran tubuh generasi baru mengecil',
          'Hanya jika pasar meminta nama morph baru',
          'Tidak boleh dilakukan karena akan merusak genotipe'
        ],
        correctIndex: 1,
        explanation: 'Outcross dengan individu sehat dari garis keturunan berbeda bertujuan menyegarkan heterozigositas dan memulihkan heterosis (vigor hibrida), memperbaiki stamina dan daya tetas yang menurun akibat seleksi ketat.'
      },
      {
        id: 'lanjutan-q4',
        question: 'Dalam memilih kandidat anakan "Holdback", mengapa penilaian struktur anatomi sama pentingnya dengan keindahan warna morph?',
        options: [
          'Karena warna gecko akan hilang saat dewasa jika tulangnya tidak lurus',
          'Karena kecacatan struktur tulang (seperti lordosis atau underbite) dapat diturunkan dan membahayakan fungsi reproduksi generasi mendatang',
          'Karena kontes reptil hanya menilai berat badan',
          'Karena struktur anatomi menentukan apakah gecko berstatus Het atau Visual'
        ],
        correctIndex: 1,
        explanation: 'Indukan holdback adalah fondasi masa depan fasilitas. Menyimpan indukan dengan cacat anatomi akan menyebarkan kelemahan fisik ke seluruh keturunan berikutnya dan membahayakan keselamatan proses bertelur.'
      },
      {
        id: 'lanjutan-q5',
        question: 'Apa yang dimaksud dengan fenomena "Gen Overload" dalam perancangan Combo Morph multi-resesif?',
        options: [
          'Kondisi di mana gecko memiliki terlalu banyak telur dalam perutnya',
          'Penumpukan terlalu banyak mutasi resesif berbeda yang saling menutupi sehingga mengaburkan identitas visual dan menurunkan vitalitas satwa',
          'Gecko yang kelebihan vitamin A dalam menu pakan hariannya',
          'Persilangan yang menghasilkan 100% anakan jantan'
        ],
        correctIndex: 1,
        explanation: 'Gen overload terjadi saat breeder memaksakan 4-5 mutasi resesif dalam satu tubuh. Sering kali warna menjadi pucat/keruh tidak terdefinisi, peluang statistik per telur sangat kecil, dan daya tahan tubuh anakan rentan.'
      },
      {
        id: 'lanjutan-q6',
        question: 'Pada Leopard Gecko, bagaimana interaksi antara suhu inkubasi (TSD) dan seleksi poligenik intensitas warna (misal Tangerine)?',
        options: [
          'Suhu inkubasi tidak memiliki pengaruh apa pun pada warna kulit',
          'Suhu inkubasi yang lebih tinggi (pria/hot female) cenderung mengoptimalkan sintesis pigmen pteridin/oranye, namun genotipe poligenik bawaan tetap menjadi penentu batas maksimal kualitas',
          'Suhu dingin dapat mengubah gecko normal menjadi visual Tangerine murni',
          'Suhu inkubasi hanya memengaruhi warna mata, bukan warna tubuh'
        ],
        correctIndex: 1,
        explanation: 'Meskipun suhu inkubasi hangat memicu ekspresi pigmen yang lebih cerah, potensi puncak warna tetap ditentukan oleh akumulasi alel poligenik yang diwarisi dari garis keturunan indukan.'
      },
      {
        id: 'lanjutan-q7',
        question: 'Seorang breeder mendapati bahwa salah satu mutasi baru di fasilitasnya konsisten menimbulkan tumor ganas pada usia muda (seperti kasus Lemon Frost). Apa tindakan paling etis yang harus diambil?',
        options: [
          'Menjual seluruh stok anakan secepat mungkin sebelum gejalanya tampak',
          'Menghentikan program pairing mutasi tersebut dan transparan mengedukasi komunitas tentang risiko letalitasnya',
          'Mengawinkannya dengan sesama mutasi tersebut agar tumornya hilang',
          'Menyembunyikan informasi silsilah dan menjualnya dengan nama samaran'
        ],
        correctIndex: 1,
        explanation: 'Etika pemuliaan menuntut tanggung jawab moral penuh. Memproduksi dan memasarkan satwa yang diketahui pasti akan menderita tumor ganas atau kematian dini adalah pelanggaran etika berat dalam dunia hobi reptil.'
      },
      {
        id: 'lanjutan-q8',
        question: 'Dalam sistem seleksi Backcross (mengawinkan anakan F1 kembali ke salah satu induk asli), apa risiko utama yang harus diantisipasi?',
        options: [
          'Peningkatan koefisien inbreeding yang tajam jika dilakukan berturut-turut tanpa seleksi kesehatan yang ketat',
          'Hilangnya seluruh mutasi resesif yang dibawa induk',
          'Anakan tidak akan mau memakan serangga hidup',
          'Perubahan jenis kelamin anakan menjadi hermaprodit'
        ],
        correctIndex: 0,
        explanation: 'Backcross meningkatkan homozigositas secara cepat untuk mengunci karakter unggul induk, namun sekaligus melipatgandakan risiko inbreeding depression jika tidak diimbangi seleksi vitalitas yang cermat.'
      },
      {
        id: 'lanjutan-q9',
        question: 'Apa fungsi utama pencatatan nomor identitas clutch, data penetasan, dan pedigree digital dalam manajemen fasilitas breeding?',
        options: [
          'Sekadar formalitas administrasi tanpa manfaat teknis',
          'Menjamin ketertelusuran genetik (traceability), mencegah inbreeding yang tidak disengaja, dan memberikan bukti autentik kepada pembeli',
          'Mengurangi biaya konsumsi pakan serangga mingguan',
          'Mencegah gecko bertelur di luar musim kawin'
        ],
        correctIndex: 1,
        explanation: 'Silsilah digital yang rapi mencegah perkawinan sedarah yang tidak terencana di generasi berikutnya, memudahkan evaluasi performa indukan, dan menjamin kredibilitas profesional fasilitas.'
      },
      {
        id: 'lanjutan-q10',
        question: 'Apa prinsip tertinggi yang membedakan seorang breeder profesional sejati dari sekadar perbanyakan komersial (mass multiplier)?',
        options: [
          'Jumlah kandang yang dimiliki mencapai ribuan unit',
          'Komitmen mengutamakan kesehatan dan kesejahteraan satwa, integritas silsilah, serta kontribusi positif bagi kelestarian komunitas reptil',
          'Kemampuan menjual anakan dengan harga paling murah di pasaran',
          'Memiliki pengikut terbanyak di media sosial'
        ],
        correctIndex: 1,
        explanation: 'Breeder sejati menaruh kesejahteraan satwa, keaslian silsilah genetik, dan tanggung jawab edukasi komunitas di atas orientasi keuntungan finansial semata.'
      }
    ],
    nextTierIntro: {
      targetTierTitle: 'Penutup Kurikulum: Dedikasi Pemuliaan Bertanggung Jawab',
      description: 'Selamat dan apresiasi setinggi-tingginya! Anda telah menuntaskan seluruh jenjang pembelajaran genetika di GeckoFarm Pro, mulai dari Kelas Pemula, Menengah, hingga Lanjutan. Genetika bukan sekadar rumus di atas kertas, melainkan panduan ilmiah untuk memperlakukan satwa dengan bijak, memuliakan keanekaragaman hayati, dan menjaga integritas hobi reptil Indonesia.',
      highlightTopics: [
        'Penerapan Praktik Pemuliaan Berkelanjutan & Terukur',
        'Transparansi Mutlak dalam Pencatatan Silsilah & Sertifikat Digital',
        'Kesejahteraan Satwa sebagai Prioritas Tanpa Kompromi',
        'Membimbing Penghobi Pemula dengan Edukasi Genetik yang Benar'
      ]
    }
  }
];

export async function seedStarterEvaluationsToFirestore(): Promise<{ createdCount: number; skippedCount: number }> {
  const existingSnap = await getDocs(query(collection(db, 'class_evaluations')));
  const existingIds = new Set<string>();

  existingSnap.docs.forEach(d => existingIds.add(d.id));

  const batch = writeBatch(db);
  let createdCount = 0;
  let skippedCount = 0;

  for (const item of STARTER_CLASS_EVALUATIONS) {
    if (existingIds.has(item.id)) {
      skippedCount++;
      continue;
    }

    const evalRef = doc(db, 'class_evaluations', item.id);
    batch.set(evalRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    createdCount++;
  }

  if (createdCount > 0) {
    await batch.commit();
    clearCachedEvaluations();
  }

  return { createdCount, skippedCount };
}
