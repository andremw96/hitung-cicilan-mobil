# Simulasi Kredit Mobil

Kalkulator simulasi kredit kendaraan berbasis web untuk menghitung cicilan, down payment, dan total biaya pembiayaan. Dibangun dengan React + TypeScript + Tailwind CSS.

## Fitur

### Kalkulator
- Hitung cicilan bulanan dengan metode ADDM (flat rate)
- 3 mode down payment: persentase, nominal, atau target total DP (reverse-calculate)
- 3 mode asuransi: % total dari OTR, % per tahun, atau nominal Rupiah
- Input fleksibel untuk rate fix, tenor, administrasi, credit life, TJH, dan capitalize on risk
- Ringkasan bayar pertama dan total uang keluar selama masa kredit

### Simpan & Kelola
- Simpan simulasi ke browser (localStorage) dengan nama
- Edit simulasi tersimpan atau simpan sebagai salinan baru
- Cari dan urutkan simulasi berdasarkan tanggal, nama, OTR, cicilan, total DP, atau total keluar
- Hapus simulasi dengan konfirmasi

### Perbandingan
- Bandingkan 2 atau lebih simulasi dalam satu tabel
- Edit parameter langsung di tabel perbandingan, hasil otomatis terhitung
- Label "Terbaik" pada nilai paling menguntungkan di setiap baris
- Ringkasan selisih antara 2 simulasi (cicilan, total DP, grand total)

## Tech Stack

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 6
- [Tailwind CSS](https://tailwindcss.com/) 3
- [React Router](https://reactrouter.com/) 7

## Getting Started

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

## Build

```bash
npm run build
npm run preview
```

## Struktur Halaman

| Path | Halaman | Keterangan |
|------|---------|------------|
| `/` | Kalkulator | Input parameter dan lihat hasil simulasi |
| `/saved` | Tersimpan | Daftar simulasi yang sudah disimpan |
| `/compare?ids=...` | Bandingkan | Perbandingan simulasi side-by-side |

## Rumus

**Cicilan (ADDM / flat rate):**

```
Plafon = (OTR - DP Murni) + Capitalize on Risk
Cicilan = Plafon × (1 + Rate × Tenor_tahun) / Tenor_bulan
```

**Reverse DP (dari total bayar pertama):**

```
K = (1 + Rate × Tahun) / Bulan
DP Murni = (Total - OTR×K - CoR×K - Asuransi - Admin - CreditLife - TJH) / (1 - K)
```

## Lisensi

MIT
