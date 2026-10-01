import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

interface SectionItem {
  heading: string;
  lead?: string;
  paragraphs?: string[];
  list?: string[];
  subLead?: string;
  subList?: string[];
  footerParagraphs?: string[];
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const content: Record<'privacy' | 'terms', {
    modalTitle: string;
    modalSubtitle: string;
    contentTitle: string;
    icon: React.ReactNode;
    sections: SectionItem[];
    lastUpdated: string;
  }> = {
    privacy: {
      modalTitle: 'Kebijakan Privasi',
      modalSubtitle: 'DOKUMENTASI RESMI',
      contentTitle: 'Kebijakan Privasi',
      icon: <Shield className="text-emerald-500" size={24} />,
      lastUpdated: 'September 2026',
      sections: [
        {
          heading: 'SELAMAT DATANG',
          paragraphs: [
            'Selamat datang di GeckoFarm Pro.',
            'Kami menghargai privasi pengguna dan berkomitmen untuk menjaga keamanan data yang digunakan dalam layanan GeckoFarm Pro.',
            'GeckoFarm Pro menggunakan akun Google sebagai metode autentikasi dan infrastruktur cloud untuk menyimpan serta menyinkronkan data aplikasi.'
          ]
        },
        {
          heading: 'DATA YANG KAMI KUMPULKAN',
          lead: 'Data yang dapat disimpan oleh GeckoFarm Pro meliputi:',
          list: [
            'Informasi Akun: Alamat email dan informasi dasar akun Google yang diperlukan untuk proses login dan mengidentifikasi kepemilikan data pengguna.',
            'Data Gecko & Registry: Nama/gecko ID, morph, jenis kelamin, foto, catatan, status, dan informasi lain mengenai gecko yang dimasukkan pengguna.',
            'Data Genetika & Morph: Informasi genetika, morph, kombinasi morph, dan data terkait yang digunakan dalam fitur genetika GeckoFarm Pro.',
            'Data Breeding: Informasi pairing/breeding pair, clutch, egg, dan catatan aktivitas breeding yang dimasukkan pengguna.',
            'Data Incubation: Data inkubator, telur, tanggal inkubasi, estimasi hatch, status, dan catatan incubation.',
            'Data Finance: Catatan transaksi atau informasi keuangan yang dimasukkan pengguna untuk membantu pengelolaan aktivitas peternakan.',
            'Data Premium: Informasi yang diperlukan untuk mengelola status Premium, masa aktif Premium, dan proses verifikasi pembayaran.',
            'Pengaturan Aplikasi: Preferensi tertentu seperti pengaturan notifikasi, reminder, dan fitur aplikasi lainnya.'
          ],
          footerParagraphs: [
            'Data tersebut digunakan untuk menyediakan fungsi GeckoFarm Pro.'
          ]
        },
        {
          heading: 'PENGGUNAAN DATA',
          lead: 'Data yang Anda masukkan digunakan untuk:',
          list: [
            'menyediakan fitur GeckoFarm Pro;',
            'menyimpan dan menampilkan data Registry;',
            'menjalankan fitur breeding dan incubation;',
            'menjalankan perhitungan genetika;',
            'menyediakan fitur notifikasi dan reminder;',
            'mengelola status Premium;',
            'menjaga keamanan dan stabilitas layanan;',
            'serta meningkatkan kualitas aplikasi.'
          ],
          footerParagraphs: [
            'GeckoFarm Pro tidak menjual data pribadi pengguna.'
          ]
        },
        {
          heading: 'PENYIMPANAN & KEAMANAN DATA',
          paragraphs: [
            'GeckoFarm Pro menggunakan infrastruktur Google Cloud / Firebase untuk menyimpan dan memproses data aplikasi.',
            'Kami menerapkan kontrol akses dan mekanisme keamanan yang sesuai untuk membantu melindungi data pengguna dari akses yang tidak sah.',
            'Lokasi penyimpanan mengikuti konfigurasi regional database yang digunakan oleh layanan GeckoFarm Pro.'
          ]
        },
        {
          heading: 'SINKRONISASI CLOUD',
          paragraphs: [
            'Data GeckoFarm Pro tersimpan dan tersinkronisasi melalui cloud.',
            'Selama akun dan data masih tersedia, pengguna dapat mengakses kembali data melalui akun Google yang sama pada perangkat lain.',
            'Dengan demikian, data aplikasi tidak hanya bergantung pada satu perangkat.',
            'Pengguna tetap disarankan melakukan ekspor atau menyimpan salinan data penting secara berkala.'
          ]
        },
        {
          heading: 'LAMA PENYIMPANAN DATA',
          paragraphs: [
            'Data pengguna disimpan selama akun dan layanan masih aktif.',
            'Data dapat dihapus apabila:'
          ],
          list: [
            'pengguna meminta penghapusan;',
            'terdapat alasan hukum;',
            'diperlukan tindakan keamanan atau operasional tertentu;',
            'atau sesuai dengan ketentuan layanan yang berlaku.'
          ],
          footerParagraphs: [
            'GeckoFarm Pro tidak menerapkan penghapusan otomatis hanya karena data sudah lama tersimpan.'
          ]
        },
        {
          heading: 'GECKO ID & QR PUBLIK',
          paragraphs: [
            'GeckoFarm Pro menyediakan fitur Gecko ID / QR Code yang dapat digunakan untuk membagikan informasi gecko secara publik.',
            'Informasi yang ditampilkan pada Gecko ID publik dapat dilihat oleh siapa pun yang memperoleh atau memindai QR Code atau link tersebut, termasuk orang yang tidak sedang login.',
            'Pengguna bertanggung jawab memastikan informasi yang ditampilkan secara publik tidak mengandung data pribadi atau informasi sensitif yang tidak ingin dibagikan.'
          ]
        },
        {
          heading: 'DATA PRIBADI & AKUN',
          paragraphs: [
            'Pengguna bertanggung jawab menjaga keamanan akun Google yang digunakan untuk mengakses GeckoFarm Pro.',
            'Jangan membagikan akses akun kepada orang lain.',
            'Jika pengguna mencurigai adanya akses yang tidak sah terhadap akun, segera hubungi Admin GeckoFarm Pro.'
          ]
        },
        {
          heading: 'HUBUNGI ADMIN',
          paragraphs: [
            'Jika Anda memiliki pertanyaan mengenai privasi, keamanan data, atau penggunaan GeckoFarm Pro, Anda dapat menghubungi Admin melalui kontak resmi yang tersedia di aplikasi.'
          ]
        }
      ]
    },
    terms: {
      modalTitle: 'Ketentuan Layanan',
      modalSubtitle: 'DOKUMENTASI RESMI',
      contentTitle: 'Ketentuan Layanan',
      icon: <FileText className="text-blue-500" size={24} />,
      lastUpdated: 'September 2026',
      sections: [
        {
          heading: 'PERSETUJUAN LAYANAN',
          paragraphs: [
            'Dengan menggunakan GeckoFarm Pro, Anda menyetujui ketentuan layanan yang berlaku.',
            'Jika Anda tidak menyetujui ketentuan ini, Anda tidak disarankan untuk menggunakan layanan GeckoFarm Pro.'
          ]
        },
        {
          heading: 'PENGGUNAAN LAYANAN',
          lead: 'GeckoFarm Pro disediakan sebagai alat bantu untuk:',
          list: [
            'pengelolaan Registry gecko;',
            'pengelolaan morph dan informasi genetika;',
            'pengelolaan breeding dan pairing;',
            'pengelolaan clutch dan egg;',
            'pengelolaan incubation;',
            'pencatatan transaksi;',
            'perhitungan genetika;',
            'analisis genetika;',
            'notifikasi dan reminder;',
            'serta fitur pendukung lainnya.'
          ],
          footerParagraphs: [
            'Pengguna bertanggung jawab atas kebenaran dan keakuratan data yang dimasukkan ke dalam aplikasi.'
          ]
        },
        {
          heading: 'AKUN PENGGUNA',
          paragraphs: [
            'Pengguna harus menggunakan akun Google yang sah untuk mengakses GeckoFarm Pro.',
            'Pengguna bertanggung jawab menjaga keamanan akun yang digunakan.',
            'Pengguna tidak diperbolehkan menggunakan akun orang lain atau memberikan akses akun kepada pihak yang tidak berwenang.'
          ]
        },
        {
          heading: 'KEANGGOTAAN PREMIUM',
          lead: 'GeckoFarm Pro menyediakan dua status keanggotaan:',
          list: [
            'FREE',
            'ANNUAL PREMIUM'
          ],
          subLead: 'Fitur Premium hanya dapat digunakan selama masa Premium masih aktif.\n\nKetika masa Premium berakhir:',
          subList: [
            'akses fitur Premium dapat dinonaktifkan;',
            'batas penggunaan dapat kembali mengikuti ketentuan paket Free;',
            'data pengguna tidak otomatis dihapus.'
          ],
          footerParagraphs: [
            'Pengguna dapat melakukan perpanjangan Premium sesuai ketentuan yang berlaku.'
          ]
        },
        {
          heading: 'DATA PENGGUNA',
          paragraphs: [
            'Pengguna bertanggung jawab atas data yang dimasukkan ke dalam GeckoFarm Pro.',
            'Pengguna tidak diperbolehkan memasukkan data yang melanggar hukum atau hak pihak lain.',
            'Pengguna juga bertanggung jawab memastikan informasi yang dibagikan melalui fitur publik tidak mengandung informasi pribadi yang tidak ingin dipublikasikan.'
          ]
        },
        {
          heading: 'GECKO ID & INFORMASI PUBLIK',
          paragraphs: [
            'Gecko ID / QR Code dapat digunakan untuk menampilkan informasi gecko secara publik.',
            'Informasi yang tersedia melalui QR atau link publik dapat dilihat oleh pihak yang memperoleh akses terhadap QR/link tersebut.',
            'Pengguna bertanggung jawab atas informasi yang dipilih untuk ditampilkan secara publik.'
          ]
        },
        {
          heading: 'KALKULATOR & ANALISIS GENETIKA',
          paragraphs: [
            'GeckoFarm Pro menyediakan fitur perhitungan genetika dan analisis genetika sebagai alat bantu.',
            'Hasil perhitungan didasarkan pada model genetika, data yang tersedia, dan probabilitas biologis.',
            'Hasil aktual pada breeding dapat berbeda karena faktor seperti:'
          ],
          list: [
            'variasi genetik;',
            'kombinasi gen yang belum diketahui;',
            'fertilitas;',
            'kondisi indukan;',
            'lingkungan;',
            'kondisi incubation;',
            'serta faktor biologis lainnya.'
          ],
          footerParagraphs: [
            'Hasil aplikasi bukan merupakan jaminan terhadap hasil breeding nyata.',
            'Pengguna tetap bertanggung jawab atas keputusan breeding yang dilakukan berdasarkan informasi dari aplikasi.'
          ]
        },
        {
          heading: 'KEAMANAN & PENGGUNAAN YANG DILARANG',
          lead: 'Pengguna dilarang melakukan tindakan yang dapat mengganggu keamanan atau integritas GeckoFarm Pro, termasuk:',
          list: [
            'mencoba mengakses Admin Console tanpa izin;',
            'mencoba memperoleh data pengguna lain;',
            'mengeksploitasi celah keamanan;',
            'melakukan tindakan yang mengganggu layanan;',
            'menggunakan aplikasi untuk aktivitas ilegal;',
            'atau melakukan tindakan lain yang dapat merusak sistem.'
          ]
        },
        {
          heading: 'KETERSEDIAAN LAYANAN',
          paragraphs: [
            'GeckoFarm Pro berupaya menjaga layanan tetap tersedia dan berfungsi dengan baik.',
            'Namun, layanan dapat mengalami gangguan akibat:'
          ],
          list: [
            'maintenance;',
            'pembaruan sistem;',
            'gangguan jaringan;',
            'gangguan layanan pihak ketiga;',
            'atau kondisi teknis lainnya di luar kendali langsung GeckoFarm Pro.'
          ]
        },
        {
          heading: 'PERUBAHAN LAYANAN',
          paragraphs: [
            'GeckoFarm Pro dapat memperbarui, memperbaiki, menambah, mengurangi, atau mengubah fitur layanan untuk meningkatkan keamanan, performa, dan pengalaman pengguna.',
            'Perubahan penting akan diinformasikan melalui aplikasi atau kanal resmi apabila diperlukan.'
          ]
        },
        {
          heading: 'HUBUNGI ADMIN',
          paragraphs: [
            'Untuk bantuan teknis, Premium, keamanan, privasi, atau pertanyaan mengenai layanan, pengguna dapat menghubungi Admin melalui kontak resmi yang tersedia di aplikasi.'
          ]
        }
      ]
    }
  };

  const activeContent = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-emerald-50 flex items-center justify-between shrink-0 bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-emerald-100/50">
                  {activeContent.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                    {activeContent.modalTitle}
                  </h2>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5">
                    {activeContent.modalSubtitle}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-emerald-100 cursor-pointer"
                title="Tutup"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
              <div className="space-y-6 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                    {activeContent.contentTitle}<br />
                    Gecko Farm <span className="text-emerald-500">Pro</span>
                  </h1>
                  <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                </div>

                <div className="space-y-5">
                  {activeContent.sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-50/60 p-6 rounded-3xl border border-slate-100/80">
                      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">
                        {section.heading}
                      </h3>

                      {section.lead && (
                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-sans mb-2">
                          {section.lead}
                        </p>
                      )}

                      {section.paragraphs && (
                        <div className="space-y-2">
                          {section.paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="text-sm font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                              {p}
                            </p>
                          ))}
                        </div>
                      )}

                      {section.list && (
                        <ul className="space-y-2.5 mt-3">
                          {section.list.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 leading-relaxed font-sans">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {section.subLead && (
                        <div className="mt-4 pt-3 border-t border-slate-200/50">
                          <p className="text-sm font-medium text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                            {section.subLead}
                          </p>
                        </div>
                      )}

                      {section.subList && (
                        <ul className="space-y-2.5 mt-3">
                          {section.subList.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm font-medium text-slate-600 leading-relaxed font-sans">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {section.footerParagraphs && (
                        <div className="space-y-2 mt-3 pt-2">
                          {section.footerParagraphs.map((fp, fpIdx) => (
                            <p key={fpIdx} className="text-sm font-medium text-slate-600 leading-relaxed font-sans">
                              {fp}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Terakhir diperbarui: {activeContent.lastUpdated}
                  </p>
                  <div className="flex items-center gap-2">
                     <Shield size={14} className="text-emerald-500 opacity-40" />
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Protected Document</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Fixed Bottom Button */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
               <button 
                 onClick={onClose}
                 className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
               >
                 TUTUP HALAMAN
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
