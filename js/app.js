/**
 * APP LOGIC - PORTAL INFORMASI & DASHBOARD ASET DAERAH PROVINSI LAMPUNG
 * SIMASET PEMPROV LAMPUNG - BPKAD
 */

// Application State
const AppState = {
  asetList: [],
  filteredList: [],
  activeTab: "dashboard",
  kibFilter: "ALL",
  searchQuery: "",
  filterOpd: "ALL",
  filterKabKota: "ALL",
  filterKondisi: "ALL",
  filterStatusPenggunaan: "ALL",
  filterSertifikasi: "ALL",
  currentPage: 1,
  pageSize: 10,
  currentModalAset: null,
  isEditMode: false,
  charts: {},
  map: null,
  markerClusterGroup: null,
  markers: [],
  qrScanner: null
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadData();
  populateDropdowns();
  setupEventListeners();
  renderCurrentView();
  updateMetrics();
  initCharts();
  initMap();
});

// Load data from LocalStorage or fallback to INITIAL_ASET_DATA
function loadData() {
  try {
    const saved = localStorage.getItem("lampung_aset_data_v1");
    if (saved) {
      AppState.asetList = JSON.parse(saved);
    } else {
      AppState.asetList = [...INITIAL_ASET_DATA];
      saveData();
    }
  } catch (e) {
    console.error("Error loading local storage data:", e);
    AppState.asetList = [...INITIAL_ASET_DATA];
  }
  applyFilters();
}

function saveData() {
  try {
    localStorage.setItem("lampung_aset_data_v1", JSON.stringify(AppState.asetList));
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

function resetToDefaultData() {
  if (confirm("Apakah Anda yakin ingin mereset seluruh data aset kembali ke dataset default BPKAD Pemprov Lampung? Semua perubahan data yang belum di-backup akan dihapus.")) {
    AppState.asetList = [...INITIAL_ASET_DATA];
    saveData();
    applyFilters();
    updateMetrics();
    updateCharts();
    refreshMapMarkers();
    showToast("Data aset berhasil direset ke dataset awal BPKAD!", "success");
  }
}

// ==========================================================================
// THEME & DROPDOWNS
// ==========================================================================
function initTheme() {
  const isDark = localStorage.getItem("lampung_theme") === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("lampung_theme", isDark ? "dark" : "light");
  updateThemeIcon();
  updateCharts();
}

function updateThemeIcon() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const isDark = document.documentElement.classList.contains("dark");
  btn.innerHTML = isDark
    ? `<i class="fa-solid fa-sun text-yellow-400"></i>`
    : `<i class="fa-solid fa-moon text-slate-600 dark:text-slate-300"></i>`;
}

function populateDropdowns() {
  // Populate OPDs
  const opdSelects = [document.getElementById("filterOpd"), document.getElementById("formOpd")];
  opdSelects.forEach(select => {
    if (!select) return;
    const isForm = select.id === "formOpd";
    let html = isForm ? `<option value="">-- Pilih OPD Penanggung Jawab --</option>` : `<option value="ALL">Semua OPD / SKPD</option>`;
    OPD_LIST.forEach(opd => {
      html += `<option value="${opd}">${opd}</option>`;
    });
    select.innerHTML = html;
  });

  // Populate Kabupaten / Kota
  const kabSelects = [
    document.getElementById("filterKabKota"),
    document.getElementById("formKabKota"),
    document.getElementById("mapKabKotaFilter")
  ];
  kabSelects.forEach(select => {
    if (!select) return;
    const isForm = select.id === "formKabKota";
    let html = isForm ? `<option value="">-- Pilih Kabupaten / Kota --</option>` : `<option value="ALL">Semua Kabupaten/Kota di Lampung</option>`;
    KABUPATEN_KOTA_LAMPUNG.forEach(kab => {
      html += `<option value="${kab.nama}">${kab.nama}</option>`;
    });
    select.innerHTML = html;
  });
}

// ==========================================================================
// NAVIGATION & VIEW SWITCHING
// ==========================================================================
function switchTab(tabId) {
  AppState.activeTab = tabId;

  // Update navbar links
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("data-tab") === tabId) {
      link.classList.add("bg-rose-900", "text-amber-300", "font-semibold");
      link.classList.remove("text-slate-200", "hover:bg-rose-800");
    } else {
      link.classList.remove("bg-rose-900", "text-amber-300", "font-semibold");
      link.classList.add("text-slate-200", "hover:bg-rose-800");
    }
  });

  // Show / hide view panels
  const views = ["dashboard", "peta", "kib", "sertifikasi", "pemanfaatan", "scanner"];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === tabId) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });

  // Trigger view-specific refreshes
  if (tabId === "peta") {
    setTimeout(() => {
      if (AppState.map) {
        AppState.map.invalidateSize();
      }
    }, 200);
  } else if (tabId === "scanner") {
    initScanner();
  } else {
    stopScanner();
  }

  // Close mobile menu if open
  const mobMenu = document.getElementById("mobileMenu");
  if (mobMenu) mobMenu.classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setKibCategory(cat) {
  AppState.kibFilter = cat;
  document.querySelectorAll(".kib-tab-btn").forEach(btn => {
    if (btn.getAttribute("data-kib") === cat) {
      btn.classList.add("bg-amber-600", "text-white", "shadow");
      btn.classList.remove("bg-slate-100", "text-slate-700", "dark:bg-slate-800", "dark:text-slate-300");
    } else {
      btn.classList.remove("bg-amber-600", "text-white", "shadow");
      btn.classList.add("bg-slate-100", "text-slate-700", "dark:bg-slate-800", "dark:text-slate-300");
    }
  });
  AppState.currentPage = 1;
  applyFilters();
}

// ==========================================================================
// METRICS & KPIS
// ==========================================================================
function updateMetrics() {
  const all = AppState.asetList;
  const totalNilai = all.reduce((sum, item) => sum + (Number(item.nilai_perolehan) || 0), 0);
  const totalItem = all.length;

  // Tanah (KIB A)
  const tanahItems = all.filter(item => item.kategori === "A");
  const tanahSertifikat = tanahItems.filter(item => item.status_sertifikasi === "Bersertifikat Hak Pakai" || item.status_sertifikasi === "Bersertifikat Hak Pengelolaan");
  const persenSertifikat = tanahItems.length > 0 ? ((tanahSertifikat.length / tanahItems.length) * 100).toFixed(1) : 0;
  const totalLuasTanah = tanahItems.reduce((sum, item) => sum + (Number(item.luas_m2) || 0), 0);

  // Kendaraan & Mesin (KIB B)
  const mesinItems = all.filter(item => item.kategori === "B");
  const mesinBaik = mesinItems.filter(item => item.kondisi === "Baik").length;

  // Pemanfaatan & Idle
  const asetPemanfaatan = all.filter(item => item.status_penggunaan && item.status_penggunaan.startsWith("Pemanfaatan"));
  const asetIdle = all.filter(item => item.status_penggunaan === "Idle / Menganggur");
  const nilaiIdle = asetIdle.reduce((sum, item) => sum + (Number(item.nilai_perolehan) || 0), 0);

  // Update DOM Elements
  const elTotalNilai = document.getElementById("metricTotalNilai");
  const elTotalItem = document.getElementById("metricTotalItem");
  const elTanahStat = document.getElementById("metricTanahStat");
  const elTanahPersen = document.getElementById("metricTanahPersen");
  const elKendaraanStat = document.getElementById("metricKendaraanStat");
  const elPemanfaatanStat = document.getElementById("metricPemanfaatanStat");
  const elIdleStat = document.getElementById("metricIdleStat");

  if (elTotalNilai) elTotalNilai.textContent = formatRupiah(totalNilai);
  if (elTotalItem) elTotalItem.textContent = `${formatAngka(totalItem)} Aset`;
  if (elTanahStat) elTanahStat.textContent = `${tanahSertifikat.length} dari ${tanahItems.length} Bidang (${formatAngka(totalLuasTanah)} m²)`;
  if (elTanahPersen) elTanahPersen.textContent = `${persenSertifikat}%`;
  if (elKendaraanStat) elKendaraanStat.textContent = `${mesinItems.length} Unit (${mesinBaik} Kondisi Prima)`;
  if (elPemanfaatanStat) elPemanfaatanStat.textContent = `${asetPemanfaatan.length} Objek BMD`;
  if (elIdleStat) elIdleStat.textContent = `${asetIdle.length} Objek (${formatRupiah(nilaiIdle)})`;

  // Update Sertifikasi Tab Metrics
  const elSertifTotal = document.getElementById("sertifTotalTanah");
  const elSertifSudah = document.getElementById("sertifSudah");
  const elSertifProses = document.getElementById("sertifProses");
  const elSertifBelum = document.getElementById("sertifBelum");
  const elSertifLuas = document.getElementById("sertifLuasTotal");

  if (elSertifTotal) elSertifTotal.textContent = `${tanahItems.length} Bidang`;
  if (elSertifSudah) elSertifSudah.textContent = `${tanahSertifikat.length} Bidang`;
  if (elSertifProses) elSertifProses.textContent = `${tanahItems.filter(i => i.status_sertifikasi === "Proses BPN").length} Bidang`;
  if (elSertifBelum) elSertifBelum.textContent = `${tanahItems.filter(i => i.status_sertifikasi === "Belum Bersertifikat").length} Bidang`;
  if (elSertifLuas) elSertifLuas.textContent = `${formatAngka(totalLuasTanah)} m²`;

  // Render Pemanfaatan view tables
  renderPemanfaatanView();
}

// ==========================================================================
// CHARTS (CHART.JS)
// ==========================================================================
function initCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js library not loaded yet.");
    return;
  }
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  // 1. Chart KIB Distribution
  const ctxKib = document.getElementById("chartKibDist")?.getContext("2d");
  if (ctxKib) {
    const kibTotals = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    AppState.asetList.forEach(a => {
      if (kibTotals[a.kategori] !== undefined) {
        kibTotals[a.kategori] += Number(a.nilai_perolehan) || 0;
      }
    });

    AppState.charts.kib = new Chart(ctxKib, {
      type: "doughnut",
      data: {
        labels: ["KIB A (Tanah)", "KIB B (Peralatan)", "KIB C (Gedung)", "KIB D (Jalan/Irigasi)", "KIB E (Aset Lainnya)", "KIB F (KDP)"],
        datasets: [{
          data: Object.values(kibTotals),
          backgroundColor: ["#dc2626", "#2563eb", "#d97706", "#16a34a", "#9333ea", "#06b6d4"],
          borderWidth: 2,
          borderColor: isDark ? "#1e293b" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${formatRupiah(ctx.raw)}`
            }
          }
        }
      }
    });
  }

  // 2. Chart Sertifikasi Tanah
  const ctxSertif = document.getElementById("chartSertif")?.getContext("2d");
  if (ctxSertif) {
    const tanahItems = AppState.asetList.filter(i => i.kategori === "A");
    const sudah = tanahItems.filter(i => i.status_sertifikasi.includes("Bersertifikat")).length;
    const proses = tanahItems.filter(i => i.status_sertifikasi === "Proses BPN").length;
    const belum = tanahItems.filter(i => i.status_sertifikasi === "Belum Bersertifikat").length;

    AppState.charts.sertif = new Chart(ctxSertif, {
      type: "pie",
      data: {
        labels: ["Sudah Bersertifikat Hak Pakai", "Dalam Proses BPN", "Belum Bersertifikat"],
        datasets: [{
          data: [sudah, proses, belum],
          backgroundColor: ["#16a34a", "#eab308", "#ef4444"],
          borderWidth: 2,
          borderColor: isDark ? "#1e293b" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, boxWidth: 12 } }
        }
      }
    });
  }

  // 3. Chart Top OPD Nilai Aset
  const ctxOpd = document.getElementById("chartTopOpd")?.getContext("2d");
  if (ctxOpd) {
    const opdTotals = {};
    AppState.asetList.forEach(a => {
      opdTotals[a.opd] = (opdTotals[a.opd] || 0) + (Number(a.nilai_perolehan) || 0);
    });

    const sortedOpd = Object.entries(opdTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    AppState.charts.opd = new Chart(ctxOpd, {
      type: "bar",
      data: {
        labels: sortedOpd.map(i => i[0].length > 25 ? i[0].substring(0, 25) + "..." : i[0]),
        datasets: [{
          label: "Nilai Aset (Rupiah)",
          data: sortedOpd.map(i => i[1]),
          backgroundColor: "#881337",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (val) => "Rp " + (val / 1e9).toFixed(0) + " M"
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Nilai: ${formatRupiah(ctx.raw)}`
            }
          }
        }
      }
    });
  }

  // 4. Chart Kondisi Barang
  const ctxKondisi = document.getElementById("chartKondisi")?.getContext("2d");
  if (ctxKondisi) {
    const baik = AppState.asetList.filter(i => i.kondisi === "Baik").length;
    const rusakRingan = AppState.asetList.filter(i => i.kondisi === "Rusak Ringan").length;
    const rusakBerat = AppState.asetList.filter(i => i.kondisi === "Rusak Berat").length;

    AppState.charts.kondisi = new Chart(ctxKondisi, {
      type: "doughnut",
      data: {
        labels: ["Kondisi Baik", "Rusak Ringan", "Rusak Berat"],
        datasets: [{
          data: [baik, rusakRingan, rusakBerat],
          backgroundColor: ["#10b981", "#f59e0b", "#f43f5e"],
          borderWidth: 2,
          borderColor: isDark ? "#1e293b" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, boxWidth: 12 } }
        }
      }
    });
  }
}

function updateCharts() {
  if (AppState.charts.kib) AppState.charts.kib.destroy();
  if (AppState.charts.sertif) AppState.charts.sertif.destroy();
  if (AppState.charts.opd) AppState.charts.opd.destroy();
  if (AppState.charts.kondisi) AppState.charts.kondisi.destroy();
  initCharts();
}

// ==========================================================================
// INTERACTIVE MAP (LEAFLET.JS)
// ==========================================================================
function initMap() {
  if (typeof L === "undefined") {
    console.warn("Leaflet library not loaded yet.");
    return;
  }
  const mapContainer = document.getElementById("mapAset");
  if (!mapContainer) return;

  // Center on Lampung Province
  AppState.map = L.map("mapAset").setView([-5.15, 105.15], 8);

  // Basemaps
  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> BPKAD Lampung'
  });

  const cartoPositron = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: '&copy; CartoDB & OpenStreetMap'
  });

  const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    attribution: '&copy; Esri World Imagery'
  });

  cartoPositron.addTo(AppState.map);

  const baseMaps = {
    "Peta Standar (Carto Positron)": cartoPositron,
    "Peta Terbuka (OpenStreetMap)": osmLayer,
    "Citra Satelit": satelliteLayer
  };

  L.control.layers(baseMaps).addTo(AppState.map);

  refreshMapMarkers();
}

function getMarkerColor(kategori) {
  switch (kategori) {
    case "A": return "#dc2626"; // Merah Tanah
    case "B": return "#2563eb"; // Biru Mesin
    case "C": return "#d97706"; // Emas Gedung
    case "D": return "#16a34a"; // Hijau Irigasi/Jalan
    case "E": return "#9333ea"; // Ungu Aset Lain
    case "F": return "#06b6d4"; // Cyan KDP
    default: return "#64748b";
  }
}

function refreshMapMarkers() {
  if (!AppState.map) return;

  // Clear existing markers
  AppState.markers.forEach(m => AppState.map.removeLayer(m));
  AppState.markers = [];

  const filterKategori = document.getElementById("mapKibFilter")?.value || "ALL";
  const filterKab = document.getElementById("mapKabKotaFilter")?.value || "ALL";

  AppState.asetList.forEach(aset => {
    if (!aset.lat || !aset.lng) return;
    if (filterKategori !== "ALL" && aset.kategori !== filterKategori) return;
    if (filterKab !== "ALL" && aset.kabupaten_kota !== filterKab) return;

    const color = getMarkerColor(aset.kategori);

    const customIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white; color: white; font-size: 11px; font-weight: bold;">${aset.kategori}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const marker = L.marker([aset.lat, aset.lng], { icon: customIcon });

    const popupContent = `
      <div class="p-3 max-w-xs">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <span class="text-xs font-bold px-2 py-0.5 rounded text-white" style="background-color: ${color}">KIB ${aset.kategori}</span>
          <span class="text-xs text-slate-500 font-mono">${aset.kode_barang}</span>
        </div>
        <img src="${aset.foto_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80'}" alt="${aset.nama_barang}" class="w-full h-28 object-cover rounded mb-2">
        <h4 class="text-sm font-bold text-slate-900 leading-tight mb-1">${aset.nama_barang}</h4>
        <p class="text-xs text-slate-600 mb-1"><i class="fa-solid fa-location-dot text-rose-600 mr-1"></i>${aset.kabupaten_kota}</p>
        <p class="text-xs text-slate-600 mb-2"><i class="fa-solid fa-building-columns text-slate-500 mr-1"></i>${aset.opd}</p>
        <div class="bg-rose-50 p-2 rounded mb-2">
          <div class="text-[10px] text-rose-800 uppercase font-semibold">Nilai Perolehan</div>
          <div class="text-xs font-black text-rose-950">${formatRupiah(aset.nilai_perolehan)}</div>
        </div>
        <div class="flex gap-2">
          <button onclick="openDetailModal('${aset.id}')" class="flex-1 text-xs bg-rose-900 hover:bg-rose-800 text-amber-300 font-bold py-1.5 px-2 rounded text-center transition">
            <i class="fa-solid fa-eye mr-1"></i> Detail
          </button>
          <button onclick="printQrLabel('${aset.id}')" class="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-1.5 px-2 rounded text-center transition">
            <i class="fa-solid fa-qrcode"></i>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(AppState.map);
    AppState.markers.push(marker);
  });
}

function zoomToKabupaten(namaKab) {
  const target = KABUPATEN_KOTA_LAMPUNG.find(k => k.nama === namaKab);
  if (target && AppState.map) {
    AppState.map.setView([target.lat, target.lng], 12);
  }
}

// ==========================================================================
// DATA FILTERING & TABLE RENDERING
// ==========================================================================
function applyFilters() {
  let list = [...AppState.asetList];

  // KIB Category Filter
  if (AppState.kibFilter !== "ALL") {
    list = list.filter(item => item.kategori === AppState.kibFilter);
  }

  // OPD Filter
  if (AppState.filterOpd !== "ALL") {
    list = list.filter(item => item.opd === AppState.filterOpd);
  }

  // Kab/Kota Filter
  if (AppState.filterKabKota !== "ALL") {
    list = list.filter(item => item.kabupaten_kota === AppState.filterKabKota);
  }

  // Kondisi Filter
  if (AppState.filterKondisi !== "ALL") {
    list = list.filter(item => item.kondisi === AppState.filterKondisi);
  }

  // Status Penggunaan Filter
  if (AppState.filterStatusPenggunaan !== "ALL") {
    list = list.filter(item => item.status_penggunaan === AppState.filterStatusPenggunaan);
  }

  // Status Sertifikasi Filter
  if (AppState.filterSertifikasi !== "ALL") {
    list = list.filter(item => item.status_sertifikasi === AppState.filterSertifikasi);
  }

  // Search Query
  if (AppState.searchQuery.trim() !== "") {
    const q = AppState.searchQuery.toLowerCase();
    list = list.filter(item =>
      (item.nama_barang && item.nama_barang.toLowerCase().includes(q)) ||
      (item.kode_barang && item.kode_barang.toLowerCase().includes(q)) ||
      (item.nup && item.nup.toLowerCase().includes(q)) ||
      (item.opd && item.opd.toLowerCase().includes(q)) ||
      (item.alamat_lokasi && item.alamat_lokasi.toLowerCase().includes(q)) ||
      (item.nomor_dokumen && item.nomor_dokumen.toLowerCase().includes(q))
    );
  }

  AppState.filteredList = list;
  renderTable();
  renderPagination();
}

function renderTable() {
  const tbody = document.getElementById("asetTableBody");
  if (!tbody) return;

  const totalFiltered = AppState.filteredList.length;
  document.getElementById("filteredCountText").textContent = `Menampilkan ${totalFiltered} dari total ${AppState.asetList.length} aset BMD`;

  if (totalFiltered === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-folder-open text-4xl mb-3 text-slate-300"></i>
          <p class="text-base font-semibold">Tidak ada data aset yang sesuai dengan kriteria filter.</p>
          <button onclick="resetFilters()" class="mt-3 text-sm text-rose-700 underline font-semibold">Reset Filter Pencarian</button>
        </td>
      </tr>
    `;
    return;
  }

  const start = (AppState.currentPage - 1) * AppState.pageSize;
  const pageItems = AppState.filteredList.slice(start, start + AppState.pageSize);

  let html = "";
  pageItems.forEach((item, index) => {
    const no = start + index + 1;
    const color = getMarkerColor(item.kategori);

    // Badges
    const badgeKondisi = item.kondisi === "Baik"
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><i class="fa-solid fa-circle-check mr-1 text-[10px]"></i> Baik</span>`
      : item.kondisi === "Rusak Ringan"
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><i class="fa-solid fa-triangle-exclamation mr-1 text-[10px]"></i> Rusak Ringan</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"><i class="fa-solid fa-circle-xmark mr-1 text-[10px]"></i> Rusak Berat</span>`;

    const badgeStatus = item.status_penggunaan === "Idle / Menganggur"
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 badge-pulse">Aset Idle</span>`
      : item.status_penggunaan.startsWith("Pemanfaatan")
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300">${item.status_penggunaan}</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Digunakan Sendiri</span>`;

    html += `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800">
        <td class="px-4 py-3 text-xs text-slate-500 font-mono text-center">${no}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded flex items-center justify-center text-white text-[11px] font-black shrink-0" style="background-color: ${color}">
              ${item.kategori}
            </span>
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-slate-100">${item.kode_barang}</div>
              <div class="text-[11px] text-slate-500 font-mono">NUP: ${item.nup}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="font-semibold text-slate-900 dark:text-slate-100 text-xs">${item.nama_barang}</div>
          <div class="text-[11px] text-slate-500 truncate max-w-xs">${item.alamat_lokasi || '-'}</div>
          ${item.nomor_dokumen ? `<div class="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono"><i class="fa-solid fa-file-contract mr-1"></i>${item.nomor_dokumen}</div>` : ''}
        </td>
        <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
          <div class="font-medium">${item.opd}</div>
          <div class="text-[11px] text-slate-500"><i class="fa-solid fa-map-pin text-rose-500 mr-1"></i>${item.kabupaten_kota}</div>
        </td>
        <td class="px-4 py-3 text-xs font-mono font-bold text-right text-rose-950 dark:text-rose-300 whitespace-nowrap">
          ${formatRupiah(item.nilai_perolehan)}
          <div class="text-[10px] text-slate-400 font-normal">Th. ${item.tahun_perolehan}</div>
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          ${badgeKondisi}
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          ${badgeStatus}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openDetailModal('${item.id}')" title="Lihat Detail" class="p-1.5 text-slate-600 hover:text-rose-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition">
              <i class="fa-solid fa-circle-info text-sm"></i>
            </button>
            <button onclick="printQrLabel('${item.id}')" title="Cetak Label QR" class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition">
              <i class="fa-solid fa-qrcode text-sm"></i>
            </button>
            <button onclick="openEditModal('${item.id}')" title="Edit Aset" class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition">
              <i class="fa-solid fa-pen-to-square text-sm"></i>
            </button>
            <button onclick="deleteAset('${item.id}')" title="Hapus Aset" class="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition">
              <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function renderPagination() {
  const container = document.getElementById("paginationControls");
  if (!container) return;

  const totalPages = Math.ceil(AppState.filteredList.length / AppState.pageSize) || 1;
  const current = AppState.currentPage;

  let html = `
    <button onclick="changePage(${current - 1})" ${current === 1 ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="px-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
      <i class="fa-solid fa-chevron-left mr-1"></i> Sebelumnya
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      html += `
        <button onclick="changePage(${i})" class="px-3 py-1 text-xs font-semibold rounded transition ${i === current ? 'bg-rose-900 text-amber-300 shadow' : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}">
          ${i}
        </button>
      `;
    } else if (i === current - 2 || i === current + 2) {
      html += `<span class="px-2 text-slate-400">...</span>`;
    }
  }

  html += `
    <button onclick="changePage(${current + 1})" ${current === totalPages ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="px-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
      Berikutnya <i class="fa-solid fa-chevron-right ml-1"></i>
    </button>
  `;

  container.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(AppState.filteredList.length / AppState.pageSize) || 1;
  if (page < 1 || page > totalPages) return;
  AppState.currentPage = page;
  renderTable();
  renderPagination();
}

function resetFilters() {
  AppState.kibFilter = "ALL";
  AppState.searchQuery = "";
  AppState.filterOpd = "ALL";
  AppState.filterKabKota = "ALL";
  AppState.filterKondisi = "ALL";
  AppState.filterStatusPenggunaan = "ALL";
  AppState.filterSertifikasi = "ALL";
  AppState.currentPage = 1;

  document.getElementById("searchInput").value = "";
  document.getElementById("filterOpd").value = "ALL";
  document.getElementById("filterKabKota").value = "ALL";
  document.getElementById("filterKondisi").value = "ALL";
  document.getElementById("filterStatusPenggunaan").value = "ALL";
  document.getElementById("filterSertifikasi").value = "ALL";

  document.querySelectorAll(".kib-tab-btn").forEach(btn => {
    if (btn.getAttribute("data-kib") === "ALL") {
      btn.classList.add("bg-amber-600", "text-white");
    } else {
      btn.classList.remove("bg-amber-600", "text-white");
      btn.classList.add("bg-slate-100", "text-slate-700");
    }
  });

  applyFilters();
}

// ==========================================================================
// MODAL DETAIL ASET
// ==========================================================================
function openDetailModal(asetId) {
  const aset = AppState.asetList.find(a => a.id === asetId);
  if (!aset) return;
  AppState.currentModalAset = aset;

  document.getElementById("modalAsetJudul").textContent = aset.nama_barang;
  document.getElementById("modalAsetKode").textContent = `${aset.kode_barang} | NUP: ${aset.nup}`;
  document.getElementById("modalAsetFoto").src = aset.foto_url || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80";

  // Data fields
  document.getElementById("modalAsetKategori").textContent = `KIB ${aset.kategori} (${KIB_CATEGORIES[aset.kategori]?.nama || aset.kategori})`;
  document.getElementById("modalAsetSubKategori").textContent = aset.sub_kategori || "-";
  document.getElementById("modalAsetOpd").textContent = aset.opd || "-";
  document.getElementById("modalAsetKab").textContent = aset.kabupaten_kota || "-";
  document.getElementById("modalAsetAlamat").textContent = aset.alamat_lokasi || "-";
  document.getElementById("modalAsetTahun").textContent = aset.tahun_perolehan || "-";
  document.getElementById("modalAsetNilai").textContent = formatRupiah(aset.nilai_perolehan);
  document.getElementById("modalAsetNilaiBuku").textContent = formatRupiah(aset.nilai_buku || aset.nilai_perolehan);
  document.getElementById("modalAsetKondisi").textContent = aset.kondisi || "-";
  document.getElementById("modalAsetStatusPenggunaan").textContent = aset.status_penggunaan || "-";
  document.getElementById("modalAsetSertifikasi").textContent = aset.status_sertifikasi || "N/A";
  document.getElementById("modalAsetDokumen").textContent = aset.nomor_dokumen || "-";
  document.getElementById("modalAsetLuas").textContent = aset.luas_m2 ? `${formatAngka(aset.luas_m2)} ${aset.satuan || 'm²'}` : "-";
  document.getElementById("modalAsetPJ").textContent = `${aset.penanggung_jawab || '-'} ${aset.nip ? '(NIP: ' + aset.nip + ')' : ''}`;
  document.getElementById("modalAsetCatatan").textContent = aset.catatan || "Tidak ada catatan khusus.";
  document.getElementById("modalAsetKoordinat").textContent = (aset.lat && aset.lng) ? `${aset.lat}, ${aset.lng}` : "Belum terdata";

  // Generate QR Code in modal
  const qrContainer = document.getElementById("modalQrContainer");
  qrContainer.innerHTML = "";
  if (typeof QRCode !== "undefined") {
    try {
      new QRCode(qrContainer, {
        text: JSON.stringify({
          id: aset.id,
          kode: aset.kode_barang,
          nup: aset.nup,
          nama: aset.nama_barang,
          pemprov: "Provinsi Lampung"
        }),
        width: 110,
        height: 110,
        colorDark: "#881337",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      qrContainer.innerHTML = `<span class="text-[10px] text-slate-400">QR Code Error</span>`;
    }
  } else {
    qrContainer.innerHTML = `<span class="text-[10px] text-slate-400">QR Code Ready</span>`;
  }

  const modal = document.getElementById("detailModal");
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeDetailModal() {
  const modal = document.getElementById("detailModal");
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

// ==========================================================================
// FORM TAMBAH & EDIT ASET (CRUD)
// ==========================================================================
function openAddModal() {
  AppState.isEditMode = false;
  document.getElementById("formModalTitle").textContent = "Pencatatan Aset Baru (BMD Pemprov Lampung)";
  document.getElementById("formAsetId").value = "";
  document.getElementById("asetForm").reset();

  // Auto NUP & Code suggestion
  const nextNup = String(AppState.asetList.length + 1).padStart(5, "0");
  document.getElementById("formNup").value = nextNup;
  document.getElementById("formTahun").value = new Date().getFullYear();

  const modal = document.getElementById("formModal");
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function openEditModal(asetId) {
  const id = asetId || AppState.currentModalAset?.id;
  const aset = AppState.asetList.find(a => a.id === id);
  if (!aset) return;
  AppState.isEditMode = true;

  document.getElementById("formModalTitle").textContent = "Edit Data Aset BMD Pemprov Lampung";
  document.getElementById("formAsetId").value = aset.id;
  document.getElementById("formKategori").value = aset.kategori;
  document.getElementById("formKodeBarang").value = aset.kode_barang;
  document.getElementById("formNup").value = aset.nup;
  document.getElementById("formNamaBarang").value = aset.nama_barang;
  document.getElementById("formSubKategori").value = aset.sub_kategori || "";
  document.getElementById("formOpd").value = aset.opd;
  document.getElementById("formKabKota").value = aset.kabupaten_kota;
  document.getElementById("formAlamat").value = aset.alamat_lokasi || "";
  document.getElementById("formTahun").value = aset.tahun_perolehan;
  document.getElementById("formNilai").value = aset.nilai_perolehan;
  document.getElementById("formKondisi").value = aset.kondisi;
  document.getElementById("formStatusPenggunaan").value = aset.status_penggunaan;
  document.getElementById("formSertifikasi").value = aset.status_sertifikasi || "N/A";
  document.getElementById("formDokumen").value = aset.nomor_dokumen || "";
  document.getElementById("formLuas").value = aset.luas_m2 || 0;
  document.getElementById("formPJ").value = aset.penanggung_jawab || "";
  document.getElementById("formNip").value = aset.nip || "";
  document.getElementById("formFoto").value = aset.foto_url || "";
  document.getElementById("formLat").value = aset.lat || "";
  document.getElementById("formLng").value = aset.lng || "";
  document.getElementById("formCatatan").value = aset.catatan || "";

  closeDetailModal();
  const modal = document.getElementById("formModal");
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeFormModal() {
  const modal = document.getElementById("formModal");
  modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function handleKabKotaChange() {
  const kabVal = document.getElementById("formKabKota").value;
  const kabData = KABUPATEN_KOTA_LAMPUNG.find(k => k.nama === kabVal);
  if (kabData) {
    document.getElementById("formLat").value = kabData.lat;
    document.getElementById("formLng").value = kabData.lng;
  }
}

function saveAsetForm(event) {
  event.preventDefault();

  const id = document.getElementById("formAsetId").value;
  const kategori = document.getElementById("formKategori").value;
  const kodeBarang = document.getElementById("formKodeBarang").value;
  const nup = document.getElementById("formNup").value;
  const namaBarang = document.getElementById("formNamaBarang").value;
  const subKategori = document.getElementById("formSubKategori").value;
  const opd = document.getElementById("formOpd").value;
  const kabKota = document.getElementById("formKabKota").value;
  const alamat = document.getElementById("formAlamat").value;
  const tahun = parseInt(document.getElementById("formTahun").value) || new Date().getFullYear();
  const nilai = parseFloat(document.getElementById("formNilai").value) || 0;
  const kondisi = document.getElementById("formKondisi").value;
  const statusPenggunaan = document.getElementById("formStatusPenggunaan").value;
  const sertifikasi = document.getElementById("formSertifikasi").value;
  const dokumen = document.getElementById("formDokumen").value;
  const luas = parseFloat(document.getElementById("formLuas").value) || 0;
  const pj = document.getElementById("formPJ").value;
  const nip = document.getElementById("formNip").value;
  const foto = document.getElementById("formFoto").value || "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80";
  const lat = parseFloat(document.getElementById("formLat").value) || -5.4297;
  const lng = parseFloat(document.getElementById("formLng").value) || 105.2625;
  const catatan = document.getElementById("formCatatan").value;

  if (AppState.isEditMode && id) {
    const idx = AppState.asetList.findIndex(a => a.id === id);
    if (idx !== -1) {
      AppState.asetList[idx] = {
        ...AppState.asetList[idx],
        kategori,
        kode_barang: kodeBarang,
        nup,
        nama_barang: namaBarang,
        sub_kategori: subKategori,
        opd,
        kabupaten_kota: kabKota,
        alamat_lokasi: alamat,
        tahun_perolehan: tahun,
        nilai_perolehan: nilai,
        nilai_buku: nilai,
        kondisi,
        status_penggunaan: statusPenggunaan,
        status_sertifikasi: sertifikasi,
        nomor_dokumen: dokumen,
        luas_m2: luas,
        penanggung_jawab: pj,
        nip,
        foto_url: foto,
        lat,
        lng,
        catatan
      };
      showToast("Data aset berhasil diperbarui!", "success");
    }
  } else {
    const newId = `AST-${kategori}-${String(AppState.asetList.length + 1).padStart(3, "0")}`;
    const newAset = {
      id: newId,
      kode_barang: kodeBarang,
      nup,
      nama_barang: namaBarang,
      kategori,
      sub_kategori: subKategori,
      opd,
      kabupaten_kota: kabKota,
      alamat_lokasi: alamat,
      lat,
      lng,
      tahun_perolehan: tahun,
      nilai_perolehan: nilai,
      nilai_buku: nilai,
      kondisi,
      status_penggunaan: statusPenggunaan,
      status_sertifikasi: sertifikasi,
      nomor_dokumen: dokumen,
      luas_m2: luas,
      satuan: kategori === "A" || kategori === "C" ? "m²" : "Unit",
      penanggung_jawab: pj,
      nip,
      foto_url: foto,
      catatan
    };
    AppState.asetList.unshift(newAset);
    showToast("Aset baru berhasil dicatatkan ke dalam inventaris BMD!", "success");
  }

  saveData();
  applyFilters();
  updateMetrics();
  updateCharts();
  refreshMapMarkers();
  closeFormModal();
}

function deleteAset(asetId) {
  const id = asetId || AppState.currentModalAset?.id;
  const aset = AppState.asetList.find(a => a.id === id);
  if (!aset) return;

  if (confirm(`Apakah Anda yakin ingin menghapus data aset "${aset.nama_barang}" (${aset.kode_barang}) dari sistem inventaris?`)) {
    AppState.asetList = AppState.asetList.filter(a => a.id !== id);
    saveData();
    applyFilters();
    updateMetrics();
    updateCharts();
    refreshMapMarkers();
    closeDetailModal();
    showToast("Aset berhasil dihapus dari inventaris BMD.", "info");
  }
}

// ==========================================================================
// QR CODE PRINTING & SCANNING
// ==========================================================================
function printQrLabel(asetId) {
  const id = asetId || AppState.currentModalAset?.id;
  const aset = AppState.asetList.find(a => a.id === id) || AppState.currentModalAset;
  if (!aset) return;

  const printSection = document.getElementById("printSection");
  printSection.innerHTML = `
    <div class="label-aset-print">
      <div class="header-kop">
        <img src="assets/logo-lampung.svg" alt="Logo Lampung">
        <div>
          <div class="instansi">Pemerintah Provinsi Lampung - BPKAD</div>
          <div class="title">LABEL INVENTARIS BARANG MILIK DAERAH</div>
        </div>
      </div>
      <div class="body-info">
        <div id="printQrTarget" class="qr-box"></div>
        <div class="info-list">
          <table>
            <tr><td class="font-bold">Kode:</td><td>${aset.kode_barang}</td></tr>
            <tr><td class="font-bold">NUP:</td><td>${aset.nup}</td></tr>
            <tr><td class="font-bold">Barang:</td><td class="font-bold">${aset.nama_barang}</td></tr>
            <tr><td class="font-bold">Tahun:</td><td>${aset.tahun_perolehan}</td></tr>
            <tr><td class="font-bold">OPD:</td><td>${aset.opd}</td></tr>
          </table>
        </div>
      </div>
      <div class="footer-label">
        <span>Sistem Informasi Aset Daerah Provinsi Lampung</span>
        <span>ID: ${aset.id}</span>
      </div>
    </div>
  `;

  if (typeof QRCode !== "undefined") {
    try {
      new QRCode(document.getElementById("printQrTarget"), {
        text: JSON.stringify({ id: aset.id, kode: aset.kode_barang, nup: aset.nup, nama: aset.nama_barang }),
        width: 72,
        height: 72,
        colorDark: "#000000",
        colorLight: "#ffffff"
      });
    } catch (e) {
      console.warn("QR print error", e);
    }
  }

  setTimeout(() => {
    window.print();
  }, 350);
}

// QR Scanner with Html5Qrcode
function initScanner() {
  const scannerContainer = document.getElementById("qrReader");
  if (!scannerContainer) return;

  try {
    if (typeof Html5Qrcode !== "undefined") {
      if (!AppState.qrScanner) {
        AppState.qrScanner = new Html5Qrcode("qrReader");
      }

      AppState.qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        (errorMessage) => {
          // ignore transient scan errors
        }
      ).catch(err => {
        console.warn("Camera start failed, fallback to file upload:", err);
        document.getElementById("scannerAlert")?.classList.remove("hidden");
      });
    }
  } catch (e) {
    console.error("Scanner init error:", e);
  }
}

function stopScanner() {
  if (AppState.qrScanner && AppState.qrScanner.isScanning) {
    AppState.qrScanner.stop().catch(err => console.warn(err));
  }
}

function handleScanResult(text) {
  let foundId = null;
  try {
    const data = JSON.parse(text);
    if (data.id) foundId = data.id;
  } catch (e) {
    // maybe plain text id or kode
    foundId = text.trim();
  }

  const matched = AppState.asetList.find(a => a.id === foundId || a.kode_barang === foundId || a.nup === foundId);
  if (matched) {
    showToast(`QR Code Cocok: ${matched.nama_barang}`, "success");
    openDetailModal(matched.id);
  } else {
    showToast("Data aset dari QR Code tidak ditemukan dalam database inventaris.", "error");
  }
}

function handleQrFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof Html5Qrcode !== "undefined") {
    const scanner = new Html5Qrcode("qrReaderFileTemp");
    scanner.scanFile(file, true)
      .then(decodedText => {
        handleScanResult(decodedText);
      })
      .catch(err => {
        showToast("Gagal membaca QR Code dari file gambar yang diunggah.", "error");
      });
  }
}

// ==========================================================================
// SERTIFIKASI TANAH & PEMANFAATAN VIEWS
// ==========================================================================
function renderPemanfaatanView() {
  // Pemanfaatan Table
  const tbodySewa = document.getElementById("tablePemanfaatanBody");
  if (tbodySewa) {
    const pemanfaatanItems = AppState.asetList.filter(i => i.status_penggunaan && (i.status_penggunaan.startsWith("Pemanfaatan") || i.status_penggunaan === "Idle / Menganggur"));
    let html = "";
    pemanfaatanItems.forEach((item, idx) => {
      const isIdle = item.status_penggunaan === "Idle / Menganggur";
      html += `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-200 dark:border-slate-800">
          <td class="px-4 py-3 text-xs text-center">${idx + 1}</td>
          <td class="px-4 py-3">
            <div class="font-bold text-xs text-slate-900 dark:text-slate-100">${item.nama_barang}</div>
            <div class="text-[11px] text-slate-500 font-mono">${item.kode_barang}</div>
          </td>
          <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">${item.kabupaten_kota}</td>
          <td class="px-4 py-3 text-xs text-right font-mono font-bold">${formatRupiah(item.nilai_perolehan)}</td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex px-2 py-1 rounded text-xs font-bold ${isIdle ? 'bg-purple-100 text-purple-900 border border-purple-300 badge-pulse' : 'bg-blue-100 text-blue-900'}">
              ${item.status_penggunaan}
            </span>
          </td>
          <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">${item.catatan || '-'}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="openDetailModal('${item.id}')" class="text-xs bg-rose-900 hover:bg-rose-800 text-amber-300 px-2.5 py-1 rounded font-semibold transition">
              Detail
            </button>
          </td>
        </tr>
      `;
    });
    tbodySewa.innerHTML = html;
  }
}

// ==========================================================================
// EXPORT & REPORTING
// ==========================================================================
function exportToExcel() {
  if (typeof XLSX === "undefined") {
    alert("Library SheetJS (XLSX) sedang dimuat. Silakan tunggu beberapa detik dan coba lagi.");
    return;
  }

  const exportData = AppState.filteredList.map((item, index) => ({
    "No": index + 1,
    "ID Aset": item.id,
    "Golongan KIB": `KIB ${item.kategori}`,
    "Kode Barang": item.kode_barang,
    "NUP": item.nup,
    "Nama Barang / Aset": item.nama_barang,
    "Sub Kategori": item.sub_kategori || "",
    "OPD Penanggung Jawab": item.opd,
    "Kabupaten / Kota": item.kabupaten_kota,
    "Alamat Lokasi": item.alamat_lokasi || "",
    "Tahun Perolehan": item.tahun_perolehan,
    "Nilai Perolehan (Rp)": item.nilai_perolehan,
    "Kondisi Fisik": item.kondisi,
    "Status Penggunaan": item.status_penggunaan,
    "Status Sertifikasi Tanah": item.status_sertifikasi || "-",
    "Nomor Dokumen": item.nomor_dokumen || "-",
    "Luas (m²)": item.luas_m2 || 0,
    "Penanggung Jawab": item.penanggung_jawab || "",
    "NIP": item.nip || "",
    "Catatan": item.catatan || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris_BMD_Lampung");

  // Auto column width
  const maxProps = Object.keys(exportData[0] || {}).map(key => ({
    wch: Math.max(key.length, ...exportData.map(d => String(d[key] || '').length).slice(0, 50)) + 3
  }));
  worksheet["!cols"] = maxProps;

  const fileName = `Laporan_BMD_Pemprov_Lampung_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  showToast("File Excel Laporan Aset berhasil diunduh!", "success");
}

function printLaporanResmi() {
  const printSection = document.getElementById("printSection");
  const filtered = AppState.filteredList;
  const totalNilai = filtered.reduce((sum, item) => sum + (Number(item.nilai_perolehan) || 0), 0);

  let rowsHtml = "";
  filtered.forEach((item, idx) => {
    rowsHtml += `
      <tr>
        <td style="border: 1px solid #333; padding: 4px; text-align: center; font-size: 10px;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px;">${item.kode_barang}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px;">${item.nup}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px; font-weight: bold;">${item.nama_barang}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px;">${item.opd}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px;">${item.kabupaten_kota}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px; text-align: center;">${item.kondisi}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10px; text-align: right; font-family: monospace;">${formatRupiah(item.nilai_perolehan)}</td>
      </tr>
    `;
  });

  printSection.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <div style="display: flex; align-items: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px;">
        <img src="assets/logo-lampung.svg" style="width: 60px; height: 70px; margin-right: 16px;">
        <div style="text-align: center; flex: 1;">
          <h3 style="margin: 0; font-size: 14px; letter-spacing: 1px;">PEMERINTAH PROVINSI LAMPUNG</h3>
          <h2 style="margin: 2px 0; font-size: 16px; font-weight: 900;">BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH</h2>
          <p style="margin: 0; font-size: 10px; color: #444;">Jl. Wolter Monginsidi No. 69, Teluk Betung, Bandar Lampung - Telp. (0721) 481103</p>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 13px; text-decoration: underline; text-transform: uppercase;">REKAPITULASI LAPORAN BARANG MILIK DAERAH (BMD)</h4>
        <p style="margin: 4px 0; font-size: 11px;">Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">No</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">Kode Barang</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">NUP</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">Nama Aset</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">OPD Pengguna</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">Kabupaten/Kota</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">Kondisi</th>
            <th style="border: 1px solid #333; padding: 6px; font-size: 10px;">Nilai Perolehan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="7" style="border: 1px solid #333; padding: 6px; text-align: right; font-size: 11px;">TOTAL NILAI REKAPITULASI:</td>
            <td style="border: 1px solid #333; padding: 6px; text-align: right; font-size: 11px; font-family: monospace;">${formatRupiah(totalNilai)}</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
        <div style="text-align: center; width: 220px;">
          <p>Mengetahui,</p>
          <p style="font-weight: bold; margin-bottom: 60px;">Kepala BPKAD Provinsi Lampung</p>
          <p style="font-weight: bold; text-decoration: underline;">Dr. H. M. NASHIR, S.E., M.M.</p>
          <p>NIP. 196803121993031004</p>
        </div>
        <div style="text-align: center; width: 220px;">
          <p>Bandar Lampung, ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
          <p style="font-weight: bold; margin-bottom: 60px;">Pengurus Barang Pengelola</p>
          <p style="font-weight: bold; text-decoration: underline;">FAUZAN ARDIANSYAH, S.STP., M.Si</p>
          <p>NIP. 198205142004121001</p>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    window.print();
  }, 250);
}

function backupDatabaseJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.asetList, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup_simaset_lampung_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Database Aset berhasil di-backup dalam format JSON!", "success");
}

function restoreDatabaseJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed)) {
        AppState.asetList = parsed;
        saveData();
        applyFilters();
        updateMetrics();
        updateCharts();
        refreshMapMarkers();
        showToast("Database aset berhasil dipulihkan dari file JSON!", "success");
      } else {
        showToast("Format file JSON tidak valid.", "error");
      }
    } catch (err) {
      showToast("Gagal membaca file JSON.", "error");
    }
  };
  reader.readAsText(file);
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition transform duration-300 translate-y-2 opacity-0 text-white ${
    type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-slate-800"
  }`;

  const icon = type === "success" ? '<i class="fa-solid fa-circle-check"></i>' : type === "error" ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-info"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.getAttribute("data-tab"));
    });
  });

  // Mobile menu toggle
  document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
    document.getElementById("mobileMenu")?.classList.toggle("hidden");
  });

  // Search input live filtering
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    AppState.searchQuery = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  // Filter dropdowns
  document.getElementById("filterOpd")?.addEventListener("change", (e) => {
    AppState.filterOpd = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  document.getElementById("filterKabKota")?.addEventListener("change", (e) => {
    AppState.filterKabKota = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  document.getElementById("filterKondisi")?.addEventListener("change", (e) => {
    AppState.filterKondisi = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  document.getElementById("filterStatusPenggunaan")?.addEventListener("change", (e) => {
    AppState.filterStatusPenggunaan = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  document.getElementById("filterSertifikasi")?.addEventListener("change", (e) => {
    AppState.filterSertifikasi = e.target.value;
    AppState.currentPage = 1;
    applyFilters();
  });

  // Map filters
  document.getElementById("mapKibFilter")?.addEventListener("change", refreshMapMarkers);
  document.getElementById("mapKabKotaFilter")?.addEventListener("change", (e) => {
    refreshMapMarkers();
    if (e.target.value !== "ALL") {
      zoomToKabupaten(e.target.value);
    }
  });

  // Form submit
  document.getElementById("asetForm")?.addEventListener("submit", saveAsetForm);

  // Form KabKota change
  document.getElementById("formKabKota")?.addEventListener("change", handleKabKotaChange);

  // File upload QR
  document.getElementById("qrFileInput")?.addEventListener("change", handleQrFileUpload);

  // Restore JSON
  document.getElementById("restoreJsonInput")?.addEventListener("change", restoreDatabaseJson);

  // Close modals on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDetailModal();
      closeFormModal();
    }
  });
}

function renderCurrentView() {
  // Setup clock
  const updateClock = () => {
    const clockEl = document.getElementById("headerClock");
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }) + " | " + now.toLocaleTimeString("id-ID");
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}
