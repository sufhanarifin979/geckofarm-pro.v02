import { collection, doc, getDocs, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, clearCachedGuides } from '../../lib/firebase';
import { GeneticsGuideFull, GeneticsGuideMeta, GeneticsGuideBody } from '../../types';

export const DEFAULT_GUIDE_CATEGORIES = [
  'Dasar Genetika',
  'Pola Pewarisan',
  'Mengenal Morph',
  'Dasar Pairing',
  'Membaca Hasil Genetik',
  'Genetic Warning',
  'Glosarium',
  'Interpretasi Genetika',
  'Analisis Persilangan',
  'Kombinasi Gen dan Analisis Morph',
  'Evaluasi Indukan dan Perencanaan Breeding',
  'Breeding Fundamentals'
];

export const STARTER_GENETICS_GUIDES: GeneticsGuideFull[] = [
  {
    id: 'guide-01-dasar-genetika',
    slug: 'dasar-genetika-gen-alel-genotipe-fenotipe',
    title: '1. Dasar Genetika: Gen, Alel, Genotipe & Fenotipe',
    subtitle: 'Memahami fondasi DNA, perbedaan tampilan fisik (Fenotipe) dan susunan genetik tersembunyi (Genotipe), serta konsep Homozygous vs Het.',
    category: 'Dasar Genetika',
    species: 'Umum',
    level: 'Pemula',
    order: 1,
    readTimeMinutes: 4,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'encyclopedia',
    ctaLabel: 'Jelajahi Contoh Morph di Ensiklopedia',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengapa Belajar Dasar Genetika Itu Penting?

Sebelum menyilangkan indukan reptil atau menggunakan kalkulator genetik, setiap penghobi dan calon breeder wajib memahami bagaimana sifat fisik diturunkan dari induk ke anakannya.

Bayangkan DNA reptil seperti **buku resep masakan** yang menentukan warna kulit, corak punggung, hingga warna mata. Setiap anakan selalu menerima **setengah resep dari induk Jantan (Sire)** dan **setengah resep dari induk Betina (Dam)**.

---

### 1. Gen dan Alel (Pasangan Sifat)
* **Gen** adalah bagian spesifik pada DNA yang mengatur satu sifat tertentu (misalnya produksi pigmen hitam atau pola garis).
* **Alel (Allele)** adalah variasi dari gen tersebut yang selalu **berpasangan (2 salinan)**: 1 salinan dari bapak (*Sire*) dan 1 salinan dari ibu (*Dam*).

---

### 2. Fenotipe vs Genotipe
Dua ekor gecko bisa terlihat **100% identik dari luar**, tetapi menghasilkan anakan yang sangat berbeda saat dikawinkan! Di sinilah perbedaan antara Fenotipe dan Genotipe:
* **Fenotipe (Tampilan Luar / Visual):** Apa yang bisa Anda lihat langsung dengan mata—warna tubuh, pola bintik, atau warna mata.
* **Genotipe (Isi Genetik Lengkap):** Seluruh kode genetik yang tersimpan di dalam DNA gecko, termasuk sifat **tersembunyi (*Het*)** yang tidak tampak di kulit luarnya.

---

### 3. Homozygous vs Heterozygous (Het)
Karena setiap gen memiliki 2 salinan alel, terdapat 3 kondisi utama:
1. **Wild Type / Normal (Tanpa Mutasi):** Kedua salinan gen adalah normal.
2. **Heterozygous (disingkat "Het"):** Memiliki **1 salinan mutasi** dan **1 salinan normal**. Pada sifat resesif, gecko terlihat normal dari luar tetapi **membawa (carrier)** gen mutasi tersebut untuk diturunkan ke anaknya.
3. **Homozygous (2 Salinan Sama):** Memiliki **2 salinan mutasi penuh** (1 dari Sire + 1 dari Dam), sehingga sifat resesif muncul secara **Visual** pada tubuh gecko.`,
    exampleTitle: 'Contoh Sederhana: "Terlihat Normal, Tapi Membawa Gen"',
    exampleContent: `Bayangkan seekor gecko bernama "Bima" yang tampilan fisiknya tampak Normal (berbintik biasa). Namun, induk Bima dulunya adalah morph resesif visual.
• Fenotipe Bima = Normal (tampilan fisik biasa).
• Genotipe Bima = Normal 100% Het Recessive (membawa 1 salinan gen tersembunyi).
Jika Bima dikawinkan dengan pasangan yang juga membawa gen yang sama, anak-anaknya berpeluang lahir dengan warna mutasi Visual!`,
    warningTitle: 'Kesalahan Umum Pemula',
    warningContent: `Sifat "Het" (Heterozygous pada gen resesif) TIDAK BISA dilihat dengan mata telanjang dari corak kulit atau mata. Status Het hanya bisa diketahui dari catatan silsilah induk (Lineage) yang jujur dan rapi.`,
    summaryPoints: [
      'Setiap gecko mewarisi 2 salinan alel untuk tiap gen: 1 dari induk Jantan (Sire) dan 1 dari induk Betina (Dam).',
      'Fenotipe adalah tampilan visual luar, sedangkan Genotipe adalah isi genetik lengkap termasuk gen tersembunyi.',
      'Homozygous berarti memiliki 2 salinan gen yang sama, sedangkan Heterozygous (Het) berarti membawa 1 salinan gen berbeda.',
      'Pencatatan silsilah induk di Registry sangat penting karena sifat Het tidak terlihat secara fisik.'
    ],
    quiz: [
      {
        id: 'q1-1',
        question: 'Apa sebutan untuk tampilan fisik warna dan corak gecko yang dapat dilihat langsung oleh mata?',
        options: ['Genotipe', 'Fenotipe', 'Heterozygous', 'Lokus'],
        correctIndex: 1,
        explanation: 'Fenotipe merujuk pada sifat fisik/visual luar yang tampak oleh mata, sedangkan Genotipe adalah susunan genetik di dalam DNA.'
      },
      {
        id: 'q1-2',
        question: 'Dari mana seekor anakan gecko mendapatkan pasangan alel (2 salinan gen) di dalam tubuhnya?',
        options: [
          '100% dari induk betina (Dam)',
          '100% dari suhu inkubator',
          '1 salinan dari induk jantan (Sire) dan 1 salinan dari induk betina (Dam)',
          'Muncul secara acak saat menetas'
        ],
        correctIndex: 2,
        explanation: 'Setiap lokus gen terdiri dari sepasang alel: tepat 1 salinan diwariskan oleh Sire dan 1 salinan diwariskan oleh Dam.'
      },
      {
        id: 'q1-3',
        question: 'Jika seekor gecko memiliki 1 salinan gen mutasi resesif dan 1 salinan gen normal, kondisi ini disebut...',
        options: ['Homozygous Visual', 'Heterozygous (Het)', 'Super Form', 'Line-bred'],
        correctIndex: 1,
        explanation: 'Heterozygous (Het) berarti memiliki 1 salinan gen mutasi dan 1 salinan normal, sehingga berperan sebagai pembawa sifat (carrier).'
      }
    ]
  },
  {
    id: 'guide-02-pola-pewarisan',
    slug: 'pola-pewarisan-recessive-incomplete-dominant-line-bred',
    title: '2. Pola Pewarisan: Recessive, Incomplete Dominant, Dominant & Line-Bred',
    subtitle: 'Mengenal 4 cara utama sifat genetik bekerja agar tidak salah memasangkan indukan.',
    category: 'Pola Pewarisan',
    species: 'Umum',
    level: 'Pemula',
    order: 2,
    readTimeMinutes: 5,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Coba Simulasi Pewarisan di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## 4 Pola Pewarisan Utama pada Gecko

Tidak semua morph bekerja dengan aturan yang sama. Sebelum membeli indukan atau menyusun proyek ternak, pahami 4 kategori pewarisan berikut:

---

### 1. Recessive (Resesif)
Gen **Recessive** bersifat "pemalu"—ia **harus memiliki 2 salinan penuh (Homozygous)** agar wujud visualnya keluar.
* **1 salinan (Het):** Tampilan luar tetap tampak Normal, namun membawa gen (*100% Het*).
* **2 salinan (Visual):** Tampilan mutasi muncul penuh secara visual.
* **Syarat keluar anakan Visual:** Kedua induk (**Sire DAN Dam**) wajib minimal membawa gen resesif yang sama (baik Visual maupun Het).

---

### 2. Incomplete Dominant ( sering disebut Co-Dominant )
Gen **Incomplete Dominant** langsung terlihat meskipun hanya membawa **1 salinan**, dan memiliki wujud yang jauh lebih ekstrem saat memiliki **2 salinan (Super Form)**.
* **1 salinan (Heterozygous):** Sudah tampil **Visual** berbeda dari Normal.
* **2 salinan (Homozygous):** Menghasilkan wujud tingkat lanjut yang disebut **Super Form**.
* *Catatan:* Di kalangan penghobi reptil, istilah *Co-Dominant* dan *Incomplete Dominant* sering dipakai bergantian untuk merujuk pola ini.

---

### 3. Dominant (Dominan Murni)
Cukup **1 salinan saja** dari salah satu induk (Sire saja ATAU Dam saja), sifat tersebut **langsung tampil Visual** pada sebagian anakannya.
* Berbeda dengan Incomplete Dominant, gen Dominant umumnya tidak memiliki tampilan *Super Form* yang berbeda drastis (atau pada gen tertentu justru berisiko jika digandakan).
* **Tidak ada istilah "Het Dominant":** Jika gecko tidak menampilkan ciri visual gen dominan, berarti ia tidak membawa gen tersebut.

---

### 4. Line-Bred / Polygenic (Seleksi Bertahap)
Sifat **Line-bred** tidak dikendalikan oleh 1 tombol gen tunggal (Mendelian), melainkan oleh **banyak gen kecil (poligenik)** yang menentukan **intensitas warna atau ketegasan corak**.
* Contohnya seperti kepekatan warna oranye atau ketebalan warna gelap.
* Tidak menggunakan istilah *Het*. Kualitas anakan bergantung pada konsistensi seleksi indukan terbaik dari generasi ke generasi.`,
    exampleTitle: 'Tabel Ringkas Perbandingan 4 Pola Pewarisan',
    exampleContent: `• Recessive: 1 salinan = Het (Tak terlihat) | 2 salinan = Visual
• Incomplete Dominant: 1 salinan = Visual | 2 salinan = Super Form
• Dominant: 1 salinan = Visual | Tidak ada istilah "Het"
• Line-Bred: Dikembangkan lewat kawin pilih (seleksi kualitas warna/pola) antar generasi.`,
    warningTitle: 'Waspada Istilah Keliru!',
    warningContent: `Jangan pernah tertipu jika ada penjual menawarkan "Het" untuk gen Dominant atau Line-bred! Istilah "Het" (pembawa sifat tersembunyi) dalam jual-beli hanya berlaku untuk gen RECESSIVE.`,
    summaryPoints: [
      'Gen Recessive membutuhkan 2 salinan (dari kedua induk) untuk tampil Visual; 1 salinan hanya menjadi Het.',
      'Gen Incomplete Dominant tampil Visual pada 1 salinan, dan menjadi Super Form pada 2 salinan.',
      'Gen Dominant langsung tampil Visual hanya dengan 1 salinan dari salah satu induk, tanpa ada bentuk Het tersembunyi.',
      'Sifat Line-bred / Polygenic diwariskan melalui kualitas seleksi bertahap, bukan hitungan persentase Het.'
    ],
    quiz: [
      {
        id: 'q2-1',
        question: 'Pola pewarisan manakah yang memiliki bentuk "Visual" pada 1 salinan gen dan bentuk "Super Form" pada 2 salinan gen?',
        options: ['Recessive', 'Incomplete Dominant (Co-Dominant)', 'Line-bred', 'Wild Type'],
        correctIndex: 1,
        explanation: 'Incomplete Dominant langsung tampak secara visual dengan 1 salinan alel, dan berubah menjadi wujud Super Form saat memiliki 2 salinan (homozygous).'
      },
      {
        id: 'q2-2',
        question: 'Apa yang terjadi jika Anda mengawinkan induk Visual Recessive dengan induk Normal murni (tanpa Het)?',
        options: [
          'Semua anakan langsung keluar Visual',
          '50% anakan menjadi Super Form',
          'Semua anakan tampak Normal secara fisik, tetapi berstatus 100% Het',
          'Gen resesif hilang sepenuhnya'
        ],
        correctIndex: 2,
        explanation: 'Induk Visual selalu mewariskan 1 salinan gen resesif, sedangkan induk Normal mewariskan 1 salinan normal. Hasilnya 100% anakan memiliki 1 salinan (100% Het).'
      },
      {
        id: 'q2-3',
        question: 'Mengapa sifat Line-bred (Polygenic) tidak bisa dihitung dengan persentase Het seperti 100% Het atau 66% Het?',
        options: [
          'Karena sifat Line-bred dipengaruhi oleh banyak gen sekaligus melalui seleksi kualitas indukan',
          'Karena Line-bred hanya diturunkan dari induk jantan',
          'Karena Line-bred bersifat letal',
          'Karena Line-bred hanya muncul di suhu tinggi'
        ],
        correctIndex: 0,
        explanation: 'Sifat poligenik/line-bred merupakan akumulasi banyak faktor genetik untuk mempertajam warna/pola, bukan gen tunggal Mendelian.'
      }
    ]
  },
  {
    id: 'guide-03a-mengenal-morph-lg',
    slug: 'mengenal-morph-dan-kombinasi-leopard-gecko',
    title: '3. Mengenal Morph, Strain Albino & Kombinasi (Leopard Gecko)',
    subtitle: 'Panduan khusus Leopard Gecko: 3 strain Albino, gen dasar populer, hingga cara membaca nama morph Combo.',
    category: 'Mengenal Morph',
    species: 'Leopard Gecko',
    level: 'Pemula',
    order: 3,
    readTimeMinutes: 5,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'encyclopedia',
    ctaLabel: 'Buka Katalog Morph Leopard Gecko',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengenal Kelompok Morph Leopard Gecko

*Materi ini dikhususkan untuk spesies **Leopard Gecko (Eublepharis macularius)**.*

Di dunia Leopard Gecko, ratusan nama morph yang beredar sebenarnya tersusun dari kombinasi **gen tunggal dasar** dan **seleksi warna (line-bred)**.

---

### 1. Tiga Strain Albino Leopard Gecko (Wajib Hafal!)
Pada Leopard Gecko terdapat **3 mutasi Recessive Albino yang berbeda lokus**:
1. **Tremper Albino** *(paling umum & banyak dipakai di berbagai combo)*
2. **Bell Albino** *(terkenal dengan kontras mata merah muda terang dan pola tegas)*
3. **Rainwater Albino (Las Vegas)** *(cenderung memiliki tone warna pastel/pink lembut dan tubuh lebih cerah)*

> **Aturan Emas:** Ketiga strain Albino ini **TIDAK KOMPATIBEL** satu sama lain. Mengawinkan Tremper × Bell akan menghasilkan anakan Normal (*Double Het* yang membingungkan garis keturunan) dan sangat dilarang dalam etika breeding!

---

### 2. Gen Dasar Populer pada Leopard Gecko
* **Recessive:** *Tremper Albino*, *Bell Albino*, *Rainwater Albino*, *Eclipse* (mata hitam solid / snake eyes & ujung hidung-kaki putih), *Blizzard* (tanpa corak sejak lahir), *Murphy Patternless*.
* **Incomplete Dominant:** *Mack Snow* (1 salinan mengurangi warna kuning bayi menjadi putih-hitam; 2 salinan menghasilkan **Super Snow** bermata hitam solid dengan pola garis bintik khas).
* **Dominant:** *TUG Snow*, *White & Yellow (W&Y)*.
* **Line-Bred / Polygenic:** *Tangerine* (oranye pekat), *SHTCT* (Super Hypo Tangerine Carrot Tail), *Black Night* (melanistik hitam pekat), *Blood*, *Bold Stripe*, *Red Stripe*.

---

### 3. Cara Membaca Nama "Combo Morph"
Banyak nama keren sebenarnya adalah singkatan dari gabungan beberapa gen sekaligus! Contohnya:
* **RAPTOR** = **Tremper Albino** + **Eclipse** (+ Patternless Stripe).
* **RADAR** = **Bell Albino** + **Eclipse**.
* **Typhoon** = **Rainwater Albino** + **Eclipse**.
* **Diablo Blanco** = **Tremper Albino** + **Blizzard** + **Eclipse**.`,
    exampleTitle: 'Membedah Nama Morph di Pasaran (Leopard Gecko)',
    exampleContent: `Misalkan Anda membaca label gecko: "Mack Snow Tremper Het Eclipse"
Artinya pada Leopard Gecko tersebut:
1. Mack Snow = 1 salinan Incomplete Dominant (tampil visual lebih cerah).
2. Tremper = 2 salinan Recessive Tremper Albino (tampil visual albino).
3. Het Eclipse = Membawa 1 salinan tersembunyi gen Eclipse (matanya belum Eclipse penuh, tapi bisa menurunkan gen Eclipse ke anaknya).`,
    warningTitle: 'Jangan Samakan dengan Spesies Lain',
    warningContent: `Gen seperti Mack Snow, Eclipse, Blizzard, Tremper, Bell, dan Rainwater adalah gen spesifik Leopard Gecko dan TIDAK berlaku untuk African Fat-Tailed Gecko (AFT).`,
    summaryPoints: [
      'Leopard Gecko memiliki 3 strain Albino resesif berbeda: Tremper, Bell, dan Rainwater yang pantang disilangkan satu sama lain.',
      'Mack Snow adalah gen Incomplete Dominant pada LG yang menghasilkan Super Snow saat berstatus 2 salinan (Homozygous).',
      'Nama morph seperti RAPTOR, RADAR, dan Diablo Blanco adalah kombinasi dari beberapa gen resesif dasar.',
      'Tangerine dan Black Night merupakan sifat Line-bred yang kualitas warnanya dijaga lewat seleksi indukan.'
    ],
    quiz: [
      {
        id: 'q3a-1',
        question: 'Manakah di bawah ini yang merupakan tiga strain Albino pada Leopard Gecko?',
        options: [
          'Oreo, Zulu, dan Caramel',
          'Tremper, Bell, dan Rainwater',
          'Mack Snow, Eclipse, dan Blizzard',
          'RAPTOR, RADAR, dan Diablo Blanco'
        ],
        correctIndex: 1,
        explanation: 'Tiga strain Albino resesif pada Leopard Gecko adalah Tremper, Bell, dan Rainwater.'
      },
      {
        id: 'q3a-2',
        question: 'Kombinasi gen apakah yang membentuk morph "Diablo Blanco" pada Leopard Gecko?',
        options: [
          'Bell Albino + Mack Snow',
          'Tremper Albino + Blizzard + Eclipse',
          'Rainwater Albino + Murphy Patternless',
          'Tangerine + White & Yellow'
        ],
        correctIndex: 1,
        explanation: 'Diablo Blanco adalah kombinasi 3 gen resesif sekaligus: Tremper Albino, Blizzard, dan Eclipse.'
      }
    ]
  },
  {
    id: 'guide-03b-mengenal-morph-aft',
    slug: 'mengenal-morph-dan-kombinasi-aft',
    title: '3. Mengenal Morph & Karakter Genetik (African Fat-Tailed Gecko)',
    subtitle: 'Panduan khusus AFT: Mengenal Oreo, Amel, Whiteout, Zulu, Zero, Ghost, dan perbedaannya dari Leopard Gecko.',
    category: 'Mengenal Morph',
    species: 'African Fat-Tailed Gecko',
    level: 'Pemula',
    order: 3,
    readTimeMinutes: 5,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'encyclopedia',
    ctaLabel: 'Buka Katalog Morph AFT di Ensiklopedia',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengenal Kelompok Morph African Fat-Tailed Gecko (AFT)

*Materi ini dikhususkan untuk spesies **African Fat-Tailed Gecko (Hemitheconyx caudicinctus)**.*

Meskipun sekilas berkerabat dekat dengan Leopard Gecko, **African Fat-Tailed Gecko (AFT)** memiliki perpustakaan mutasi genetik yang **sama sekali berbeda**! AFT terkenal dengan kontras warna coklat tua, putih bersih, krem, karamel, hingga oranye terang.

---

### 1. Gen Recessive Utama pada AFT
Sebagian besar morph populer pada AFT bersifat **Recessive** (membutuhkan 2 salinan untuk tampil visual):
* **Oreo:** Menghilangkan pigmen kuning/oranye (anerythristic), menghasilkan kontras hitam-abu-putih yang sangat tajam bak biskuit Oreo.
* **Amelanistic (Amel):** Bentuk albino pada AFT yang mengubah warna gelap coklat/hitam menjadi oranye terang, kuning, dan krem lembut.
* **Caramel:** Mengubah pigmen gelap menjadi nuansa coklat karamel keemasan.
* **Ghost:** Mengurangi kontras gelap sehingga menghasilkan warna pucat/pastel berkabut (*hypomelanistic/ghostly*).
* **Zulu:** Mengubah pola belang punggung menjadi motif anak panah / tombak (*spearhead*) yang sangat ikonik.
* **Zero & Stinger:** Mutasi pola punggung unik yang memodifikasi garis dan belang AFT.
* **Patternless:** Menghapus belang tubuh sehingga berwarna polos bersih.

---

### 2. Gen Incomplete Dominant & Dominant pada AFT
* **Whiteout (Incomplete Dominant):** Salah satu gen paling populer di AFT! Cukup **1 salinan** sudah memunculkan area putih bersih kontras tinggi di punggung dan sisi tubuh. *(Penting: Jangan pernah mengawinkan sesama Whiteout karena bentuk 2 salinan / Super Whiteout bersifat letal!)*
* **Stripe (Incomplete Dominant / Dorsal Stripe):** Garis putih tegas membelah punggung dari leher hingga ekor.
* **Banded:** Pola belang klasik khas AFT.

---

### 3. Contoh Combo Populer AFT
Ketika gen *Whiteout* digabungkan dengan gen resesif AFT, lahirlah combo kelas atas:
* **Whiteout Oreo** (*Whiteout* + *Homozygous Oreo*): Kontras putih salju dan hitam pekat tanpa warna coklat/kuning.
* **Whiteout Zulu** (*Whiteout* + *Homozygous Zulu*): Perpaduan warna putih bersih dengan motif geometris Zulu.
* **Whiteout Amel**: Perpaduan putih terang dengan pita warna oranye pastel.`,
    exampleTitle: 'Membedah Label Genetik AFT',
    exampleContent: `Misalkan Anda melihat AFT berlabel: "Whiteout 100% Double Het Oreo Zulu (Stripe)"
Artinya pada AFT tersebut:
1. Whiteout = Tampil visual karena cukup 1 salinan Incomplete Dominant.
2. Double Het Oreo Zulu = Membawa 1 salinan gen Oreo DAN 1 salinan gen Zulu secara tersembunyi.
3. Stripe = Memiliki garis punggung putih memanjang.`,
    warningTitle: 'Perbedaan Mutlak AFT vs Leopard Gecko',
    warningContent: `AFT TIDAK mengenal gen Mack Snow, Tremper, Bell, atau Eclipse. Sebaliknya, gen Oreo, Whiteout, dan Zulu adalah mutasi khas AFT. Pastikan Anda memilih tab "Fat-Tailed (AFT)" saat menggunakan Morph Calculator!`,
    summaryPoints: [
      'AFT memiliki sistem morph tersendiri yang terpisah total dari Leopard Gecko.',
      'Gen Recessive utama AFT meliputi Oreo, Amelanistic (Amel), Caramel, Ghost, Zulu, Zero, Stinger, dan Patternless.',
      'Whiteout adalah gen Incomplete Dominant andalan di AFT yang cukup 1 salinan untuk tampil visual.',
      'Combo populer AFT umumnya memadukan 1 salinan Whiteout dengan 1 atau lebih gen Recessive (seperti Whiteout Oreo).'
    ],
    quiz: [
      {
        id: 'q3b-1',
        question: 'Gen apakah pada AFT yang bersifat Recessive dan menghilangkan pigmen kuning/oranye sehingga menghasilkan kontras hitam-putih?',
        options: ['Amelanistic', 'Oreo', 'Mack Snow', 'Tremper'],
        correctIndex: 1,
        explanation: 'Oreo adalah mutasi resesif khas AFT yang menghasilkan warna monokrom hitam, abu-abu, dan putih tajam.'
      },
      {
        id: 'q3b-2',
        question: 'Bagaimana pola pewarisan gen "Whiteout" pada African Fat-Tailed Gecko?',
        options: [
          'Recessive (harus 2 salinan baru terlihat)',
          'Incomplete Dominant (1 salinan langsung tampil visual, 2 salinan bersifat letal)',
          'Hanya diturunkan oleh induk betina',
          'Dipengaruhi suhu inkubasi'
        ],
        correctIndex: 1,
        explanation: 'Whiteout langsung tampil visual dengan 1 salinan gen, namun bentuk homozygous (2 salinan) bersifat letal sehingga pantang mengawinkan Whiteout × Whiteout.'
      }
    ]
  },
  {
    id: 'guide-04-dasar-pairing',
    slug: 'dasar-pairing-pewarisan-induk-ke-anakan',
    title: '4. Dasar Pairing: Cara Sifat Genetik Diwariskan ke Keturunan',
    subtitle: 'Memahami rumus praktis persilangan induk (Visual × Normal, Visual × Het, dan Het × Het) tanpa pusing.',
    category: 'Dasar Pairing',
    species: 'Umum',
    level: 'Pemula',
    order: 4,
    readTimeMinutes: 5,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Praktikkan Rumus Pairing di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Rumus Emas Dasar Pairing

Setiap kali induk Jantan (**Sire**) dan induk Betina (**Dam**) kawin, masing-masing induk akan menyumbangkan **1 salinan alel secara acak** kepada setiap butir telur.

Untuk memudahkan pemula, mari pelajari **4 skenario pairing gen Recessive** yang paling sering dilakukan breeder:

---

### Skenario 1: Visual × Visual
* **Sire:** Visual (2 salinan mutasi)
* **Dam:** Visual (2 salinan mutasi)
* **Hasil Anakan:** **100% Visual!** Karena kedua induk hanya memiliki alel mutasi untuk diberikan. *(Tips: Sesekali lakukan outcross dengan Het berkualitas agar keragaman darah tetap sehat).*

---

### Skenario 2: Visual × Normal (Non-Het)
* **Sire:** Visual (2 salinan mutasi)
* **Dam:** Normal murni (0 salinan mutasi)
* **Hasil Anakan:** **100% tampak Normal secara fisik, berstatus 100% Het.**
* *Mengapa?* Karena Sire pasti memberi 1 alel mutasi, dan Dam pasti memberi 1 alel normal. Semua anakan pasti membawa 1 salinan gen mutasi!

---

### Skenario 3: Visual × 100% Het *(Favorit Breeder!)*
* **Sire:** Visual (2 salinan mutasi)
* **Dam:** 100% Het (1 salinan mutasi + 1 salinan normal)
* **Hasil Anakan:**
  * **50% Visual** (mendapat salinan mutasi dari Sire & Dam)
  * **50% tampak Normal berstatus 100% Het** (mendapat mutasi dari Sire & normal dari Dam)
* *Keunggulan:* Tidak ada anakan "Possible Het" yang meragukan—semua anakan yang tidak visual sudah pasti **100% Het**!

---

### Skenario 4: 100% Het × 100% Het
* **Sire:** 100% Het
* **Dam:** 100% Het
* **Hasil Statistik Anakan:**
  * **25% Visual** (mendapat mutasi dari kedua induk)
  * **50% Het** (mendapat 1 mutasi + 1 normal)
  * **25% Normal Murni** (mendapat normal dari kedua induk)
* *Penting:* Karena 50% Het dan 25% Normal tampak sama persis secara fisik (total 75% anakan berfisik normal, di mana 2 dari 3 di antaranya sebenarnya Het), maka anakan berfisik normal dari pairing ini disebut **66% Possible Het (Poss Het)**!`,
    exampleTitle: 'Bagaimana dengan Gen Dominant / Incomplete Dominant (1 Salinan)?',
    exampleContent: `Jika Anda memasangkan induk ber-gen 1 salinan Visual (seperti Dominant atau Incomplete Dominant tunggal) dengan induk Normal:
• Hasilnya: 50% anakan tampil Visual, dan 50% anakan Normal murni (tanpa Het).
Sangat praktis untuk menggabungkan gen visual di generasi pertama!`,
    warningTitle: 'Hindari Inbreeding Berlebihan',
    warningContent: `Meskipun mengawinkan saudara kandung (sibling) atau anak ke induk (backcross) sering dipakai untuk mengejar gen resesif, jangan lakukan terus-menerus terlalu rapat tanpa memasukkan darah segar (Outcross) karena dapat menurunkan daya tahan tubuh dan kesuburan anakan.`,
    summaryPoints: [
      'Visual × Normal menghasilkan 100% anakan berstatus 100% Het.',
      'Visual × 100% Het menghasilkan peluang 50% Visual dan 50% pasti 100% Het (sangat efisien dan bersih).',
      '100% Het × 100% Het menghasilkan peluang 25% Visual, sementara anakan berfisik normalnya berstatus 66% Possible Het.',
      '1 salinan Dominant/Incomplete Dominant × Normal menghasilkan peluang 50% Visual.'
    ],
    quiz: [
      {
        id: 'q4-1',
        question: 'Berapa peluang munculnya anakan Visual jika Anda menyilangkan induk Visual Recessive × induk 100% Het (pada gen yang sama)?',
        options: ['100% Visual', '50% Visual dan 50% berstatus 100% Het', '25% Visual', '0% Visual'],
        correctIndex: 1,
        explanation: 'Visual selalu menyumbang gen mutasi, sedangkan 100% Het punya peluang 50:50 menyumbang gen mutasi atau normal. Hasilnya 50% Visual dan 50% sisanya pasti 100% Het.'
      },
      {
        id: 'q4-2',
        question: 'Dari mana asal-usul istilah "66% Possible Het"?',
        options: [
          'Dari anakan berfisik normal hasil kawin 100% Het × 100% Het (2 dari 3 kemungkinan normal adalah Het)',
          'Dari suhu inkubator 66 derajat',
          'Dari hasil kawin Visual × Normal',
          'Dari anakan yang coraknya 66% belang'
        ],
        correctIndex: 0,
        explanation: 'Pada Het × Het, 25% keluar Visual. Dari 75% anakan yang tampak normal (50% Het + 25% Normal murni), peluang seekor anakan benar-benar membawa gen Het adalah 50/75 = 66,6% (ditulis 66% Poss Het).'
      }
    ]
  },
  {
    id: 'guide-05-membaca-hasil-genetik',
    slug: 'membaca-hasil-prediksi-probabilitas-genetik',
    title: '3. Membaca Hasil Genetik: Probabilitas, Persentase & Prove Out',
    subtitle: 'Memahami arti probabilitas statistik per telur, independent events, tingkat kepastian 100% Het vs Poss Het, prosedur Prove Out, dan kalkulasi multi-gene.',
    category: 'Membaca Hasil Genetik',
    species: 'Umum',
    level: 'Menengah',
    order: 8,
    readTimeMinutes: 7,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'breeder_ai',
    ctaLabel: 'Evaluasi Peluang Proyek dengan Breeder AI Analysis',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengapa Prediksi Kalkulator Bukan Jaminan Pasti?

Saat Anda menggunakan **Morph Calculator**, Anda akan melihat angka probabilitas seperti **50%**, **25%**, **12.5%**, atau **6.25%**. Banyak pemula mengira jika hasilnya **25%**, maka dari **4 butir telur pasti menetas 1 ekor** yang sesuai target morph. **Pemahaman tersebut keliru!**

Dalam genetika reptil, angka yang dihasilkan kalkulator adalah **peluang statistik teoritis (probabilitas independen)** yang berlaku untuk setiap butir telur secara terpisah.

---

### 1. Hukum Kejadian Independen (Independent Events)

Setiap butir telur yang dibuahi merupakan **kejadian acak yang berdiri sendiri (*Independent Event*)**, serupa dengan analogi lemparan koin:
* Sebuah koin memiliki peluang **50% Angka** dan **50% Gambar**.
* Jika Anda melempar koin 4 kali berturut-turut, Anda bisa saja mendapatkan Gambar 4 kali berturut-turut, atau justru Angka 3 kali. Lemparan pertama tidak memengaruhi hasil lemparan kedua.
* Begitu pula pada telur gecko:
  * **Peluang 25% berlaku untuk setiap butir telur secara individual.**
  * **Hasil telur sebelumnya tidak mengubah peluang telur berikutnya.** Telur yang menetas normal tidak meningkatkan atau menurunkan peluang telur berikutnya untuk menjadi visual.
  * **Rasio aktual dalam satu clutch dapat berbeda dari prediksi teori.** Dari 4 butir telur, bisa saja menetas 0 visual, 1 visual, atau bahkan seluruhnya visual.
  * **Hukum Bilangan Besar (*Law of Large Numbers*):** Semakin besar jumlah sampel telur yang dihasilkan sepanjang musim breeding, hasil kumulatif nyata cenderung mendekati probabilitas teoritis, tetapi tidak dijamin selalu tepat sama.

Oleh karena itu, seorang breeder harus membedakan antara:
* **Expected Ratio:** Rasio peluang teoritis berdasarkan hukum Mendel.
* **Actual Outcome:** Hasil anakan riil yang benar-benar menetas dari inkubator.

---

### 2. Memahami Tingkat Kepastian Status Het

Dalam pencatatan data genetik, status *Heterozygous (Het)* memiliki tiga tingkatan kepastian yang sangat berbeda:

#### A. 100% Het (Confirmed Carrier)
* **Status:** Carrier terkonfirmasi mutlak.
* **Genotipe:** Individu membawa tepat **satu salinan alel mutasi resesif** pada lokus yang dimaksud.
* **Contoh:** Persilangan antara induk **Visual resesif (aa)** dengan **Normal non-carrier (AA)** menghasilkan seluruh anakan heterozygous (**Aa** / 100% Het). Kepastian ini diperoleh karena induk visual wajib menyumbangkan satu alel resesif kepada seluruh keturunannya.

#### B. 66% Possible Het (66% Poss Het)
* **Status:** Peluang probabilistik sebesar **sekitar 66,7%** bahwa individu tersebut membawa gen resesif.
* **Contoh:** Anakan yang lahir berpenampilan **Non-Visual** dari persilangan dua ekor induk **100% Het × 100% Het**.
* **Perhitungan:**
  * Hasil teoritis Het × Het adalah: 25% Visual (aa), 50% Het (Aa), dan 25% Normal non-carrier (AA).
  * Pada anakan yang tampak non-visual, kelompok Visual (25%) gugur. Kelompok yang tersisa adalah 50% Het dan 25% Normal (total 75%).
  * Peluang anakan non-visual tersebut merupakan carrier adalah:
    $$\\frac{50\\%}{75\\%} \\times 100\\% = 66,7\\%$$
* **Penting:** Angka 66% adalah tingkat probabilitas carrier, bukan berarti gecko memiliki 66% gen di tubuhnya!

#### C. 50% Possible Het (50% Poss Het)
* **Status:** Individu memiliki peluang **50% (1 banding 2)** menjadi carrier.
* **Contoh:** Anakan yang lahir berpenampilan non-visual dari persilangan **100% Het × Normal non-carrier**.
* **Perhitungan:**
  * Hasil persilangan adalah 50% Het (Aa) dan 50% Normal non-carrier (AA).
  * Karena kedua kelompok tidak dapat dibedakan secara fisik, setiap anakan memiliki peluang 50% membawa gen mutasi.
* **Penting:** Status ini murni berupa kemungkinan probabilistik, bukan kepastian.

> **Aturan Utama:** Jangan pernah menyamakan atau mencatat *Possible Het* sebagai *Confirmed 100% Het* sebelum dilakukan pembuktian (*Prove Out*).

---

### 3. Prosedur dan Analisis "Prove Out"

**Prove Out** adalah metode pengujian biologis melalui perkawinan terencana untuk membuktikan apakah seekor gecko berstatus *Possible Het* benar-benar membawa alel resesif yang dimaksud.

#### Prosedur Standar Prove Out:
1. **Pilih gecko** dengan status *Possible Het* (misalnya 66% Poss Het Tremper Albino atau 50% Poss Het Oreo).
2. **Pasangkan** dengan pasangan indukan **Visual** yang memiliki gen resesif yang sama persis (misalnya Visual Tremper Albino untuk LG, atau Visual Oreo untuk AFT).
3. **Inkubasi dan amati** hasil keturunan yang menetas.
4. **Kriteria Pembuktian:**
   * Jika muncul **minimal 1 ekor anakan Visual**, maka individu Possible Het tersebut **resmi terbukti membawa gen resesif (Proven 100% Het / Confirmed Carrier)**!

#### Peringatan Krusial dalam Prove Out:
* **Jika belum muncul anakan visual, status carrier belum otomatis gugur.** Pada persilangan Het × Visual, peluang visual per telur adalah 50%. Jika hanya menetas 2–4 butir telur dan semuanya normal, secara statistik hal tersebut masih wajar terjadi karena keterbatasan jumlah sampel clutch.
* **Kesesuaian Identifikasi Gen:** Prove Out harus dilakukan dengan pasangan dan strain gen yang identik. Misalnya, jangan mengawinkan Poss Het Tremper Albino dengan Bell Albino karena keduanya adalah lokus berbeda dan tidak akan pernah menghasilkan anakan visual albino!
* **Dokumentasi Lineage:** Hasil pengujian breeding harus dicatat secara transparan di dalam catatan silsilah Registry agar status silsilah anakan berikutnya memiliki dasar yang valid.

---

### 4. Peluang Persilangan Multi-Gene (Double & Triple Het)

Dalam proyek breeding kombinasi multi-morph, breeder sering menyilangkan indukan yang membawa beberapa pasang gen resesif sekaligus:

| Kombinasi Target | Persilangan Induk | Peluang per Butir Telur | Rasio Teoritis |
| :--- | :--- | :---: | :---: |
| **1 Gen Resesif Visual** | Het × Het | **25%** | 1 dari 4 telur |
| **2 Gen Resesif Visual** | Double Het × Double Het | **6,25%** | 1 dari 16 telur |
| **3 Gen Resesif Visual** | Triple Het × Triple Het | **1,5625%** | 1 dari 64 telur |

#### Asumsi Ilmiah di Balik Perhitungan Multi-Gene:
Perhitungan persentase di atas berlaku mutlak dengan asumsi-asumsi genetik berikut:
1. **Identitas Genetik Induk:** Kedua induk membawa gen resesif yang sama pada setiap lokus yang dihitung.
2. **Independensi Lokus:** Setiap lokus memiliki peluang 25% menghasilkan homozigot resesif ($aa$).
3. **Pewarisan Bebas (*Independent Assortment*):** Pewarisan antar-lokus dianggap independen dan tidak terdapat keterpautan gen (*linkage*) yang relevan. Perhitungan peluang gabungan merupakan hasil kali peluang masing-masing lokus:
   $$\\text{Double Recessive} = 25\\% \\times 25\\% = 6,25\\%$$
   $$\\text{Triple Recessive} = 25\\% \\times 25\\% \\times 25\\% = 1,5625\\%$$

> **Catatan Breeder:** Semakin banyak kombinasi gen resesif yang dikejar secara bersamaan, semakin kecil peluang memperoleh seluruh kombinasi target pada satu anakan. Jangan berasumsi bahwa semua kombinasi multi-gene selalu mengikuti angka ini tanpa memperhatikan pola pewarisan unik dari masing-masing gen (misalnya gen kodominan atau poligenik).`,
    exampleTitle: 'Studi Kasus: Menghitung Realitas Proyek Multi-Gene',
    exampleContent: `Seorang breeder menyilangkan sepasang indukan Leopard Gecko:
• Sire: Normal Double Het Tremper Albino & Eclipse
• Dam: Normal Double Het Tremper Albino & Eclipse

Target: Menghasilkan kombinasi Visual "RAPTOR" (Tremper Albino + Eclipse).

Peluang per butir telur:
• Peluang Tremper Albino Visual = 25%
• Peluang Eclipse Visual = 25%
• Peluang keduanya muncul bersamaan (RAPTOR) = 25% × 25% = 6,25% (1 dari 16 telur).

Artinya, dalam 1 clutch (2 telur), peluang menghasilkan RAPTOR sangat kecil (bukan berarti tidak mungkin). Breeder membutuhkan kesabaran dan jumlah telur kumulatif yang cukup untuk merealisasikan proyek target secara realistis.`,
    warningTitle: 'Kejujuran dan Tanggung Jawab dalam Penulisan Label',
    warningContent: `Possible Het TIDAK BOLEH dicatat, dipasarkan, atau dijual sebagai confirmed 100% Het sebelum terbukti lewat hasil perkawinan (Prove Out).

Kejujuran silsilah adalah fondasi integritas seorang breeder:
1. 100% Het adalah status carrier yang terkonfirmasi secara silsilah valid.
2. 66% dan 50% Possible Het merupakan tingkat probabilitas matematis.
3. Dokumentasi silsilah (lineage) dan riwayat pairing di Registry harus konsisten dan dapat ditelusuri.
4. Menjual Possible Het dengan label 100% Het demi keuntungan harga adalah pelanggaran etika breeding yang merusak reputasi jangka panjang.`,
    summaryPoints: [
      'Probabilitas kalkulator genetik merupakan peluang statistik per butir telur secara independen, bukan kuota anakan yang dijamin pasti per clutch.',
      '100% Het berarti status carrier terkonfirmasi (misal dari induk Visual × Normal), sedangkan Possible Het (66% atau 50%) menunjukkan tingkat kemungkinan carrier.',
      'Possible Het tidak boleh dicatat atau dijual sebagai confirmed 100% Het sebelum terbukti secara nyata.',
      'Prove Out digunakan untuk menguji status carrier dengan memasangkan gecko ke pasangan Visual sejenis; anakan normal berurutan tidak otomatis menggugurkan status carrier jika jumlah telur masih terbatas.',
      'Perhitungan multi-gene (6,25% pada Double Het dan 1,5625% pada Triple Het) mengasumsikan lokus gen resesif saling bebas dan independen.',
      'Catatan genetik dan silsilah di Registry harus jujur, akurat, dan dapat ditelusuri untuk menjaga reputasi breeder dan kesehatan ekosistem.'
    ],
    quiz: [
      {
        id: 'q5-1',
        question: 'Jika hasil kalkulator menunjukkan peluang 25% untuk morph target pada persilangan Het × Het, apa makna ilmiah dari angka tersebut?',
        options: [
          'Dari 4 butir telur dijamin 100% pasti menetas 1 ekor morph target',
          'Peluang 25% berlaku untuk setiap butir telur secara individual sebagai kejadian independen (independent event)',
          'Tubuh gecko hanya akan mengekspresikan 25% mutasi genetik',
          'Telur pertama selalu normal, dan telur keempat selalu target'
        ],
        correctIndex: 1,
        explanation: 'Setiap butir telur merupakan kejadian acak independen. Peluang 25% berlaku mandiri pada tiap butir telur dan hasil telur sebelumnya tidak memengaruhi peluang telur berikutnya.'
      },
      {
        id: 'q5-2',
        question: 'Dari manakah asal perhitungan angka 66% Possible Het pada anakan berpenampilan normal dari persilangan Het × Het?',
        options: [
          'Berasal dari suhu inkubator 66 derajat',
          'Berasal dari perbandingan 50% Het dibagi 75% total anakan non-visual (50/75 = 66,7%)',
          'Berasal dari 66% gen albino di dalam DNA anakan',
          'Berasal dari kuota minimal 66 butir telur per musim'
        ],
        correctIndex: 1,
        explanation: 'Pada persilangan Het × Het, anakan non-visual terdiri dari 50% Het dan 25% Normal murni (total 75%). Peluang gecko non-visual tersebut merupakan carrier adalah 50/75 atau 66,7%.'
      },
      {
        id: 'q5-3',
        question: 'Apa kesimpulan yang benar jika seekor indukan 66% Poss Het dipasangkan dengan Visual dalam uji Prove Out dan menghasilkan 2 butir telur yang keduanya menetas normal?',
        options: [
          'Indukan tersebut resmi terbukti bukan carrier (status gugur)',
          'Status carrier belum otomatis gugur karena jumlah telur terbatas dapat menyebabkan hasil aktual berbeda dari rasio peluang teoritis 50%',
          'Indukan langsung berubah menjadi 100% Het',
          'Kalkulator genetika dinyatakan rusak'
        ],
        correctIndex: 1,
        explanation: 'Pada persilangan Het × Visual, peluang anakan normal adalah 50% per telur. Dua telur menetas normal adalah hal yang sangat mungkin terjadi secara statistik (peluang 25%), sehingga status carrier belum gugur sampai sampel telur mencukupi.'
      }
    ]
  },
  {
    id: 'guide-06a-genetic-warning-lg',
    slug: 'genetic-warning-risiko-kesehatan-leopard-gecko',
    title: '5. Genetic Warning & Etika Breeding (Leopard Gecko)',
    subtitle: 'Mengenal risiko serius pada Leopard Gecko: Enigma Syndrome, Lemon Frost, White & Yellow, dan kontaminasi Albino.',
    category: 'Genetic Warning',
    species: 'Leopard Gecko',
    level: 'Pemula',
    order: 5,
    readTimeMinutes: 5,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'breeder_ai',
    ctaLabel: 'Cek Keamanan Pairing Anda dengan Breeder AI',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengutamakan Kesehatan Hewan di Atas Warna

*Materi keselamatan ini dikhususkan untuk spesies **Leopard Gecko**.*

Dalam hobi genetika reptil, beberapa mutasi warna ternyata terikat langsung (*pleiotropy*) dengan gangguan saraf atau risiko kesehatan fatal. Breeder yang bertanggung jawab wajib memahami daftar **Genetic Warning** berikut sebelum memasangkan indukan:

---

### 1. Enigma (Enigma Syndrome — Risiko Tinggi)
Gen **Enigma** (Dominant) menciptakan pola bintik melingkar dan warna unik, namun terikat langsung dengan kelainan neurologis **Enigma Syndrome (ES)**:
* **Gejala:** Kepala mendongak menatap bintang (*stargazing*), berjalan berputar-putar (*circling*), kehilangan keseimbangan hingga berguling, dan kesulitan menangkap mangsa sendiri.
* **Catatan penting:** Bahkan indukan Enigma yang tampak mulus tanpa gejala tetap bisa melahirkan anakan dengan gejala ES berat, terutama saat mengalami stres atau ganti kulit.

---

### 2. Lemon Frost (Risiko Tumor Ganas — Pantang Diternakkan!)
Gen **Lemon Frost** menghasilkan warna kuning-putih menyala akibat produksi sel iridophore berlebih.
* Namun mutasi ini terbukti secara ilmiah memicu **tumor kulit ganas (*iridophoroma*)** yang menyebar pada mayoritas besar individunya seiring bertambah usia.
* Mengawinkan sesama Lemon Frost (*Super Lemon Frost*) bersifat letal, dan komunitas global sepakat untuk **menghentikan pembiakan Lemon Frost** demi kesejahteraan satwa.

---

### 3. White & Yellow / W&Y (W&Y Syndrome pada Garis Tertentu)
Pada awal kemunculannya, beberapa garis keturunan **White & Yellow** menunjukkan gejala mirip gangguan keseimbangan ringan.
* Berbeda dengan Enigma, melalui seleksi ketat (*outcrossing* jauh dari darah Enigma), banyak lini W&Y modern saat ini sudah jauh lebih stabil dan sehat.
* **Aturan wajib:** Jangan pernah mengawinkan **W&Y × Enigma**, dan hanya gunakan indukan W&Y dari garis sehat yang bebas gejala neurologis.

---

### 4. Mencampur Strain Albino & Inbreeding Ekstrem
* **Pantang Campur Albino:** Jangan pernah menyilangkan *Tremper*, *Bell*, dan *Rainwater* satu sama lain karena menghasilkan anakan dengan genetik tercemar (*Mystery Het*) yang merusak kejelasan silsilah komunitas.
* **Black Night & Super Snow:** Lini *Black Night* atau *Super Snow* yang di-*inbreed* terlalu ketat tanpa *outcross* rentan mengalami ukuran tubuh kerdil, kelainan moncong/kelopak mata, dan daya tetas rendah.`,
    exampleTitle: 'Checklist Aman Sebelum Memasangkan Leopard Gecko',
    exampleContent: `1. Apakah kedua induk menggunakan strain Albino yang sama (tidak mencampur Tremper/Bell/Rainwater)?
2. Apakah indukan bebas dari gen berisiko berat (Lemon Frost / Enigma)?
3. Apakah garis keturunan tidak mengalami inbreeding saudara kandung berulang tanpa outcross?`,
    warningTitle: 'Prinsip Etika Breeder GFP',
    warningContent: `Kesehatan dan kualitas hidup gecko selalu lebih berharga daripada keunikan warna. Hindari membiakkan individu yang menunjukkan cacat genetik bawaan atau gangguan saraf.`,
    summaryPoints: [
      'Enigma membawa risiko bawaan gangguan saraf keseimbangan (Enigma Syndrome) yang tidak dapat dipisahkan dari gennya.',
      'Lemon Frost berkaitan erat dengan pertumbuhan tumor iridophore ganas dan tidak direkomendasikan untuk dikembangbiakkan.',
      'Pilih indukan White & Yellow (W&Y) hanya dari garis bersih dan jangan pernah digabungkan dengan Enigma.',
      'Dilarang keras menyilangkan 3 strain Albino berbeda (Tremper, Bell, Rainwater).'
    ],
    quiz: [
      {
        id: 'q6a-1',
        question: 'Mengapa mutasi "Lemon Frost" pada Leopard Gecko sangat dihindari dalam pembiakan modern?',
        options: [
          'Karena warnanya memudar saat dewasa',
          'Karena terikat secara genetik dengan risiko tinggi pertumbuhan tumor kulit (iridophoroma)',
          'Karena tidak mau makan jangkrik',
          'Karena hanya menghasilkan anakan jantan'
        ],
        correctIndex: 1,
        explanation: 'Mutasi Lemon Frost menyebabkan proliferasi sel pigmen abnormal yang memicu tumor pada sebagian besar individunya.'
      },
      {
        id: 'q6a-2',
        question: 'Apa alasan utama pelarangan mengawinkan Tremper Albino dengan Bell Albino?',
        options: [
          'Telurnya pasti gagal menetas',
          'Menghasilkan anakan dengan campuran strain albino tersembunyi yang mengacaukan kemurnian silsilah genetik',
          'Anakannya berubah menjadi AFT',
          'Induknya menjadi agresif'
        ],
        correctIndex: 1,
        explanation: 'Ketiga strain albino berada di lokus berbeda; mencampurnya menghasilkan keturunan berstatus het ganda tidak jelas yang merugikan peternak berikutnya.'
      }
    ]
  },
  {
    id: 'guide-06b-genetic-warning-aft',
    slug: 'genetic-warning-lethal-dan-kesuburan-aft',
    title: '5. Genetic Warning, Lethal Gene & Kesuburan (AFT)',
    subtitle: 'Panduan keselamatan khusus AFT: Bahaya mengawinkan Whiteout × Whiteout serta isu kesuburan betina Ghost & Caramel.',
    category: 'Genetic Warning',
    species: 'African Fat-Tailed Gecko',
    level: 'Pemula',
    order: 5,
    readTimeMinutes: 4,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'breeder_ai',
    ctaLabel: 'Analisis Keamanan Pairing AFT di Breeder AI',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Risiko Genetik & Kesuburan Khusus AFT

*Materi keselamatan ini dikhususkan untuk spesies **African Fat-Tailed Gecko (AFT)**.*

AFT dikenal sebagai gecko berkarakter tenang dan bebas dari sindrom saraf seperti *Enigma*, namun AFT memiliki **aturan keselamatan genetik tersendiri** yang wajib dipatuhi setiap breeder:

---

### 1. Pantangan Mutlak: Whiteout × Whiteout (Lethal Super Form!)
Gen **Whiteout** bekerja sebagai Incomplete Dominant: 1 salinan menghasilkan AFT Whiteout yang sehat dan cantik.
* **Bahaya:** Jika Anda mengawinkan **Whiteout × Whiteout**, secara statistik **25% telurnya akan mewarisi 2 salinan Whiteout (Homozygous / Super Whiteout)**.
* Kondisi **Super Whiteout bersifat LETAL**: embrio akan mati di dalam telur sebelum menetas, atau menetas dalam kondisi cacat parah dan gagal bertahan hidup.
* **Solusi Aman:** Selalu pasangkan indukan **Whiteout** dengan pasangan **Non-Whiteout** (misalnya *Whiteout Het Oreo × Visual Oreo*). Anda tetap mendapat peluang **50% anakan Whiteout sehat** dan **0% risiko letal**!

---

### 2. Isu Infertilitas Betina pada Visual Ghost & Caramel
Pada AFT, terdapat fenomena biologis unik pada dua gen resesif tertentu: **Ghost** dan **Caramel**:
* **Jantan Visual Ghost / Caramel:** Umumnya **subur (fertile)** dan dapat membuahi dengan baik.
* **Betina Visual (Homozygous) Ghost / Caramel:** Memiliki tingkat **infertilitas sangat tinggi**—sering gagal berovulasi, menghasilkan telur infertil (*slug*), atau berisiko mengalami komplikasi reproduksi (*egg-binding*).
* **Strategi Standar Breeder AFT:** Gunakan **Jantan Visual Ghost/Caramel** yang dipasangkan dengan **Betina 100% Het Ghost/Caramel**! Betina Het memiliki sistem reproduksi yang jauh lebih kuat dan tetap mampu menghasilkan 50% anakan Visual!

---

### 3. Menjaga Kekuatan Genetik (Outcrossing)
Karena populasi dasar beberapa morph AFT awalnya berasal dari jumlah pendiri (*founder*) yang terbatas, perkawinan sedarah berulang (*inbreeding*) dapat memicu anakan lemah atau ekor bengkok (*kinked tail*). Lakukan penyegaran darah (*outcross* ke indukan Normal/Banded/Stripe sehat) secara berkala.`,
    exampleTitle: 'Contoh Strategi Pairing AFT yang Benar vs Salah',
    exampleContent: `❌ SALAH: Jantan Whiteout Oreo × Betina Whiteout Oreo (25% embrio Super Whiteout bersifat letal!).
✅ BENAR: Jantan Whiteout Oreo × Betina Oreo (Menghasilkan 50% Whiteout Oreo & 50% Oreo dengan 100% aman!).

❌ BERISIKO: Jantan Caramel × Betina Visual Caramel (Betina visual Caramel rawan infertil/gagal bertelur).
✅ BENAR: Jantan Visual Caramel × Betina 100% Het Caramel (50% anakan Visual Caramel dari induk betina yang sehat & produktif).`,
    warningTitle: 'Peringatan Utama AFT',
    warningContent: `Jangan pernah memasangkan sesama individu Whiteout (termasuk combo seperti Whiteout Oreo × Whiteout Zulu), karena keduanya tetap membawa gen Whiteout yang menghasilkan 25% Super Whiteout letal!`,
    summaryPoints: [
      'Pantang mengawinkan Whiteout × Whiteout karena 25% keturunan Homozygous (Super Whiteout) bersifat letal.',
      'Pasangkan Whiteout dengan Non-Whiteout untuk mendapatkan 50% anakan Whiteout secara aman.',
      'Betina Visual Ghost dan Visual Caramel pada AFT rentan mengalami masalah kesuburan (infertilitas).',
      'Untuk proyek Ghost atau Caramel, gunakan Jantan Visual × Betina 100% Het.'
    ],
    quiz: [
      {
        id: 'q6b-1',
        question: 'Mengapa breeder pantang mengawinkan indukan AFT Whiteout dengan sesama Whiteout?',
        options: [
          'Karena anakannya kembali menjadi Normal semua',
          'Karena 25% keturunan Homozygous (Super Whiteout) bersifat letal / gagal bertahan hidup',
          'Karena warnanya berubah menjadi hitam',
          'Karena hanya menghasilkan anakan betina'
        ],
        correctIndex: 1,
        explanation: 'Dua salinan gen Whiteout (Homozygous Whiteout) bersifat letal pada perkembangan embrio AFT.'
      },
      {
        id: 'q6b-2',
        question: 'Apa strategi terbaik dan teraman untuk mencetak anakan AFT Visual Caramel atau Ghost?',
        options: [
          'Mengawinkan Jantan Het × Betina Visual Caramel/Ghost',
          'Mengawinkan Jantan Visual Caramel/Ghost × Betina 100% Het Caramel/Ghost',
          'Mengawinkan Whiteout × Whiteout',
          'Menaikkan suhu inkubator setinggi mungkin'
        ],
        correctIndex: 1,
        explanation: 'Betina Visual Ghost dan Caramel sering mengalami kendala kesuburan, sehingga breeder memasangkan Jantan Visual dengan Betina 100% Het yang sehat dan subur.'
      }
    ]
  },
  {
    id: 'guide-07-glosarium',
    slug: 'glosarium-kamus-istilah-genetika-reptil',
    title: 'Glosarium: Kamus Istilah Genetika & Breeding',
    subtitle: 'Kamus lengkap istilah genetika dan perternakan yang sering ditemui pemula, lengkap dengan pencarian cepat.',
    category: 'Glosarium',
    species: 'Umum',
    level: 'Pemula',
    order: 99,
    readTimeMinutes: 6,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'encyclopedia',
    ctaLabel: 'Lihat Penerapan Istilah di Ensiklopedia Morph',
    hasQuiz: true,
    hasGlossary: true,
    content: `## Kamus Istilah Genetika Reptil (Mudah Dipahami)

Gunakan kolom **Pencarian Istilah** di bawah ini untuk menemukan arti singkatan atau kata asing yang sering Anda temui di label kandang, grup komunitas, maupun kalkulator genetik.`,
    exampleTitle: 'Tips Cepat Membaca Singkatan Populer',
    exampleContent: `• "PH" = Possible Het (kemungkinan membawa gen resesif, misal 66% PH atau 50% PH).
• "DH" = Double Het (membawa 2 gen resesif berbeda sekaligus).
• "TSM / TSF" = Temperature-Sexed Male / Female (prediksi jenis kelamin berdasarkan suhu inkubator).`,
    summaryPoints: [
      'Sire adalah induk jantan, sedangkan Dam adalah induk betina.',
      'Het berarti membawa 1 salinan gen resesif tersembunyi; Poss Het berarti memiliki peluang persentase membawa gen tersebut.',
      'Outcross adalah penyilangan ke garis keturunan tidak sedarah untuk memperkuat kualitas kesehatan genetik.',
      'TSM dan TSF merujuk pada kecenderungan jenis kelamin anakan berdasarkan pengaturan suhu inkubasi telur.'
    ],
    glossaryTerms: [
      {
        term: 'Allele (Alel)',
        definition: 'Variasi bentuk dari suatu gen pada posisi lokus tertentu. Setiap gecko memiliki sepasang alel (1 dari Sire, 1 dari Dam).',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Albino Strain (Tremper / Bell / Rainwater)',
        definition: 'Tiga jenis mutasi albino resesif berbeda pada Leopard Gecko yang tidak boleh disilangkan satu sama lain.',
        species: 'Leopard Gecko',
        category: 'Spesifik LG'
      },
      {
        term: 'Amelanistic (Amel)',
        definition: 'Mutasi resesif pada AFT yang menghilangkan pigmen gelap melanin sehingga tubuh berwarna oranye, kuning, dan krem cerah.',
        species: 'African Fat-Tailed Gecko',
        category: 'Spesifik AFT'
      },
      {
        term: 'Clutch',
        definition: 'Satu kelompok telur yang dikeluarkan induk betina dalam satu periode bertelur (umumnya 1–2 butir telur per clutch pada gecko).',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Combo Morph',
        definition: 'Gecko yang menggabungkan dua atau lebih mutasi gen sekaligus dalam satu individu (contoh: Diablo Blanco pada LG, atau Whiteout Oreo pada AFT).',
        species: 'Umum',
        category: 'Morph'
      },
      {
        term: 'Dam',
        definition: 'Sebutan resmi dalam silsilah breeding untuk Induk Betina (Ibu).',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Double Het (DH)',
        definition: 'Gecko yang membawa 1 salinan tersembunyi untuk DUA gen resesif berbeda sekaligus secara pasti (100%).',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Dominant',
        definition: 'Pola pewarisan di mana cukup 1 salinan gen dari salah satu induk sudah langsung menampilkan sifat visual pada anakan.',
        species: 'Umum',
        category: 'Pewarisan'
      },
      {
        term: 'Fenotipe (Phenotype)',
        definition: 'Penampilan fisik luar gecko (warna, corak, mata) yang dapat diamati langsung dengan mata.',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Genotipe (Genotype)',
        definition: 'Susunan kode genetik lengkap di dalam tubuh gecko, mencakup sifat visual maupun gen Het yang tidak terlihat dari luar.',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Hatchling',
        definition: 'Bayi gecko yang baru saja menetas dari telur.',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Het (Heterozygous)',
        definition: 'Kondisi memiliki 2 alel berbeda (1 mutasi + 1 normal). Pada gen resesif, istilah "Het" berarti pembawa sifat tersembunyi.',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Holdback (Keep)',
        definition: 'Anakan berkualitas terbaik hasil ternak sendiri yang sengaja disimpan (tidak dijual) untuk dijadikan calon indukan masa depan.',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Homozygous',
        definition: 'Kondisi memiliki 2 salinan alel identik dari kedua induk, yang membuat gen resesif muncul secara Visual atau gen Incomplete Dominant menjadi Super Form.',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Incomplete Dominant (Co-Dominant)',
        definition: 'Gen yang tampil visual pada 1 salinan alel, dan memiliki wujud lebih lanjut (Super Form) saat berjumlah 2 salinan.',
        species: 'Umum',
        category: 'Pewarisan'
      },
      {
        term: 'Lethal Gene (Gen Letal)',
        definition: 'Kombinasi genetik yang menyebabkan embrio gagal berkembang atau mati, contohnya Homozygous Super Whiteout pada AFT atau Super Lemon Frost pada LG.',
        species: 'Umum',
        category: 'Kesehatan'
      },
      {
        term: 'Line-Bred (Polygenic)',
        definition: 'Sifat warna atau corak yang diperkuat melalui seleksi perkawinan indukan terbaik dari generasi ke generasi (contoh: Tangerine, Black Night).',
        species: 'Umum',
        category: 'Pewarisan'
      },
      {
        term: 'Normal / Wild Type',
        definition: 'Tampilan alami asli spesies tanpa ekspresi mutasi visual.',
        species: 'Umum',
        category: 'Morph'
      },
      {
        term: 'Outcross',
        definition: 'Mengawinkan gecko dengan pasangan dari garis darah berbeda (tidak berkerabat) untuk memperkuat vitalitas, ukuran tubuh, dan kesuburan.',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Possible Het (Poss Het / PH)',
        definition: 'Peluang statistik (seperti 66% atau 50%) bahwa seekor gecko berfisik normal membawa 1 salinan gen resesif.',
        species: 'Umum',
        category: 'Genetika Dasar'
      },
      {
        term: 'Prove Out',
        definition: 'Proses menguji seekor gecko Possible Het melalui perkawinan untuk membuktikan apakah ia benar-benar membawa gen Het tersebut.',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Recessive (Resesif)',
        definition: 'Gen yang membutuhkan 2 salinan penuh (1 dari Sire dan 1 dari Dam) agar tampil secara visual.',
        species: 'Umum',
        category: 'Pewarisan'
      },
      {
        term: 'Sire',
        definition: 'Sebutan resmi dalam silsilah breeding untuk Induk Jantan (Bapak).',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Super Form',
        definition: 'Wujud visual Homozygous (2 salinan) dari gen Incomplete Dominant, misalnya Super Snow pada Leopard Gecko.',
        species: 'Leopard Gecko',
        category: 'Spesifik LG'
      },
      {
        term: 'TSD (TSM / TSF)',
        definition: 'Temperature-Dependent Sex Determination: Penentuan jenis kelamin embrio berdasarkan suhu inkubasi (TSM = Temperature-Sexed Male, TSF = Temperature-Sexed Female).',
        species: 'Umum',
        category: 'Breeding'
      },
      {
        term: 'Whiteout',
        definition: 'Mutasi Incomplete Dominant khas AFT yang memunculkan pola putih kontras tinggi pada 1 salinan, namun bersifat letal jika 2 salinan.',
        species: 'African Fat-Tailed Gecko',
        category: 'Spesifik AFT'
      }
    ],
    quiz: [
      {
        id: 'q7-1',
        question: 'Apa arti dari istilah "Outcross" dalam dunia breeding reptil?',
        options: [
          'Mengawinkan induk dengan anaknya sendiri',
          'Mengawinkan dua spesies berbeda',
          'Memasukkan pasangan dari garis keturunan berbeda (tidak sedarah) untuk menyegarkan kualitas kesehatan genetik',
          'Menjual seluruh koleksi indukan'
        ],
        correctIndex: 2,
        explanation: 'Outcross dilakukan dengan menyilangkan garis darah baru yang tidak berkerabat guna mencegah kelemahan akibat inbreeding.'
      },
      {
        id: 'q7-2',
        question: 'Dalam pencatatan silsilah (Lineage), istilah "Sire" dan "Dam" secara berurutan berarti...',
        options: [
          'Induk Betina dan Induk Jantan',
          'Induk Jantan (Bapak) dan Induk Betina (Ibu)',
          'Kakek dan Cucu',
          'Anakan Pertama dan Anakan Kedua'
        ],
        correctIndex: 1,
        explanation: 'Sire adalah sebutan internasional untuk induk jantan, sedangkan Dam adalah induk betina.'
      }
    ]
  },
  {
    id: 'guide-08-membaca-genotipe-status-indukan',
    slug: 'membaca-genotipe-dan-status-genetik-indukan',
    title: '1. Membaca Genotipe dan Status Genetik Indukan',
    subtitle: 'Panduan mendalam memahami perbedaan Visual, 100% Het, 66% Poss Het vs 50% Poss Het, verifikasi Lineage, dan etika pencatatan status indukan.',
    category: 'Interpretasi Genetika',
    species: 'Umum',
    level: 'Menengah',
    order: 6,
    readTimeMinutes: 9,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Simulasikan Silsilah di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengapa Membaca Status Genetik Itu Penting?

Memahami nama morph dan mengenali sifat genetik merupakan langkah awal dalam breeding. Namun, seorang breeder juga harus mampu membaca informasi genetik secara lebih mendalam.

Dua gecko bisa memiliki penampilan yang hampir sama, tetapi status genetiknya berbeda. Perbedaan ini sangat penting karena akan memengaruhi **prediksi hasil persilangan**, **pemilihan pasangan**, dan **perencanaan proyek breeding**.

Pada materi ini, kita akan mempelajari cara membaca status genetik indukan, memahami tingkat kepastian informasi genetik, serta membedakan gen yang sudah terkonfirmasi dengan gen yang masih berupa kemungkinan.

---

### Perbedaan Nyata di Balik Tampilan Visual

Bayangkan Anda memiliki dua gecko yang sama-sama terlihat Normal.

* Gecko pertama diketahui membawa satu salinan gen resesif berdasarkan silsilah induknya (*100% Het*).
* Gecko kedua belum memiliki bukti bahwa ia membawa gen tersebut (*Non-carrier* / belum terbukti).

Secara visual keduanya mungkin terlihat sama persis. Namun, ketika digunakan dalam pairing, potensi genetik keturunannya bisa sangat berbeda!

Karena itu, seorang breeder tidak cukup hanya mengetahui nama morph. Mereka juga harus memahami:
* **Gen apa saja** yang dimiliki indukan.
* **Gen mana yang sudah terkonfirmasi**.
* **Gen mana yang masih berupa kemungkinan (Poss Het)**.
* **Dari mana informasi genetik tersebut berasal** (verifikasi lineage).

---

### 1. Memahami Informasi Genetik dalam Data Indukan

Dalam pencatatan breeding, informasi genetik biasanya disampaikan melalui beberapa istilah utama:

#### A. Visual
Status **Visual** menunjukkan bahwa gecko menampilkan karakteristik fisik dari suatu morph. Pada morph resesif, status Visual umumnya menunjukkan bahwa gecko memiliki **dua salinan alel mutasi** pada gen yang bersangkutan.

**Contoh:**
* **Tremper Albino Visual** pada Leopard Gecko.
* **Oreo Visual** pada African Fat-Tailed Gecko (AFT).

> **Catatan Penting:** Tampilan visual harus diidentifikasi dengan benar. Tidak semua gecko yang terlihat mirip otomatis memiliki genotipe yang sama.

#### B. 100% Het (100% Heterozygous)
Istilah **100% Het** menunjukkan bahwa gecko dipastikan membawa **satu salinan gen resesif tertentu**, tetapi tidak menampilkan sifat tersebut secara visual.

Kepastian ini biasanya diperoleh melalui perhitungan pewarisan dari induk yang status genetiknya sudah diketahui secara valid.

**Contoh sederhana:**
* Induk A adalah **Visual** untuk suatu gen resesif.
* Induk B adalah **Normal** dan dipastikan tidak membawa gen tersebut (*non-carrier*).
* Setiap anakan akan menerima 1 salinan alel mutasi dari induk Visual dan 1 alel normal dari induk Normal.
* Dengan demikian, **seluruh anakan berstatus 100% Het** untuk gen tersebut.

#### C. Possible Het (Poss Het)
**Possible Het** berarti seekor gecko memiliki kemungkinan membawa satu salinan gen resesif, tetapi status tersebut belum dapat dipastikan. Angka persentasenya menunjukkan peluang bahwa gecko tersebut benar-benar Het berdasarkan informasi persilangan yang diketahui.

**Contohnya:**
* **66% Poss Het**
* **50% Poss Het**

> **PENTING:** Possible Het **bukan** berarti gecko memiliki 66% atau 50% salinan gen di tubuhnya. Angka tersebut menunjukkan **tingkat kemungkinan (probabilitas)** bahwa gecko tersebut membawa gen resesif yang dimaksud.

---

### 2. Memahami Perbedaan 100% Het, 66% Poss Het, dan 50% Poss Het

Ketiga istilah ini sering membingungkan penghobi pemula. Mari kita gunakan contoh persilangan sederhana pada satu gen resesif:

#### A. 100% Het
* **Persilangan:** Visual × Normal (*non-carrier*)
* **Hasil yang diharapkan:**
  * 100% anakan Het.
  * Tidak ada anakan Visual untuk gen tersebut.
* Semua anakan menerima satu salinan alel mutasi dari induk Visual. Oleh karena itu, status Het seluruh anakan dapat dipastikan 100%.

#### B. 66% Poss Het
* **Persilangan:** Het × Het
* **Kemungkinan hasil genetik:**
  * 25% Visual.
  * 50% Het.
  * 25% Normal (*non-carrier*).
* Jika anakan yang lahir tidak menampilkan sifat Visual, maka kelompok anakan non-visual terdiri dari:
  * 2 bagian Het.
  * 1 bagian Normal.
* Dengan demikian, peluang bahwa seekor anakan non-visual merupakan Het adalah **2 dari 3, atau sekitar 66,7%**. Inilah asal istilah **66% Poss Het**.

> **Catatan:** Angka ini merupakan peluang berdasarkan kelompok anakan non-visual, bukan jaminan bahwa seekor gecko tertentu pasti membawa gen tersebut.

#### C. 50% Poss Het
* **Persilangan:** Het × Normal (*non-carrier*)
* **Kemungkinan hasil:**
  * 50% Het.
  * 50% Normal (*non-carrier*).
* Karena anakan tidak menampilkan sifat Visual, setiap anakan memiliki peluang 50% untuk membawa gen resesif tersebut. Oleh karena itu, anakan yang belum diketahui statusnya dapat dicatat sebagai **50% Poss Het**.

---

### 3. Membaca Status Genetik Berdasarkan Lineage

Lineage atau silsilah merupakan salah satu sumber informasi paling penting untuk menentukan status genetik seekor gecko.

**Contoh:**
Seekor anakan berasal dari:
* **Sire:** Tremper Albino Visual.
* **Dam:** Normal *non-carrier*.

Berdasarkan pola pewarisan resesif, seluruh anakan akan menerima satu salinan gen Tremper Albino dari induk Visual. Jika tidak terdapat faktor genetik lain yang relevan, seluruh anakan dapat dicatat sebagai **100% Het Tremper Albino**.

Namun, jika kedua induk hanya berstatus Het, status setiap anakan yang tidak Visual tidak dapat langsung dipastikan sebagai Het. Perlu diperhitungkan peluang genetiknya.

**Informasi yang perlu diperiksa dalam lineage:**
1. Identitas dan status genetik Sire.
2. Identitas dan status genetik Dam.
3. Gen resesif yang dimiliki masing-masing induk.
4. Riwayat pairing dan hasil keturunan sebelumnya.
5. Bukti atau dasar penetapan status genetik.

Semakin lengkap dan akurat pencatatan lineage di Registry, semakin baik kualitas informasi genetik yang dapat digunakan untuk merencanakan breeding.

---

### 4. Confirmed Het vs Possible Het

Perbedaan ini sangat krusial dalam pencatatan dan transaksi gecko:

* **Confirmed Het:**
  Status Het sudah dapat dipastikan berdasarkan informasi genetik yang valid, misalnya:
  * Hasil persilangan dengan induk Visual yang diketahui.
  * Riwayat keturunan yang membuktikan keberadaan gen resesif (*proven carrier*).
  * Dokumentasi lineage yang dapat diverifikasi secara jujur.

* **Possible Het:**
  Status genetik masih berupa kemungkinan berdasarkan peluang pewarisan (contoh: 66% Poss Het atau 50% Poss Het). Gecko dengan status Possible Het **tidak boleh dicatat atau dipasarkan seolah-olah sudah dipastikan sebagai Het**.

**Mengapa perbedaannya penting?**
Karena status genetik memengaruhi:
* Perencanaan pairing dan efisiensi waktu breeding.
* Perkiraan potensi keturunan yang dihasilkan.
* Nilai dan kejujuran informasi produk kepada pembeli.
* Keakuratan data silsilah di Registry.
* Reputasi dan kepercayaan antar sesama breeder.

---

### 5. Kesalahan Umum dalam Membaca Status Genetik

* **Kesalahan 1: Menganggap 66% Poss Het berarti 66% gen sudah dimiliki.**
  * *Fakta:* Tidak benar. Angka tersebut adalah peluang bahwa gecko membawa gen resesif, bukan jumlah salinan gen. Seekor gecko hanya bisa membawa 1 salinan (Het) atau tidak membawa sama sekali (Normal).
* **Kesalahan 2: Menganggap semua gecko Normal pasti non-carrier.**
  * *Fakta:* Tidak benar. Gecko yang terlihat Normal secara fisik masih sangat mungkin membawa satu salinan gen resesif tersembunyi.
* **Kesalahan 3: Mengubah Possible Het menjadi 100% Het tanpa bukti.**
  * *Fakta:* Tidak benar. Status Possible Het harus tetap dicatat sebagai kemungkinan sampai ada hasil persilangan (*prove out*) yang cukup untuk mengonfirmasinya.
* **Kesalahan 4: Mengandalkan nama morph tanpa memeriksa lineage.**
  * *Fakta:* Nama morph saja tidak selalu menjelaskan seluruh susunan genetik seekor gecko. Riwayat induk dan dokumentasi breeding tetap mutlak diperlukan.`,
    exampleTitle: 'Contoh Penerapan dalam Breeding',
    exampleContent: `Seorang breeder memiliki seekor Leopard Gecko Normal dengan status 66% Poss Het Tremper Albino.

Breeder tersebut ingin menggunakannya untuk menghasilkan keturunan Tremper Albino Visual.

Hal yang harus dipahami:
• Gecko tersebut belum dipastikan membawa gen Tremper Albino.
• Jika benar Het, ia berpotensi mewariskan gen tersebut kepada sebagian anakannya saat dipasangkan dengan pasangan yang tepat.
• Jika ternyata bukan Het, ia tidak akan mewariskan gen Tremper Albino sama sekali.
• Status tersebut harus dipertimbangkan secara matang ketika menyusun rencana pairing.

Dengan memahami informasi ini, breeder dapat membuat keputusan yang lebih realistis dan tidak menganggap prediksi sebagai kepastian.`,
    warningTitle: 'Pesan Penting untuk Breeder',
    warningContent: `Genetika yang baik dimulai dari pencatatan yang jujur. Memahami perbedaan antara gen yang sudah terkonfirmasi dan gen yang masih berupa kemungkinan merupakan bagian penting dari breeding yang bertanggung jawab.

Jangan pernah mencatat atau memasarkan Possible Het sebagai Confirmed Het tanpa bukti atau pembuktian (prove out) yang memadai.`,
    summaryPoints: [
      'Status Visual menunjukkan gecko menampilkan karakteristik morph tertentu, sedangkan status Het dan Possible Het menjelaskan informasi genetik yang tidak selalu terlihat secara fisik.',
      '100% Het berarti status pembawa gen resesif sudah dipastikan, sedangkan Possible Het menunjukkan peluang berdasarkan informasi persilangan.',
      'Angka 66% Poss Het dan 50% Poss Het merupakan probabilitas bahwa seekor gecko membawa gen resesif, bukan persentase jumlah gen yang dimiliki.',
      'Lineage yang akurat membantu breeder membaca dan memverifikasi status genetik indukan.',
      'Jangan mencatat atau memasarkan Possible Het sebagai Confirmed Het tanpa bukti yang memadai.'
    ],
    quiz: [
      {
        id: 'q8-1',
        question: 'Dari persilangan Het Tremper Albino × Het Tremper Albino, mengapa anakan non-visual disebut berstatus 66% Poss Het?',
        options: [
          'Karena gecko tersebut memiliki 66% gen albino di dalam DNA-nya',
          'Karena pada kelompok anakan non-visual, rasionya adalah 2 bagian Het : 1 bagian Normal (peluang 2 dari 3 = 66,7%)',
          'Karena suhu penetasan berada pada 66 derajat',
          'Karena induknya berumur 66 hari'
        ],
        correctIndex: 1,
        explanation: 'Dari persilangan Het × Het, anakan yang lahir non-visual terdiri dari 2 Het dan 1 Normal murni, sehingga probabilitas bahwa gecko non-visual tersebut membawa gen adalah 2/3 (66,7%).'
      },
      {
        id: 'q8-2',
        question: 'Mengapa status "100% Het" pada anakan dari persilangan Visual Albino × Normal (non-carrier) dapat dipastikan?',
        options: [
          'Karena seluruh anakan mutlak menerima 1 salinan alel mutasi dari induk Visual dan 1 salinan alel normal dari induk Normal',
          'Karena anakan langsung berpenampilan warna putih albino',
          'Karena kedua induknya sama-sama visual',
          'Karena bisa dipastikan hanya dengan melihat warna mata'
        ],
        correctIndex: 0,
        explanation: 'Induk visual memiliki sepasang alel mutasi penuh sehingga pasti mewariskan 1 salinan alel mutasi kepada setiap keturunannya.'
      },
      {
        id: 'q8-3',
        question: 'Apa langkah yang benar jika Anda memiliki gecko berstatus 50% Poss Het saat mencatatnya di Registry atau menjualnya?',
        options: [
          'Mengubah statusnya menjadi 100% Het agar terlihat lebih bernilai',
          'Tetap mencatatnya secara jujur sebagai 50% Poss Het sampai ada hasil pembuktian breeding (prove out)',
          'Menghilangkan seluruh keterangan genetiknya',
          'Mengklaimnya sebagai mutasi baru'
        ],
        correctIndex: 1,
        explanation: 'Etika breeding yang bertanggung jawab menuntut pencatatan yang jujur. Possible Het tidak boleh diubah menjadi Confirmed Het tanpa bukti valid.'
      }
    ]
  },
  {
    id: 'guide-09-analisis-persilangan-peluang-anakan',
    slug: 'analisis-persilangan-dan-perhitungan-peluang-anakan',
    title: '2. Analisis Persilangan dan Perhitungan Peluang Anakan',
    subtitle: 'Panduan praktis Punnett Square: menghitung peluang genetik Het × Het, Visual × Het, Visual × Normal, pembuktian 66% Poss Het, dan membedakan expected ratio vs actual outcome.',
    category: 'Analisis Persilangan',
    species: 'Umum',
    level: 'Menengah',
    order: 7,
    readTimeMinutes: 11,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Coba Hitung Pairing di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## Mengapa Breeder Perlu Memahami Peluang Persilangan?

Dalam breeding reptil, mengetahui morph kedua indukan saja belum cukup. Breeder juga perlu memahami bagaimana gen dari masing-masing induk dapat diwariskan kepada keturunannya.

Dua gecko yang terlihat normal belum tentu memiliki potensi genetik yang sama. Salah satunya mungkin merupakan 100% Het, sementara yang lain benar-benar non-carrier untuk gen resesif tertentu.

Dengan memahami peluang persilangan, breeder dapat:
* Memperkirakan morph yang mungkin muncul pada anakan.
* Menghitung kemungkinan anakan menjadi Visual, Het, atau Normal non-carrier.
* Memahami arti persentase hasil kalkulasi secara rasional.
* Menghindari kesalahan dalam menentukan status genetik anakan.
* Merencanakan pairing berdasarkan target breeding yang realistis.

Untuk memahami perhitungan ini, kita akan menggunakan contoh satu gen resesif sederhana.

---

### 1. Memahami Dasar Punnett Square

**Punnett Square** adalah diagram tabel sederhana untuk menggambarkan kemungkinan kombinasi alel dari kedua induk kepada keturunannya.

Dalam contoh berikut, kita menggunakan simbol standar:
* **A** = alel normal (*Wild Type*).
* **a** = alel resesif yang menyebabkan morph tertentu.

Maka susunan genotipe dapat ditulis sebagai:

| Genotipe | Status Genetik | Keterangan |
| :--- | :--- | :--- |
| **AA** | Normal non-carrier | Bebas mutasi, kedua alel normal |
| **Aa** | Heterozygous / 100% Het | Membawa 1 salinan alel mutasi tersembunyi |
| **aa** | Homozygous recessive / Visual | Menampilkan sifat fisik mutasi visual |

Setiap induk mewariskan tepat **satu alel** kepada setiap anak. Kombinasi dari kedua alel tersebut menentukan genotipe anakan.

> *Catatan:* Simbol A dan a hanya digunakan untuk mempermudah penjelasan rumus. Dalam praktiknya, setiap gen memiliki nama dan pola pewarisan masing-masing.

---

### 2. Contoh Persilangan Het × Het

Misalnya, kedua induk merupakan 100% Het untuk gen resesif yang sama:
* **Induk Jantan (Sire):** Aa
* **Induk Betina (Dam):** Aa

Setiap induk dapat mewariskan alel **A** atau **a**.

**Hasil Kombinasi Punnett Square:**

| | Alel Induk Betina: **A** | Alel Induk Betina: **a** |
| :--- | :---: | :---: |
| **Alel Induk Jantan: A** | **AA** (Normal non-carrier) | **Aa** (100% Het) |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **aa** (Visual) |

**Hasil Peluang Genotipe:**
* **25% AA** $\rightarrow$ Normal non-carrier
* **50% Aa** $\rightarrow$ 100% Het
* **25% aa** $\rightarrow$ Visual Homozygous

**Penting:** Rasio peluang **25% : 50% : 25%** merupakan rasio peluang teoritis setiap telur, bukan jaminan bahwa setiap 4 butir telur pasti menghasilkan tepat satu Visual, dua Het, dan satu Normal.

---

### 3. Contoh Persilangan Visual × Het

Sekarang kita pasangkan induk Visual (*aa*) dengan induk 100% Het (*Aa*):
* **Induk Jantan (Sire):** aa
* **Induk Betina (Dam):** Aa

Induk Visual hanya dapat mewariskan alel **a**, sedangkan induk Het dapat mewariskan alel **A** atau **a**.

**Hasil Kombinasi Punnett Square:**

| | Alel Induk Betina: **A** | Alel Induk Betina: **a** |
| :--- | :---: | :---: |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **aa** (Visual) |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **aa** (Visual) |

**Hasil Peluang:**
* **50% aa** $\rightarrow$ Visual
* **50% Aa** $\rightarrow$ 100% Het

Pada persilangan ini, **tidak ada peluang menghasilkan anakan Normal non-carrier** untuk gen tersebut karena induk Visual selalu mewariskan alel resesif *a*.

---

### 4. Contoh Persilangan Visual × Normal Non-Carrier

Selanjutnya, induk Visual (*aa*) dipasangkan dengan induk yang diketahui benar-benar non-carrier untuk gen resesif tersebut (*AA*):
* **Induk Jantan (Sire):** aa
* **Induk Betina (Dam):** AA

**Hasil Kombinasi Punnett Square:**

| | Alel Induk Betina: **A** | Alel Induk Betina: **A** |
| :--- | :---: | :---: |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **Aa** (100% Het) |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **Aa** (100% Het) |

**Hasil Peluang:**
* **100% Aa** $\rightarrow$ 100% Het

Semua anakan dipastikan menjadi **100% Het** untuk gen tersebut. Inilah salah satu contoh persilangan yang dapat menghasilkan anakan dengan status Het yang terkonfirmasi, selama identitas genetik kedua induk memang benar.

> **Perhatian:** Induk yang hanya terlihat normal belum otomatis dapat dianggap sebagai non-carrier. Status non-carrier harus didukung oleh informasi genetik atau riwayat breeding yang dapat dipercaya.

---

### 5. Contoh Persilangan Het × Normal Non-Carrier

Misalnya, induk Het (*Aa*) dipasangkan dengan induk Normal non-carrier (*AA*):
* **Induk Jantan (Sire):** Aa
* **Induk Betina (Dam):** AA

**Hasil Kombinasi Punnett Square:**

| | Alel Induk Betina: **A** | Alel Induk Betina: **A** |
| :--- | :---: | :---: |
| **Alel Induk Jantan: A** | **AA** (Normal non-carrier) | **AA** (Normal non-carrier) |
| **Alel Induk Jantan: a** | **Aa** (100% Het) | **Aa** (100% Het) |

**Hasil Peluang:**
* **50% AA** $\rightarrow$ Normal non-carrier
* **50% Aa** $\rightarrow$ 100% Het

Artinya, setiap anakan memiliki peluang 50% menjadi 100% Het dan 50% menjadi Normal non-carrier. Tidak ada peluang menghasilkan Visual karena tidak mungkin mendapatkan dua alel resesif sekaligus dari kombinasi induk tersebut.

---

### 6. Memahami Peluang 66% Possible Het

Salah satu istilah yang sering ditemui dalam dunia breeding adalah **66% Possible Het**. Istilah ini muncul dari persilangan **Het × Het** ketika anakan yang dihasilkan tidak menunjukkan tampilan Visual.

Dari persilangan Het × Het, peluang awalnya adalah:
* 25% Visual
* 50% Het
* 25% Normal non-carrier

Namun, jika anakan yang diamati tidak Visual, maka kemungkinan yang tersisa hanya:
* 50% Het
* 25% Normal non-carrier
* *(Total peluang kelompok non-visual = 75%)*

Dari kelompok non-visual tersebut, 50% merupakan Het. Perhitungannya:
$$\frac{50}{75} \times 100\% = 66,7\%$$

Karena itu, anakan non-visual dari persilangan Het × Het memiliki peluang sekitar **66,7% membawa gen resesif (66% Poss Het)**.

**Perlu dipahami bahwa:**
* 66% Possible Het **bukan** berarti gecko tersebut memiliki 66% gen di tubuhnya.
* Angka tersebut menunjukkan tingkat kemungkinan bahwa gecko membawa satu salinan alel resesif.
* Statusnya belum terkonfirmasi sebagai Het murni sampai terbukti secara breeding.
* Angka tersebut berlaku berdasarkan asumsi persilangan dan informasi genetik induk yang benar.

---

### 7. Peluang Persilangan Bukan Jaminan Hasil Satu Clutch

Kesalahan yang cukup sering terjadi adalah menganggap persentase hasil kalkulator sebagai jumlah pasti anakan dalam satu clutch.

Misalnya, pairing Het × Het menghasilkan peluang 25% Visual:
* Bukan berarti setiap empat telur pasti menghasilkan satu Visual.
* Bisa saja dari empat anakan tidak ada yang Visual, atau justru semuanya Visual. Keduanya tetap mungkin terjadi, meskipun peluangnya berbeda.
* **Setiap telur merupakan kejadian pewarisan yang independen (*independent event*).** Hasil telur sebelumnya tidak mengubah peluang genetik telur berikutnya.

Karena itu, breeder perlu membedakan:
* **Expected ratio:** Rasio peluang teoritis berdasarkan perhitungan genetik Mendel.
* **Actual outcome:** Hasil anakan riil yang benar-benar menetas dari inkubator.

Semakin banyak anakan yang dihasilkan sepanjang musim, hasil keseluruhan mungkin semakin mendekati rasio teoritis. Namun, hasil aktual per clutch tetap dapat bervariasi.

---

### 8. Kesalahan Umum yang Perlu Dihindari

1. **Menganggap persentase sebagai hasil pasti:** Persentase menunjukkan peluang, bukan jumlah anakan yang dijamin muncul.
2. **Menganggap semua gecko normal sebagai non-carrier:** Untuk gen resesif, gecko Het umumnya tidak dapat dibedakan hanya dari penampilan fisik.
3. **Menyamakan 100% Het dengan 66% Possible Het:** 100% Het berarti status carrier terkonfirmasi, sedangkan 66% Possible Het berarti masih berupa kemungkinan.
4. **Menggabungkan gen yang berbeda seolah-olah satu gen:** Setiap gen atau lokus perlu dihitung berdasarkan pola pewarisannya sendiri.
5. **Mengabaikan keakuratan data induk:** Hasil kalkulator hanya seakurat informasi genetik yang dimasukkan.`,
    exampleTitle: 'Studi Kasus: Merencanakan Pairing Nyata',
    exampleContent: `Seorang breeder memiliki dua ekor Leopard Gecko:
• Gecko A: Penampilan Normal, status genetik 100% Het Tremper Albino.
• Gecko B: Penampilan Normal, status genetik 100% Het Tremper Albino.

Breeder ingin mengetahui kemungkinan hasil pairing tersebut:
• Tremper Albino Visual: 25% peluang
• 100% Het Tremper Albino: 50% peluang
• Normal non-carrier: 25% peluang

Dari hasil tersebut, breeder dapat memperkirakan bahwa pairing memiliki peluang menghasilkan Tremper Albino Visual. Namun, breeder tetap harus menunggu hasil penetasan dan mengidentifikasi anakan berdasarkan tampilan serta dokumentasi genetik yang tersedia.

Contoh ini menggunakan satu gen resesif saja. Jika kedua induk membawa beberapa gen berbeda, setiap lokus perlu dianalisis dan dikombinasikan dengan benar.`,
    warningTitle: 'Pesan Penting untuk Breeder',
    warningContent: `Kalkulator genetika membantu merencanakan pairing, tetapi kualitas keputusan breeding tetap bergantung pada pemahaman pola pewarisan dan keakuratan data indukan yang dicatat di Registry.`,
    summaryPoints: [
      'Punnett Square membantu memperkirakan kombinasi alel dari kedua induk.',
      'Het × Het menghasilkan peluang 25% Visual, 50% Het, dan 25% Normal non-carrier.',
      'Visual × Het menghasilkan peluang 50% Visual dan 50% Het.',
      'Visual × Normal non-carrier menghasilkan 100% Het.',
      'Het × Normal non-carrier menghasilkan peluang 50% Het dan 50% Normal non-carrier.',
      '66% Possible Het adalah probabilitas carrier pada anakan non-visual dari persilangan Het × Het, berdasarkan asumsi genetik yang tepat.',
      'Hasil kalkulator merupakan peluang, bukan jaminan hasil setiap clutch.'
    ],
    quiz: [
      {
        id: 'q9-1',
        question: 'Dua gecko 100% Het untuk gen resesif yang sama dipasangkan. Berapa peluang anakan menjadi Visual?',
        options: ['50%', '25%', '75%', '100%'],
        correctIndex: 1,
        explanation: 'Persilangan Het × Het menghasilkan peluang 25% Visual, 50% Het, dan 25% Normal non-carrier.'
      },
      {
        id: 'q9-2',
        question: 'Gecko Visual resesif dipasangkan dengan gecko Normal non-carrier. Bagaimana status genetik seluruh anakannya?',
        options: [
          '50% Visual dan 50% Het',
          '25% Visual dan 75% Het',
          '100% Het',
          '100% Normal non-carrier'
        ],
        correctIndex: 2,
        explanation: 'Induk Visual selalu mewariskan alel resesif, sedangkan induk Normal non-carrier selalu mewariskan alel normal. Semua anakan menjadi heterozygous (100% Het).'
      },
      {
        id: 'q9-3',
        question: 'Mengapa anakan non-visual dari persilangan Het × Het dapat disebut 66% Possible Het?',
        options: [
          'Karena 66% tubuhnya memiliki gen resesif',
          'Karena semua anakan non-visual pasti Het',
          'Karena dari kelompok anakan non-visual, dua pertiga diperkirakan Het',
          'Karena peluang Visual sebenarnya 66%'
        ],
        correctIndex: 2,
        explanation: 'Dari persilangan Het × Het, peluang Het adalah 50% dan Normal non-carrier 25%. Jika hanya anakan non-visual yang dihitung, peluang carrier menjadi 50 dari 75 atau sekitar 66,7% (dua pertiga).'
      }
    ]
  },
  {
    id: 'guide-11-kombinasi-gen-combo-morph',
    slug: 'kombinasi-gen-dan-pembentukan-combo-morph',
    title: '4. Kombinasi Gen dan Pembentukan Combo Morph',
    subtitle: 'Panduan mendalam memahami perbedaan Single Gene vs Combo Morph, pewarisan multi-lokus independen, studi kasus multi-gene pada LG dan AFT, serta dekonstruksi nama morph.',
    category: 'Kombinasi Gen dan Analisis Morph',
    species: 'Umum',
    level: 'Menengah',
    order: 9,
    readTimeMinutes: 13,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Simulasikan Combo Morph di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## 1. Apa Itu Kombinasi Gen?

Pada materi sebelumnya, kita sudah mempelajari bagaimana satu gen diwariskan dari induk kepada keturunannya.

Namun, dalam praktik breeding, seekor gecko dapat membawa **beberapa gen berbeda sekaligus**. Kombinasi beberapa gen inilah yang dapat menghasilkan penampilan atau morph tertentu.

Contohnya pada Leopard Gecko, seekor individu dapat membawa gen **Tremper Albino**, **Eclipse**, dan **Patternless Stripe** secara bersamaan.

Ketika beberapa karakter genetik hadir dalam satu individu, kita dapat menyebutnya sebagai kombinasi morph atau **Combo Morph**.

> **Prinsip Utama:** Setiap gen memiliki mekanisme dan aturan pewarisannya sendiri. Tidak semua gen bekerja dengan cara yang sama—sebagian resesif, sebagian incomplete dominant, sebagian dominan, dan sebagian poligenik.

---

## 2. Memahami Perbedaan Single Gene dan Combo Morph

### Single Gene Morph
Single Gene Morph adalah morph yang terutama berkaitan dengan **satu gen atau satu trait genetik tertentu**.

Contoh pada Leopard Gecko:
* **Tremper Albino** (mutasi resesif pada gen tirosinase).
* **Bell Albino** (mutasi resesif lokus berbeda).
* **Eclipse** (mutasi resesif pigmen mata dan corak kaki/hidung).
* **Mack Snow** (mutasi incomplete dominant).

### Combo Morph
Combo Morph merupakan **kombinasi dua atau lebih trait genetik** yang hadir bersamaan dalam satu individu.

Contoh nama kombinasi populer pada Leopard Gecko:
* **RAPTOR:** kombinasi Tremper Albino + Eclipse + Patternless Stripe.
* **Snow RAPTOR:** kombinasi Mack Snow dengan karakteristik RAPTOR.
* **Diablo Blanco:** kombinasi Tremper Albino + Blizzard + Eclipse.

Nama combo morph dapat berbeda-beda tergantung komunitas breeder dan standar penamaan dagang yang digunakan.

> **Penting Diingat:** Tidak semua nama combo morph menunjukkan jumlah gen secara langsung. Karena itu, breeder profesional tidak boleh sekadar menghafal nama dagang, melainkan wajib memahami komponen genetik di balik nama tersebut.

---

## 3. Bagaimana Beberapa Gen Diwariskan Bersamaan?

Untuk memahami kombinasi gen, kita perlu melihat setiap gen sebagai **lokus atau bagian genetik yang dianalisis secara terpisah**.

Misalnya, seekor gecko membawa dua gen resesif berbeda:
* **Gen A:** gen resesif pertama.
* **Gen B:** gen resesif kedua.

Jika individu tersebut merupakan **Double Het**, genotipenya dapat ditulis secara sederhana sebagai:

$$\\text{Genotipe: } AaBb$$

* **Aa** = heterozygous untuk gen A (membawa 1 alel normal A dan 1 alel mutasi a).
* **Bb** = heterozygous untuk gen B (membawa 1 alel normal B dan 1 alel mutasi b).

Individu tersebut membawa satu salinan alel resesif pada masing-masing lokus.

### Rumus Perkalian Probabilitas Multi-Lokus

Jika kedua induk sama-sama Double Het (**AaBb × AaBb**) untuk kedua gen tersebut, peluang memperoleh keturunan yang **homozygous resesif pada kedua lokus (aabb)** dapat dihitung dengan mengalikan peluang masing-masing gen (Hukum Asortasi Bebas Mendel):

* Peluang mewarisi $aa$ = $25\\%$ ($1/4$).
* Peluang mewarisi $bb$ = $25\\%$ ($1/4$).
* Peluang anakan menjadi **aabb (Double Visual)** = $25\\% \\times 25\\% = \\mathbf{6{,}25\\%}$ ($1/16$).

Artinya, peluang memperoleh anakan yang homozygous resesif untuk kedua gen sekaligus adalah **6,25% per butir telur**.

> **Catatan Ilmiah:** Perhitungan ini merupakan contoh standar lokus independen. Dalam praktiknya, keterpautan gen (genetic linkage), pola pewarisan khusus, dan fase alel dapat memengaruhi hasil nyata.

---

## 4. Contoh Kombinasi Gen pada Leopard Gecko

Leopard Gecko memiliki sejarah panjang pembiakan selektif dengan ratusan morph yang terbentuk melalui kombinasi berbagai trait genetik.

### A. RAPTOR

RAPTOR merupakan singkatan dagang resmi yang dirumuskan oleh Ron Tremper:
* **R**ed-eye (mata merah dari Eclipse + Albino).
* **A**lbino (strain Tremper).
* **P**atternless (pola tanpa bercak punggung).
* **T**remper.
* **OR**ange (gradasi warna jingga Tangerine).

RAPTOR merupakan kombinasi karakteristik yang berkaitan dengan garis genetik **Tremper Albino**, **Eclipse**, dan **Patternless Stripe**.

Secara umum, komponen genetiknya melibatkan:
1. **Tremper Albino:** mutasi resesif.
2. **Eclipse:** mutasi resesif.
3. **Patternless Stripe:** trait seleksi yang berkaitan dengan penyebaran pola.

RAPTOR **bukan satu gen tunggal**. Nama tersebut merujuk pada kombinasi karakteristik yang membentuk identitas morph.

### B. Snow RAPTOR

Snow RAPTOR merupakan kombinasi karakteristik RAPTOR dengan mutasi **Mack Snow**.

Mack Snow merupakan trait **Incomplete Dominant**:
* 1 salinan alel menghasilkan **Mack Snow**.
* 2 salinan alel menghasilkan **Super Snow**.

Dalam kombinasi ini, status genetik Tremper Albino, Eclipse, dan komponen pola tetap perlu diperhitungkan secara terpisah dari mutasi Mack Snow.

### C. Memahami Kombinasi Tanpa Menghafal Nama

Breeder tidak cukup hanya menghafal nama morph di pasaran. Hal yang jauh lebih penting adalah menganalisis:
1. **Gen apa saja yang membentuk kombinasi tersebut?**
2. **Bagaimana pola pewarisan setiap gen (Resesif, Incomplete Dominant, Dominant, atau Line-Bred)?**
3. **Apakah status indukan Visual, 100% Het, atau Possible Het?**
4. **Apakah ada trait line-bred yang ikut memengaruhi kualitas penampilan (misal intensitas warna Tangerine)?**
5. **Apakah seluruh informasi genetik didukung oleh dokumen silsilah (lineage) yang jelas?**

Dengan pendekatan ini, breeder dapat memahami potensi genetik individu meskipun nama combo morph yang digunakan berbeda di setiap negara atau forum.

---

## 5. Contoh Kombinasi Gen pada African Fat-Tailed Gecko

African Fat-Tailed Gecko (AFT) juga memiliki berbagai kombinasi morph yang spektakuler.

Namun, contoh dan mekanisme pewarisannya **harus dianalisis berdasarkan genetika khas AFT**, bukan mengambil nama atau pola pewarisan Leopard Gecko!

Beberapa trait utama yang dikenal dalam dunia AFT antara lain:
* **Whiteout:** mutasi Incomplete Dominant (peringatan: Super Whiteout letal embrionik).
* **Oreo:** mutasi resesif warna monokromatis hitam-putih kontras.
* **Patternless:** mutasi resesif hilangnya corak belang alami.
* **Stripe:** trait garis dorsal putih memanjang dari kepala ke ekor.
* **Zulu:** mutasi resesif pola panah dan segitiga unik.
* **Caramel Albino:** mutasi resesif warna karamel hangat.

Dalam praktik breeding AFT, beberapa trait dapat disilangkan bersama dalam satu individu sehingga menghasilkan kombinasi penampilan yang sangat khas, misalnya:
* **Whiteout Oreo:** perpaduan Whiteout (Incomplete Dominant) + Oreo (Resesif Visual).
* **White Knight:** perpaduan Oreo + Amelanistic (Double Resesif Visual).

> **Peringatan Spesies (Genetic Segregation):** Jangan pernah menggunakan contoh Mack Snow, Eclipse, Tremper Albino, atau RAPTOR untuk menjelaskan kombinasi gen AFT! Contoh tersebut murni milik spesies Leopard Gecko dan tidak ada hubungannya dengan genetik African Fat-Tailed Gecko.

---

## 6. Mengapa Nama Combo Morph Tidak Selalu Menjelaskan Genotipe?

Satu nama combo morph belum tentu memberikan informasi lengkap tentang seluruh genotipe yang tersimpan di dalam sel gecko.

Dua ekor gecko dengan penampilan luar yang tampak identik bisa memiliki status genetik dalam yang berbeda drastis:

* **Gecko Pertama:**
  * Visual untuk satu gen resesif (misal Visual Tremper Albino).
  * Membawa satu gen Incomplete Dominant (Mack Snow).
  * Bersih / non-carrier untuk gen resesif lainnya.
* **Gecko Kedua:**
  * Visual untuk satu gen resesif yang sama (Visual Tremper Albino).
  * Membawa satu gen Incomplete Dominant (Mack Snow).
  * **Juga 100% Het untuk Eclipse dan 100% Het Blizzard!**

Secara fenotipe, keduanya tampak serupa sebagai "Mack Snow Tremper Albino". Namun potensi anakan yang dapat mereka hasilkan ketika dikawinkan dengan pasangan tertentu akan **jauh berbeda**!

Karena itu, breeder profesional wajib mencatat dan membaca susunan genotipe lengkap per lokus, bukan hanya nama morph luarnya.

---

## 7. Kesalahan Umum dalam Memahami Combo Morph

Berikut 5 kekeliruan umum yang sering menjebak pemula:

1. **Menganggap combo morph sebagai satu gen baru.**  
   Combo morph adalah gabungan beberapa lokus independen, bukan satu mutasi baru yang muncul secara ajaib.
2. **Menganggap semua gen memiliki pola pewarisan yang sama.**  
   Recessive, Incomplete Dominant, Dominant, dan Line-Bred memiliki rumus dan perilaku penurunan yang berbeda.
3. **Menghitung semua kombinasi dengan rumus tunggal tanpa memisahkan lokus.**  
   Setiap lokus harus dihitung probabilitasnya sendiri-sendiri sebelum dikalikan.
4. **Hanya mengandalkan nama dagang morph tanpa silsilah.**  
   Nama morph pasar sering kali menyembunyikan gen Het tersembunyi atau melebih-lebihkan sifat visual.
5. **Mencampuradukkan contoh genetika LG dan AFT.**  
   Setiap spesies memiliki lokus genetik, strain, dan peringatan bahaya yang berbeda.

---

## 8. Studi Kasus: Memahami Potensi Combo Morph

Seorang breeder merencanakan proyek breeding dengan data indukan sebagai berikut:

* **Induk Jantan (Sire):**
  * Visual Tremper Albino.
  * $100\\%$ Het Eclipse.
  * Mack Snow.
* **Induk Betina (Dam):**
  * $100\\%$ Het Tremper Albino.
  * $100\\%$ Het Eclipse.
  * Normal (Non-Mack Snow).

Breeder ingin mengetahui kemungkinan anakan yang berwujud **Mack Snow RAPTOR (Mack Snow + Visual Tremper + Visual Eclipse)**.

### Langkah Analisis Per Lokus:

| Lokus Gen | Sifat Genetik | Genotipe Jantan | Genotipe Betina | Hasil Probabilitas Target |
|---|---|---|---|---|
| **Tremper Albino** | Resesif | Visual ($aa$) | $100\\%$ Het ($Aa$) | **$50\\%$** Visual Albino |
| **Eclipse** | Resesif | $100\\%$ Het ($Ee$) | $100\\%$ Het ($Ee$) | **$25\\%$** Visual Eclipse |
| **Mack Snow** | Incomplete Dominant | Mack Snow ($S_{snow}s$) | Normal ($ss$) | **$50\\%$** Mack Snow |

### Menghitung Peluang Kombinasi Sekaligus:

Dengan asumsi pewarisan antar-lokus berlangsung secara independen:

$$\\text{Peluang Target} = 50\\% \\times 25\\% \\times 50\\% = 0{,}50 \\times 0{,}25 \\times 0{,}50 = \\mathbf{6{,}25\\%}$$

Peluang mendapatkan anakan **Mack Snow + Visual Tremper Albino + Visual Eclipse** adalah **6,25%** (rata-rata 1 dari 16 butir telur).

> **Penting untuk Diingat:** Hasil matematis 6,25% adalah peluang per butir telur, bukan jaminan pasti bahwa dalam 16 butir telur akan menetas tepat 1 anakan target. Realitas penetasan clutch dipengaruhi oleh fluktuasi statistik independen.`,
    exampleTitle: 'Contoh Multi-Lokus Independen',
    exampleContent: 'Menghitung peluang target kombo: Lokus 1 (50%) × Lokus 2 (25%) × Lokus 3 (50%) = 6.25% (1 dari 16 telur). Tiap lokus dianalisis terpisah sesuai sifat pewarisannya masing-masing.',
    warningTitle: 'Waspadai Dekonstruksi Nama Morph Dagang',
    warningContent: 'Nama combo seperti "RAPTOR" bukan satu gen tunggal melainkan gabungan Tremper + Eclipse + Patternless Stripe. Jangan pernah mengawinkan atau membeli indukan hanya berdasarkan nama dagang tanpa mengecek status genotipe per lokus dan silsilah (lineage) tertulis.',
    summaryPoints: [
      'Combo Morph merupakan perpaduan dua atau lebih trait genetik yang hadir bersamaan dalam satu individu gecko.',
      'Setiap gen menempati lokus tersendiri dan memiliki mekanisme pewarisan masing-masing (Recessive, Incomplete Dominant, Dominant, atau Line-Bred).',
      'Peluang kombinasi multi-gene dihitung dengan mengalikan probabilitas masing-masing lokus independen (misal 50% × 25% × 50% = 6,25%).',
      'Contoh kombinasi Leopard Gecko (RAPTOR, Snow RAPTOR, Tremper) dan AFT (Whiteout, Oreo, Zulu) memiliki mekanisme dan lokus berbeda yang tidak boleh dicampuradukkan.',
      'Dua gecko berpenampilan sama dapat memiliki status genetik carrier (Het) tersembunyi yang berbeda.',
      'Dokumentasi Lineage dan pencatatan status genotipe per lokus sangat penting untuk merencanakan pairing kombo secara terukur.'
    ],
    quiz: [
      {
        id: 'q11-1',
        question: 'Apa yang dimaksud dengan Combo Morph?',
        options: [
          'Morph yang hanya memiliki satu gen resesif',
          'Kombinasi dua atau lebih trait genetik dalam satu individu',
          'Gecko yang memiliki warna paling langka di alam liar',
          'Gecko yang tidak memiliki genetik tertentu'
        ],
        correctIndex: 1,
        explanation: 'Combo Morph mengacu pada kombinasi beberapa karakteristik atau mutasi genetik yang hadir dalam satu individu gecko.'
      },
      {
        id: 'q11-2',
        question: 'Jika peluang gen A adalah 25% dan gen B adalah 25%, berapa peluang mendapatkan kombinasi keduanya sekaligus jika kedua lokus diwariskan secara independen?',
        options: [
          '50%',
          '25%',
          '12,5%',
          '6,25%'
        ],
        correctIndex: 3,
        explanation: 'Peluang kedua kejadian independen dikalikan: 25% × 25% (0,25 × 0,25) = 0,0625 atau 6,25% (1 dari 16).'
      },
      {
        id: 'q11-3',
        question: 'Mengapa breeder tidak cukup hanya mengandalkan nama Combo Morph?',
        options: [
          'Karena nama morph selalu berubah setiap tahun',
          'Karena nama morph tidak selalu menjelaskan seluruh genotipe dan status carrier individu',
          'Karena semua combo morph memiliki gen yang sama',
          'Karena genetik tidak dapat diwariskan'
        ],
        correctIndex: 1,
        explanation: 'Nama morph pasar hanya menggambarkan penampilan luar tertentu, tetapi status genetik tersembunyi (seperti Het pada lokus lain) hanya bisa diketahui melalui catatan genotipe dan silsilah.'
      }
    ]
  },
  {
    id: 'guide-12-evaluasi-indukan-perencanaan-pairing',
    slug: 'evaluasi-indukan-dan-perencanaan-pairing',
    title: '5. Evaluasi Indukan dan Perencanaan Pairing',
    subtitle: 'Panduan mendalam 4 aspek utama evaluasi indukan (kesehatan, genotipe, fenotipe, lineage), membaca kecocokan pasangan, serta menyusun program pairing terarah.',
    category: 'Evaluasi Indukan dan Perencanaan Breeding',
    species: 'Umum',
    level: 'Menengah',
    order: 10,
    readTimeMinutes: 11,
    status: 'published',
    accessLevel: 'free',
    ctaType: 'morph_calculator',
    ctaLabel: 'Simulasi Pairing di Morph Calculator',
    hasQuiz: true,
    hasGlossary: false,
    content: `## 1. Mengapa Indukan Harus Dievaluasi?

Dalam breeding reptil, memilih pasangan tidak cukup hanya berdasarkan penampilan visual atau nama morph yang sedang populer di pasar. Setiap indukan membawa susunan informasi genetik unik, riwayat garis keturunan (*lineage*), kondisi kesehatan fisik, dan potensi risiko biologis yang wajib dipertimbangkan secara matang.

Evaluasi indukan membantu breeder untuk:
* **Menentukan kelayakan reproduksi:** Memastikan individu benar-benar sehat, berbobot ideal, dan siap secara biologis untuk bereproduksi tanpa membahayakan keselamatannya.
* **Memahami potensi genetik anakan:** Memetakan gen apa saja yang pasti diwariskan, berpeluang diwariskan, atau tidak mungkin muncul.
* **Menghindari pairing berdasarkan asumsi:** Menghilangkan spekulasi dan dugaan tak berdasar, seperti menganggap status *Possible Het* sama dengan *100% Het*.
* **Menentukan target keturunan secara realistis:** Menghitung ekspektasi clutch berdasarkan probabilitas genetik nyata, bukan sekadar angan-angan keuntungan finansial.
* **Menyusun program breeding jangka panjang:** Mengarahkan seleksi generasi berikutnya agar garis keturunan (*line*) semakin stabil dan berkualitas.

> **Prinsip Utama:** Tujuan pairing bukan semata-mata menghasilkan anakan dengan nilai komersial tinggi, melainkan mencetak keturunan yang sehat secara anatomi, terdokumentasi silsilahnya secara jujur, dan selaras dengan etika breeding yang bertanggung jawab.

---

## 2. Empat Aspek Utama dalam Evaluasi Indukan

Evaluasi indukan yang komprehensif bertumpu pada 4 pilar pengamatan:

### A. Kondisi Fisik dan Kesehatan

Sebelum memeriksa genetika dan morph, kesehatan fisik calon indukan adalah **syarat mutlak tanpa kompromi**. Gecko dengan morph tercantik sekalipun tidak layak dikawinkan jika kondisi tubuhnya rapuh atau bermasalah.

Poin penting pemeriksaan fisik:
* **Kondisi tubuh dan berat badan:** Betina harus memiliki cadangan lemak ekor yang tebal dan bobot ideal sebelum musim kawin (umumnya $\\ge 45-50\\text{ gram}$ pada Leopard Gecko dan $\\ge 40-45\\text{ gram}$ pada AFT dewasa).
* **Nafsu makan dan aktivitas:** Gecko aktif, memiliki refleks berburu yang baik, dan tidak menunjukkan tanda kelesuan (*lethargy*).
* **Bebas dari indikasi penyakit:** Tidak ada tanda infeksi pernapasan, pembengkakan sendi, atau gangguan pencernaan (Cryptosporidium/parasit).
* **Struktur anatomi normal:** Memeriksa kesimetrisan rahang (bebas MBD/penyakit metabolik tulang), kelurusan tulang belakang, kekuatan 4 kaki, kebersihan kelopak mata, serta keutuhan jari dari sisa kulit shedding.
* **Riwayat kesehatan:** Tidak memiliki riwayat distosia (egg-binding) berulang atau prolapsus yang belum sembuh tuntas.

> **Peringatan Kesiapan:** Kesiapan reproduksi harus dinilai berdasarkan usia matang, struktur tulang, dan massa tubuh, bukan sekadar memaksakan pairing hanya karena gecko sudah mencapai panjang tertentu.

---

### B. Evaluasi Genotipe

Genotipe adalah susunan kode genetik bawaan indukan yang akan diturunkan ke generasi berikutnya. Jangan menyamakan tampilan visual dengan keseluruhan genotipe; dua ekor gecko yang berpenampilan identik bisa memiliki potensi genetik yang bertolak belakang.

Klasifikasi status genetik yang wajib diperiksa:
* **Visual:** Individu mengekspresikan mutasi genetik secara nyata pada tubuhnya (misal *Tremper Albino visual* atau *Whiteout visual*).
* **100% Het:** Individu dipastikan membawa 1 salinan gen resesif tersembunyi karena salah satu atau kedua induknya visual.
* **Possible Het (PH):** Individu memiliki peluang statistik membawa gen resesif (misal 66% PH atau 50% PH), tetapi belum terbukti.
* **Non-carrier (Wild Type):** Individu dipastikan tidak membawa alel mutasi resesif pada lokus yang sedang dievaluasi.
* **Line-Bred / Poligenik:** Karakter fisik yang dipengaruhi oleh akumulasi puluhan gen pendukung lewat seleksi multi-generasi (seperti Tangerine, Blood, atau Red Stripe), bukan satu gen tunggal sederhana.

Informasi genotipe harus didukung oleh sertifikat breeder, catatan riwayat pairing terdahulu, atau hasil uji pembuktian (*prove out*) yang dapat dipertanggungjawabkan.

---

### C. Evaluasi Phenotype dan Kualitas Garis Keturunan

Phenotype adalah karakteristik fisik luar yang dapat diamati secara langsung, meliputi intensitas pigmen, kontras pola, proporsi tubuh, dan kebersihan corak.

Pada sifat *line-bred* (poligenik), evaluasi phenotype memegang peranan krusial:
* **Intensitas warna:** Kedalaman pigmen oranye (*Tangerine*), kepekatan bintik hitam, atau kontras putih.
* **Kebersihan pola:** Apakah tubuh bebas bercak kotor (*clean pattern*) atau memiliki garis simetris yang tegas.
* **Kualitas anatomi kepala & tubuh:** Kepala yang kokoh, moncong proporsional, dan postur tegap.
* **Konsistensi visual:** Apakah indukan tersebut berasal dari keluarga yang stabil menghasilkan anakan berkualitas serupa.

> **Catatan Poligenik:** Penampilan luar yang spektakuler tidak otomatis menjamin 100% anakan akan sama persis. Sifat poligenik memiliki rentang variasi yang luas dan memerlukan seleksi ketat lintas generasi.

---

### D. Evaluasi Lineage dan Riwayat Breeding

*Lineage* (silsilah keluarga) adalah rekam jejak tertulis yang melacak asal-usul genetik indukan hingga kakek-nenek (*grandparents*) atau generasi di atasnya.

Hal yang harus diteliti dalam lineage:
* **Identitas Sire (Pejantan) dan Dam (Betina).**
* **Morph pasti dan status Het kedua induk terdahulu.**
* **Riwayat hasil pairing terdahulu:** Berapa butir telur infertil/fertil yang dihasilkan, dan bagaimana daya tahan anakan yang menetas.
* **Informasi potensi risiko:** Apakah garis keturunan tersebut memiliki kerentanan genetik tertentu (misal riwayat sindrom neurologis atau sensitivitas mata).
* **Konsistensi pencatatan:** Apakah data silsilah dicatat secara rapi per clutch atau hanya berdasarkan ingatan lisan.

---

## 3. Menentukan Tujuan Pairing

Sebelum mempertemukan jantan dan betina ke dalam kandang kawin, breeder wajib merumuskan tujuan yang spesifik dan terukur:

1. **Produksi Combo Morph Spesifik:**  
   Menargetkan kombinasi gen terencana, misalnya memadukan *Tremper Albino* dengan *Eclipse* untuk menghasilkan galur anakan *RAPTOR*.
2. **Pengembangan & Peningkatan Sifat Line-Bred:**  
   Meningkatkan saturasi warna atau kebersihan corak dengan mengawinkan dua indukan pilihan terbaik (*selective breeding*).
3. **Mempertahankan Integritas Garis Keturunan (Line Maintenance):**  
   Menjaga kemurnian strain tertentu (misalnya menjaga galur murni *Bell Albino* atau *Zulu AFT*) tanpa kontaminasi mutasi yang tidak diinginkan.
4. **Menguji Status Genetik (Prove Out Project):**  
   Mengawinkan individu *Possible Het* dengan pasangan *Visual* untuk memastikan apakah individu tersebut membawa gen resesif target atau tidak.

---

## 4. Membaca Kecocokan Genetik Pasangan

Setelah tujuan ditetapkan, langkah selanjutnya adalah menganalisis kecocokan genetik kedua calon indukan secara sistematis.

### Studi Kasus Leopard Gecko:
* **Sire (Jantan):** Visual Tremper Albino, 100% Het Eclipse
* **Dam (Betina):** 100% Het Tremper Albino, 100% Het Eclipse

Mari kita bedah pewarisan pada masing-masing lokus independen:

#### Lokus 1: Tremper Albino (Visual × Het)
* 50% Visual Tremper Albino (homozygous *aa*)
* 50% Het Tremper Albino (carrier *Aa*)

#### Lokus 2: Eclipse (Het × Het)
* 25% Visual Eclipse (homozygous *ee*)
* 50% Het Eclipse (carrier *Ee*)
* 25% Normal Non-carrier Eclipse (wild-type *EE*)

#### Menghitung Peluang Target Ganda (Visual Tremper + Visual Eclipse):
Karena kedua lokus berada pada kromosom berbeda dan memilah secara independen:

$$\\text{Peluang Combo} = 50\\% \\times 25\\% = 12{,}5\\% \\quad \\left(\\frac{1}{8}\\right)$$

Artinya, setiap butir telur yang dibuahi memiliki peluang statistik **12,5%** untuk menetas sebagai anakan Visual Tremper Albino sekaligus Visual Eclipse (RAPTOR fenotipe mata solid/snake). Peluang ini adalah probabilitas per butir telur, bukan jaminan bahwa dari 8 telur pasti menetas tepat 1 ekor combo.

---

## 5. Jangan Hanya Mengejar Combo Morph

Salah satu kesalahan paling fatal di kalangan breeder pemula adalah memasangkan indukan semata-mata demi mengejar nama combo yang sedang viral atau berharga mahal, dengan mengorbankan aspek vital lainnya.

Breeder yang bijak selalu menimbang:
* Kesejahteraan dan stamina betina (tidak memaksakan produksi clutch melebihi batas kesehatan).
* Kekuatan sistem kekebalan dan vitalitas anakan yang dihasilkan.
* Integritas genetik (tidak mencampuradukkan strain albino yang tidak kompatibel seperti Tremper, Bell, dan Rainwater).
* Tanggung jawab pasca-menetas: Ketersediaan kandang pembesaran, pakan serangga bernutrisi, dan komitmen merawat anakan yang lahir berfenotipe normal/non-visual.

---

## 6. Membuat Rencana Pairing Tertulis

Gunakan lembar kerja atau fitur catatan digital di aplikasi sebelum pairing dimulai:

| Komponen Rencana | Informasi yang Dicatat | Contoh Riil |
|---|---|---|
| **Identitas Pejantan (Sire)** | Kode ID, Tanggal Lahir, Bobot | LG-M-2024-03 (68 gram) |
| **Identitas Betina (Dam)** | Kode ID, Tanggal Lahir, Bobot | LG-F-2024-11 (56 gram) |
| **Susunan Genotipe Sire** | Status visual dan carrier pasti | Visual Tremper, 100% Het Eclipse |
| **Susunan Genotipe Dam** | Status visual dan carrier pasti | Normal 100% Het Tremper, 100% Het Eclipse |
| **Tujuan Pairing** | Target fenotipe atau pengujian gen | Mencetak anakan Tremper Eclipse & mengonfirmasi garis Het |
| **Prediksi Peluang Anakan** | Persentase kalkulasi per lokus | 12,5% Tremper Eclipse, 37,5% Tremper Het Eclipse, dst. |
| **Risiko & Riwayat Khusus** | Catatan kesehatan dan perilaku | Nafsu makan tinggi, riwayat kalsium aman |
| **Evaluasi Pasca-Musim** | Perbandingan prediksi vs hasil aktual | Jumlah clutch, daya tetas (hatch rate), rasio anakan |

---

## 7. Studi Kasus: Memilih Pasangan yang Tepat

Seorang breeder memiliki 2 kandidat pejantan dan 1 betina Leopard Gecko:

* **Pejantan A:** Visual Tremper Albino, 100% Het Eclipse. Kondisi fisik prima (70 gram), riwayat silsilah tercatat lengkap.
* **Pejantan B:** Normal, 66% Possible Het Tremper Albino. Kondisi fisik prima (72 gram), belum pernah diuji *prove out*.
* **Betina:** Normal 100% Het Tremper Albino, 100% Het Eclipse. Kondisi fisik sangat baik (58 gram), silsilah terverifikasi.

**Target Breeding:** Menghasilkan anakan anakan combo Visual Tremper Albino + Visual Eclipse.

### Analisis Evaluasi:
* Jika menggunakan **Pejantan A**, kedua gen target memiliki status pasti (Visual Tremper dan 100% Het Eclipse). Peluang mencetak anakan combo adalah $50\\% \\times 25\\% = 12{,}5\\%$ per telur.
* Jika menggunakan **Pejantan B**, status Tremper masih bersifat dugaan (kemungkinan 1 dari 3 bahwa ia sama sekali tidak membawa gen Tremper), dan ia sama sekali tidak membawa gen Eclipse. Peluang menghasilkan combo adalah **0%**.

**Kesimpulan Keputusan:**  
Pejantan A adalah pilihan yang jauh lebih tepat dan terukur untuk mencapai target genetik tersebut.

---

## 8. Kesalahan Umum dalam Perencanaan Pairing

1. **Memilih Pasangan Hanya Berdasarkan Warna Foto:** Tergiur foto media sosial tanpa memverifikasi kesehatan dan genotipe asli.
2. **Menyamakan Possible Het dengan 100% Het:** Memasarkan atau memperhitungkan peluang anak seolah-olah indukan sudah terbukti membawa gen.
3. **Mengabaikan Kondisi Fisik Betina:** Mengawinkan betina yang kurus atau belum cukup usia demi mengejar awal musim kawin.
4. **Tanpa Catatan Silsilah Tertulis:** Mengandalkan ingatan hafalan yang rentan lupa setelah memiliki belasan pasang gecko.
5. **Ekspektasi Keliru pada Clutch Kecil:** Mengharapkan 4 butir telur pertama pasti mencerminkan rasio persentase buku teks.
6. **Inbreeding Tanpa Tujuan Jelas:** Mengawinkan saudara sekandung (*inbreeding*) berulang kali tanpa seleksi ketat sehingga menurunkan daya tahan tubuh anakan.
7. **Mengasumsikan Pewarisan Lintas Spesies:** Menerapkan sifat genetik Leopard Gecko pada African Fat-Tailed Gecko tanpa referensi ilmiah dan praktis yang valid.

---

## 9. Kesimpulan

Evaluasi indukan dan perencanaan pairing adalah pembeda utama antara sekadar "mengawinkan reptil" dengan "program pemuliaan profesional yang bertanggung jawab".

Dengan menilai secara teliti kondisi kesehatan fisik, susunan genotipe, kualitas fenotipe, dan riwayat silsilah keluarga, Anda dapat merancang pairing yang aman bagi indukan, terukur secara genetik, serta menghasilkan keturunan gecko yang berkualitas tinggi.`,
    exampleTitle: 'Contoh Penerapan Evaluasi Pasangan',
    exampleContent: `Sebelum menyatukan sepasang gecko ke kandang breeding, seorang breeder melakukan evaluasi menyeluruh terhadap Jantan (Visual Tremper Albino, 100% Het Eclipse) dan Betina (100% Het Tremper Albino, 100% Het Eclipse).

Dengan memetakan probabilitas per lokus (Tremper: 50% Visual, Eclipse: 25% Visual), breeder memahami bahwa anakan combo ganda memiliki peluang 12,5% per butir telur (1 dari 8 butir). Breeder tidak berekspektasi berlebihan pada clutch awal dan menyiapkan fasilitas pembesaran serta pencatatan terstruktur untuk seluruh variasi anakan yang akan menetas.`,
    warningTitle: 'Peringatan & Etika Breeding Bertanggung Jawab',
    warningContent: `1. Jangan pernah memaksakan pairing pada gecko yang sedang sakit, kurang bobot, atau belum matang secara biologis hanya demi mengejar musim kawin atau tren pasar.
2. Jangan memperlakukan status Possible Het (66% PH atau 50% PH) sebagai 100% Het. Kejujuran label lineage adalah reputasi seumur hidup seorang breeder.
3. Pertimbangkan kapasitas kandang pembesaran, pasokan pakan bernutrisi, dan tanggung jawab kesejahteraan hewan untuk setiap anakan yang menetas.`,
    summaryPoints: [
      'Evaluasi indukan wajib mencakup 4 pilar utama: kondisi fisik & kesehatan, evaluasi genotipe, kualitas fenotipe/line-bred, serta lineage & riwayat silsilah.',
      'Kesehatan fisik dan kematangan reproduksi adalah syarat mutlak nomor satu sebelum memperhitungkan keindahan morph.',
      'Tentukan tujuan pairing secara spesifik dan realistis: produksi combo morph, seleksi line-bred, pemeliharaan strain, atau uji prove out.',
      'Peluang genetik (seperti 50% × 25% = 12,5%) adalah probabilitas independen per butir telur, bukan garansi pembagian anakan pasti dalam satu clutch.',
      'Breeder bertanggung jawab selalu mengutamakan kesejahteraan hewan dan integritas pencatatan silsilah di atas keuntungan komersial sesaat.'
    ],
    quiz: [
      {
        id: 'q12-1',
        question: 'Apa yang harus menjadi pertimbangan sebelum memilih pasangan breeding?',
        options: [
          'Harga jual morph saja',
          'Kondisi kesehatan, genotipe, phenotype, lineage, dan tujuan pairing',
          'Warna gecko yang paling cerah',
          'Popularitas morph di pasaran'
        ],
        correctIndex: 1,
        explanation: 'Memilih indukan harus komprehensif, mencakup kesehatan fisik, susunan genotipe, kualitas visual phenotype, rekam jejak lineage, dan kesesuaian dengan tujuan breeding jangka panjang.'
      },
      {
        id: 'q12-2',
        question: 'Mengapa status Possible Het harus diperlakukan secara hati-hati?',
        options: [
          'Karena selalu berarti Visual',
          'Karena tidak dapat diwariskan',
          'Karena status tersebut belum terkonfirmasi',
          'Karena hanya berlaku pada gecko betina'
        ],
        correctIndex: 2,
        explanation: 'Status Possible Het (misalnya 66% PH atau 50% PH) adalah probabilitas statistik yang belum tentu membawa alel mutasi, sehingga tidak boleh disamakan dengan 100% Het sebelum terbukti lewat prove out.'
      },
      {
        id: 'q12-3',
        question: 'Apa fungsi utama catatan pairing dan lineage?',
        options: [
          'Hanya untuk menentukan harga jual',
          'Untuk mempercantik profil gecko',
          'Untuk memahami asal-usul, mengevaluasi hasil, dan membantu perencanaan breeding berikutnya',
          'Untuk menjamin semua anakan memiliki morph yang sama'
        ],
        correctIndex: 2,
        explanation: 'Catatan pairing dan lineage yang rapi memberikan data otentik tentang riwayat genetik, membantu mengevaluasi kesesuaian prediksi dengan anakan nyata, serta memandu keputusan breeding di generasi mendatang.'
      }
    ]
  }
];

/**
 * Idempotent Starter Seeder:
 * Checks existing `genetics_guides` by document ID and `slug` so clicking multiple times
 * NEVER creates duplicates or overwrites lessons that Admin has already customized.
 */
export async function seedStarterGuidesToFirestore(): Promise<{ createdCount: number; skippedCount: number }> {
  const existingSnap = await getDocs(query(collection(db, 'genetics_guides')));
  const existingIds = new Set<string>();
  const existingSlugs = new Set<string>();

  existingSnap.docs.forEach(d => {
    existingIds.add(d.id);
    const data = d.data();
    if (data?.slug) {
      existingSlugs.add(String(data.slug).trim().toLowerCase());
    }
  });

  const batch = writeBatch(db);
  let createdCount = 0;
  let skippedCount = 0;

  for (const item of STARTER_GENETICS_GUIDES) {
    const docId = item.id!;
    const normalizedSlug = item.slug.trim().toLowerCase();

    if (existingIds.has(docId) || existingSlugs.has(normalizedSlug)) {
      skippedCount++;
      continue;
    }

    const metaRef = doc(db, 'genetics_guides', docId);
    const bodyRef = doc(db, 'genetics_guide_contents', docId);

    const metaPayload: GeneticsGuideMeta = {
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle || '',
      category: item.category,
      species: item.species,
      level: item.level,
      order: item.order,
      readTimeMinutes: item.readTimeMinutes || 4,
      coverImageUrl: item.coverImageUrl || '',
      imageCaption: item.imageCaption || '',
      status: 'published',
      accessLevel: 'free',
      ctaType: item.ctaType || 'none',
      ctaLabel: item.ctaLabel || '',
      hasQuiz: !!(item.quiz && item.quiz.length > 0),
      hasGlossary: !!(item.glossaryTerms && item.glossaryTerms.length > 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const bodyPayload: GeneticsGuideBody = {
      guideId: docId,
      status: 'published',
      accessLevel: 'free',
      content: item.content,
      exampleTitle: item.exampleTitle || '',
      exampleContent: item.exampleContent || '',
      warningTitle: item.warningTitle || '',
      warningContent: item.warningContent || '',
      diagramImageUrl: item.diagramImageUrl || '',
      diagramCaption: item.diagramCaption || '',
      summaryPoints: item.summaryPoints || [],
      quiz: item.quiz || [],
      glossaryTerms: item.glossaryTerms || [],
      updatedAt: serverTimestamp()
    };

    batch.set(metaRef, metaPayload);
    batch.set(bodyRef, bodyPayload);
    createdCount++;
  }

  if (createdCount > 0) {
    await batch.commit();
    clearCachedGuides();
  }

  return { createdCount, skippedCount };
}
