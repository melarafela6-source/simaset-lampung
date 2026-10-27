# SIMASET LAMPUNG - Portal Informasi & Dashboard Aset Daerah
### Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD) Pemerintah Provinsi Lampung

Aplikasi web **Sistem Informasi Manajemen Barang Milik Daerah (SIMASET) Provinsi Lampung** dibangun dengan mengadopsi dan menyempurnakan konsep transparansi publik dari portal referensi [Dashboard Aset Daerah Pemprov Sumatera Barat](https://dashboard_aset.sumbarprov.go.id/). Sistem ini dirancang untuk mempublikasikan dan mengelola data aset daerah secara akuntabel, transparan, dan interaktif sesuai standar **Permendagri No. 47 Tahun 2021** dan **Permendagri No. 19 Tahun 2016**.

---

## 🌟 Fitur Utama Sistem

### 1. 📊 Dashboard Ringkasan Eksekutif & KPI
* **Indikator Kinerja Utama (KPI Cards):**
  * Total Nilai Buku BMD Pemprov Lampung (format Rupiah riil).
  * Total Aset Tercatat lintas 14 OPD & 15 Kabupaten/Kota.
  * Rasio Sertifikasi Tanah (Korsupgah KPK RI & Kanwil BPN Lampung).
  * Rekapitulasi Kendaraan Operasional Dinas (Plat Merah BE).
  * Rekapitulasi Objek Pemanfaatan & Aset Idle (Potensi Peningkatan PAD).
* **Visualisasi Grafik Interaktif (Chart.js):**
  * Komposisi Nilai Aset per Golongan KIB (KIB A s.d. KIB F).
  * Progres Status Sertifikasi Tanah Hak Pakai BPN.
  * Top 5 OPD Pengelola Aset Terbesar di Lingkungan Pemprov Lampung.
  * Distribusi Kondisi Fisik Barang (Baik, Rusak Ringan, Rusak Berat).

### 2. 🗺️ Peta Geospasial Sebaran Aset (GIS Web Map)
* Didukung oleh **Leaflet.js** dengan beberapa pilihan peta dasar (*Carto Positron, OpenStreetMap, Citra Satelit Esri*).
* Titik koordinat aset representatif di seluruh **15 Kabupaten / Kota se-Provinsi Lampung**:
  1. Kota Bandar Lampung (Pusat Perkantoran Balai Keratun, RSUD Dr. H. Abdul Moeloek, PKOR Way Halim)
  2. Kota Metro
  3. Kabupaten Lampung Selatan (Kawasan Wisata Bakauheni Harbour City / Menara Siger, Balai Benih Natar)
  4. Kabupaten Pesawaran
  5. Kabupaten Pringsewu
  6. Kabupaten Tanggamus
  7. Kabupaten Lampung Barat (Kebun Raya Liwa)
  8. Kabupaten Pesisir Barat (Kawasan Wisata Selancar Krui)
  9. Kabupaten Lampung Tengah
  10. Kabupaten Lampung Utara (Kotabumi)
  11. Kabupaten Way Kanan
  12. Kabupaten Tulang Bawang
  13. Kabupaten Tulang Bawang Barat
  14. Kabupaten Mesuji
  15. Kabupaten Lampung Timur (Daerah Irigasi Way Sekampung)
* Marker kategori interaktif dengan warna khas KIB, pop-up informatif foto aset, nilai perolehan, dan shortcut langsung ke detail atau pencetakan label QR.
* Fitur filter langsung berdasarkan Golongan KIB dan *Zoom-to-Kabupaten*.

### 3. 📋 Buku Inventaris KIB (A s.d. F) Lengkap
* Mendukung seluruh klasifikasi Barang Milik Daerah (BMD):
  * **KIB A:** Tanah (Sertifikat Hak Pakai, Luas m², NIB, Lokasi)
  * **KIB B:** Peralatan dan Mesin (Kendaraan Dinas Plat Merah BE, Alat Berat BMBK, Server SPBE)
  * **KIB C:** Gedung dan Bangunan (Kantor Balai Keratun, DPRD, RSUD, Wisma Mahasiswa)
  * **KIB D:** Jalan, Irigasi dan Jaringan (Jalan Provinsi, Jembatan Way Rarem, Saluran Primer)
  * **KIB E:** Aset Tetap Lainnya (Benda Cagar Budaya Museum Ruwa Jurai, Koleksi Liwa, Bibit Sapi)
  * **KIB F:** Konstruksi Dalam Pengerjaan / KDP (Labkesda, Peningkatan Jalan Mesuji)
* **Pencarian Cepat & Multi-Filter Real-time:**
  * Pencarian instan (Nama barang, Kode barang Permendagri, NUP, OPD, Dokumen).
  * Filter OPD / SKPD, Kabupaten/Kota, Kondisi Fisik, Status Penggunaan, dan Status Legalitas Sertifikat.
  * Paginasi data yang responsif.

### 4. 📜 Monitoring Sertifikasi Tanah (Fokus MCP Korsupgah KPK)
* Modul khusus pengamanan hukum aset tanah daerah.
* Monitoring status tanah: *Sudah Bersertifikat Hak Pakai/HPL*, *Dalam Proses BPN (Peta Bidang/Surat Ukur)*, dan *Belum Bersertifikat*.
* Total luas tanah yang telah bersertifikat untuk pelaporan berkala ke BPK RI dan KPK.

### 5. 🤝 Pemanfaatan BMD & Manajemen Aset Idle
* Transparansi aset yang dikerjasamakan untuk pendapatan daerah (Sewa, Pinjam Pakai, KSP).
* **Aset Idle (Menganggur):** Identifikasi lahan dan bangunan yang belum dimanfaatkan optimal untuk dipromosikan kepada investor swasta.

### 6. 🏷️ QR Code Generator & Label Stiker Inventaris
* Pembuatan QR Code dinamis otomatis untuk setiap aset yang tercatat.
* Format cetak label stiker inventaris resmi berstandar BPKAD Pemprov Lampung lengkap dengan:
  * Lambang Resmi Mahkota Siger Lampung.
  * Teks Kop: Pemerintah Provinsi Lampung - BPKAD.
  * QR Code unik, Kode Barang, NUP, Nama Aset, dan OPD Pengguna.
  * Siap dicetak langsung pada kertas stiker inventaris (*Print Stylesheet* terintegrasi).

### 7. 📷 Scanner QR Code Interaktif
* Pemindaian QR Code menggunakan kamera webcam / smartphone perangkat secara langsung (Html5Qrcode).
* Opsi unggah file gambar / foto label QR untuk pencarian dan verifikasi fisik cepat di lapangan.
* Ketika QR terdeteksi, modal detail aset lengkap langsung terbuka secara otomatis.

### 8. 📝 Manajemen Data Penuh (CRUD) & Penyimpanan Lokal
* Form penambahan aset baru dengan validasi field lengkap (Kode barang, NUP, OPD, Kab/Kota, Nilai Rupiah, Koordinat GIS otomatis).
* Fitur Edit dan Hapus data aset.
* Data tersimpan secara persisten di **LocalStorage** browser pengguna, sehingga tidak akan hilang saat halaman di-refresh.
* Tombol **Reset ke Sampel BPKAD** untuk memulihkan dataset acuan resmi kapan saja.

### 9. 📤 Ekspor & Pelaporan Resmi
* **Ekspor Excel (.xlsx):** Mengunduh seluruh daftar aset terfilter menjadi file spreadsheet rapi menggunakan SheetJS.
* **Cetak Berita Acara Rekapitulasi:** Dokumen rekapitulasi formal siap cetak / PDF dengan kop surat resmi BPKAD Pemprov Lampung, tabel rekapitulasi, dan kolom tanda tangan Kepala BPKAD serta Pengurus Barang Pengelola.
* **Backup & Restore JSON:** Fitur cadangkan dan pulihkan seluruh basis data inventaris aset dalam format `.json`.

### 10. 🎨 Desain Modern & Identitas Khas Lampung
* Aksen warna resmi Pemprov Lampung: **Merah Marun (`#881337`)**, **Emas Siger (`#f59e0b`)**, dan **Navy (`#0f172a`)**.
* Dilengkapi dengan ikon vektor SVG Mahkota Siger berlekuk sembilan (*Sang Bumi Ruwa Jurai*).
* Fitur **Dark Mode / Light Mode** yang nyaman di mata.
* Tampilan sepenuhnya responsif pada layar Desktop, Laptop, Tablet, dan Ponsel.

---

## 📁 Struktur Berkas Proyek

```text
d:\Belajar AI\
├── index.html              # Halaman antarmuka utama (SPA) SIMASET Lampung
├── css/
│   └── style.css           # Styling kustom, ornamen siger, animasi, dan print stylesheet
├── js/
│   ├── data.js             # Dataset resmi representatif BMD Pemprov Lampung (KIB A-F)
│   └── app.js              # Logika aplikasi, state management, Leaflet map, Chart.js, QR & CRUD
├── assets/
│   └── logo-lampung.svg    # Vektor logo resmi Mahkota Siger & Lambang Pemprov Lampung
└── README.md               # Dokumentasi lengkap sistem
```

---

## 🚀 Cara Menjalankan Website

Website ini dibangun menggunakan arsitektur web modern yang ringan tanpa memerlukan instalasi database server yang rumit:

### Opsi 1: Langsung Buka di Browser (Paling Mudah)
1. Buka File Explorer dan masuk ke folder `D:\Belajar AI\`.
2. Klik ganda (double click) pada file **`index.html`**.
3. Aplikasi akan langsung terbuka di browser default Anda (Google Chrome, Microsoft Edge, atau Mozilla Firefox) dengan fungsionalitas penuh!

### Opsi 2: Menggunakan Web Server Lokal (Opsional)
Jika Anda memiliki VS Code dengan ekstensi *Live Server*, atau tool HTTP server lainnya:
```powershell
# Contoh menggunakan npx http-server (jika Node.js terpasang)
npx http-server "d:\Belajar AI" -p 8080 -o
```
Akses di browser melalui: `http://localhost:8080`

---

## ⚖️ Landasan Hukum & Regulasi
1. **Undang-Undang Nomor 1 Tahun 2004** tentang Perbendaharaan Negara.
2. **Peraturan Pemerintah Nomor 27 Tahun 2014** jo. **PP Nomor 28 Tahun 2020** tentang Pengelolaan Barang Milik Negara/Daerah.
3. **Peraturan Menteri Dalam Negeri Nomor 19 Tahun 2016** tentang Pedoman Pengelolaan Barang Milik Daerah.
4. **Peraturan Menteri Dalam Negeri Nomor 47 Tahun 2021** tentang Tata Cara Pelaksanaan Pembukuan, Inventarisasi, dan Pelaporan Barang Milik Daerah.
5. **Indikator MCP (Monitoring Center for Prevention) KPK RI** Area Pengelolaan Barang Milik Daerah.

---
*Dikelola oleh Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD) Pemerintah Provinsi Lampung.*

