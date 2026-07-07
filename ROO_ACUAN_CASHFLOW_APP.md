# ACUAN ROO - CASHFLOW PERSONAL & ENTERTAINMENT APP

## 1. Tujuan Aplikasi

Bangun aplikasi sederhana untuk mencatat dan mengelola cashflow pribadi dan pengeluaran kantor/entertainment dealer.

Aplikasi hanya digunakan oleh 1 orang, jadi utamakan:

- Fungsional.
- Ringan.
- Mudah digunakan dari HP.
- Gratis atau sebisa mungkin tanpa biaya.
- Tidak perlu workflow approval kompleks.
- Tidak perlu database besar.
- Tidak perlu OCR pada MVP awal.

Stack utama:

- Google Apps Script Web App.
- Google Sheets sebagai database.
- Google Drive untuk penyimpanan foto kwitansi.
- Frontend HTML/CSS/Vanilla JS.

---

## 2. Prinsip Pengerjaan Roo

Roo harus mengerjakan aplikasi secara bertahap dan sempit.

Aturan kerja:

1. Jangan langsung membuat fitur besar sekaligus.
2. Kerjakan satu modul kecil per tahap.
3. Jangan membuat struktur terlalu kompleks.
4. Jangan menambah role approval, multi-user, atau fitur admin yang tidak diminta.
5. Jangan menggunakan framework berat.
6. Jangan menggunakan OCR dulu pada MVP.
7. Jangan mengubah struktur sheet tanpa kebutuhan jelas.
8. Jangan hardcode index kolom. Gunakan header map.
9. Simpan gambar di Google Drive, bukan di Google Sheet.
10. Google Sheet hanya menyimpan data transaksi dan URL foto.
11. Pastikan aplikasi tetap bisa digunakan dari browser HP.

---

## 3. Nama Aplikasi

Nama aplikasi sementara:

```text
CashFlow Personal & Entertainment
```

Boleh ditampilkan di header sebagai:

```text
CashFlow App
```

---

## 4. Menu Utama

Aplikasi cukup memiliki menu utama berikut:

```text
1. Dashboard
2. Tambah
3. Riwayat
4. Report
5. Setting
```

Penjelasan:

### 4.1 Dashboard

Menampilkan ringkasan bulan berjalan:

- Budget kantor bulan ini.
- Total pengeluaran kantor.
- Sisa budget kantor.
- Total pengeluaran pribadi.
- Total seluruh pengeluaran bulan ini.
- Jumlah transaksi kantor.
- Jumlah transaksi pribadi.

### 4.2 Tambah

Berisi dua tombol besar:

```text
[ Kantor / Dealer ]
[ Pribadi ]
```

Jika pilih Kantor / Dealer, tampil form pengeluaran kantor.

Jika pilih Pribadi, tampil form pengeluaran pribadi yang sangat sederhana.

### 4.3 Riwayat

Menampilkan daftar transaksi dengan filter:

- Bulan.
- Tipe: Semua / KANTOR / PRIBADI.
- Keyword pencarian.

### 4.4 Report

Menampilkan rekap:

- Report kantor.
- Report pribadi.
- Total semua transaksi bulan berjalan.

Minimal ada tombol export/copy rekap, jika export file belum dibuat di tahap awal.

### 4.5 Setting

Untuk MVP awal, Setting cukup berisi:

- Budget kantor bulanan.
- Kode area/cabang default untuk claim code.
- Folder Drive kwitansi.

---

## 5. Flow Penggunaan

### 5.1 Flow Pengeluaran Kantor / Dealer

```text
Buka aplikasi
↓
Dashboard
↓
Klik Tambah
↓
Pilih Kantor / Dealer
↓
Isi form pengeluaran kantor
↓
Upload foto kwitansi
↓
Sistem menyimpan foto ke Google Drive
↓
Sistem generate claim code otomatis
↓
Simpan transaksi
↓
Data masuk Riwayat, Dashboard, dan Report Kantor
```

### 5.2 Flow Pengeluaran Pribadi

```text
Buka aplikasi
↓
Klik Tambah
↓
Pilih Pribadi
↓
Isi deskripsi pengeluaran
↓
Isi nominal
↓
Simpan
↓
Data masuk Riwayat, Dashboard, dan Report Pribadi
```

---

## 6. Form Pengeluaran Kantor / Dealer

Field form kantor:

| Field | Wajib | Keterangan |
|---|---:|---|
| Tanggal | Ya | Default hari ini, bisa diedit |
| Kode Dealer / Kode Cabang | Ya | Contoh: 5070001 |
| Nama Dealer | Opsional | Nama dealer/mitra |
| Nama Tempat | Ya | Cafe / rumah makan / lokasi meeting |
| Deskripsi | Ya | Contoh: Meeting dengan PIC dealer |
| Keterangan Tambahan | Ya | Dipakai dalam claim code |
| Nominal | Ya | Angka saja |
| Foto Kwitansi | Ya | Upload foto nota/struk |
| Status | Otomatis | DRAFT / READY / SUBMITTED / APPROVED / REJECTED |

Catatan:

- Jika foto kwitansi belum diupload, status boleh DRAFT.
- Jika data wajib lengkap, status bisa READY.
- OCR tidak dibuat dulu di MVP.

---

## 7. Form Pengeluaran Pribadi

Form pribadi dibuat sangat sederhana.

Field:

| Field | Wajib | Keterangan |
|---|---:|---|
| Tanggal | Ya | Default hari ini |
| Deskripsi Pengeluaran | Ya | Contoh: Beli bensin |
| Nominal | Ya | Angka saja |

Tidak perlu upload kwitansi untuk pengeluaran pribadi pada MVP.

---

## 8. Format Claim Code Baru

Format lama tidak digunakan:

```text
DLR001_JUL26_INT_0001
```

Format baru yang wajib digunakan:

```text
5070001_07_INT_deskripsi tambahan
```

Struktur:

```text
KODEDEALER_BULAN_INT_KETERANGANTAMBAHAN
```

Contoh:

```text
5070001_07_INT_ngopi_pic_dealer
5070001_07_INT_makan_siang_pic
5070001_08_INT_meeting_target
```

Aturan pembuatan claim code:

1. `KODEDEALER` diambil dari input user.
2. `BULAN` menggunakan angka bulan 2 digit dari tanggal transaksi.
   - Januari = 01
   - Februari = 02
   - Juli = 07
   - Desember = 12
3. `INT` adalah kode tetap untuk entertainment.
4. `KETERANGANTAMBAHAN` diambil dari field Keterangan Tambahan.
5. Keterangan tambahan harus disanitasi agar aman untuk kode:
   - Ubah huruf menjadi lowercase.
   - Trim spasi depan/belakang.
   - Ganti spasi dengan underscore.
   - Hapus karakter aneh seperti `/`, `\\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`.
   - Hindari underscore berulang.

Contoh sanitasi:

```text
Input: Ngopi PIC Dealer
Output: ngopi_pic_dealer

Input: Makan Siang / Briefing Target
Output: makan_siang_briefing_target
```

Jika keterangan tambahan kosong, gunakan fallback:

```text
umum
```

Contoh fallback:

```text
5070001_07_INT_umum
```

Catatan penting:

- Karena format baru tidak memakai nomor urut, ada kemungkinan claim code sama jika kode dealer, bulan, dan keterangan sama.
- Untuk mencegah bentrok internal, tetap simpan `TRX_ID` unik otomatis di sheet.
- Claim code mengikuti format permintaan user, sedangkan TRX_ID dipakai sistem untuk identitas unik.

---

## 9. Struktur Google Sheets

Gunakan 1 spreadsheet utama.

Nama spreadsheet:

```text
DB_CASHFLOW_APP
```

Sheet minimal:

```text
TRANSAKSI
SETTING
LOG
```

Jika ingin lebih sederhana, MVP bisa dimulai dari `TRANSAKSI` dan `SETTING` saja.

---

## 10. Sheet TRANSAKSI

Header wajib:

```text
TRX_ID
TANGGAL
BULAN
TIPE
KODE_DEALER
NAMA_DEALER
CLAIM_CODE
NAMA_TEMPAT
DESKRIPSI
KETERANGAN_TAMBAHAN
NOMINAL
FOTO_KWITANSI_URL
FOTO_KWITANSI_FILE_ID
STATUS
CREATED_AT
UPDATED_AT
```

Penjelasan kolom:

| Kolom | Keterangan |
|---|---|
| TRX_ID | ID unik transaksi, dibuat otomatis |
| TANGGAL | Tanggal transaksi |
| BULAN | Format YYYY-MM, contoh 2026-07 |
| TIPE | KANTOR atau PRIBADI |
| KODE_DEALER | Khusus transaksi kantor, contoh 5070001 |
| NAMA_DEALER | Khusus transaksi kantor |
| CLAIM_CODE | Khusus transaksi kantor |
| NAMA_TEMPAT | Khusus transaksi kantor |
| DESKRIPSI | Deskripsi transaksi |
| KETERANGAN_TAMBAHAN | Untuk detail tambahan dan claim code |
| NOMINAL | Nominal transaksi |
| FOTO_KWITANSI_URL | Link file Drive |
| FOTO_KWITANSI_FILE_ID | ID file Drive |
| STATUS | DRAFT / READY / SUBMITTED / APPROVED / REJECTED |
| CREATED_AT | Timestamp dibuat |
| UPDATED_AT | Timestamp update |

Untuk transaksi PRIBADI:

- TIPE = PRIBADI.
- KODE_DEALER boleh kosong.
- NAMA_DEALER boleh kosong.
- CLAIM_CODE boleh kosong.
- NAMA_TEMPAT boleh kosong.
- FOTO_KWITANSI_URL boleh kosong.
- FOTO_KWITANSI_FILE_ID boleh kosong.
- DESKRIPSI dan NOMINAL wajib.

Untuk transaksi KANTOR:

- TIPE = KANTOR.
- KODE_DEALER wajib.
- NAMA_TEMPAT wajib.
- DESKRIPSI wajib.
- KETERANGAN_TAMBAHAN wajib.
- NOMINAL wajib.
- FOTO_KWITANSI_URL wajib untuk status READY.
- CLAIM_CODE dibuat otomatis.

---

## 11. Sheet SETTING

Header:

```text
KEY
VALUE
UPDATED_AT
```

Contoh isi:

| KEY | VALUE |
|---|---|
| BUDGET_KANTOR_BULANAN | 3000000 |
| DRIVE_FOLDER_KWITANSI_ID | isi_id_folder_drive |
| APP_NAME | CashFlow App |

---

## 12. Sheet LOG

Header:

```text
LOG_ID
WAKTU
AKSI
TRX_ID
TIPE
CATATAN
```

Contoh aksi:

- CREATE_KANTOR
- CREATE_PRIBADI
- UPDATE_TRANSAKSI
- DELETE_TRANSAKSI
- SUBMIT_CLAIM

---

## 13. Penyimpanan Foto Kwitansi

Foto kwitansi disimpan ke Google Drive.

Struktur folder rekomendasi:

```text
CASHFLOW_APP_KWITANSI
└── 2026
    └── 07
        ├── 5070001_07_INT_ngopi_pic_dealer.jpg
        └── 5070001_07_INT_makan_siang_pic.jpg
```

Aturan:

1. Jangan simpan gambar langsung di Google Sheet.
2. Simpan file ke Drive.
3. Ambil URL file dan file ID.
4. Simpan URL dan file ID ke sheet TRANSAKSI.
5. Nama file boleh memakai claim code + timestamp agar tidak bentrok.

Contoh nama file yang aman:

```text
5070001_07_INT_ngopi_pic_dealer_20260706_193000.jpg
```

---

## 14. Dashboard Calculation

Dashboard harus menghitung berdasarkan bulan aktif.

Data yang dihitung:

```text
Budget Kantor Bulan Ini = SETTING.BUDGET_KANTOR_BULANAN
Total Kantor = SUM NOMINAL WHERE TIPE = KANTOR AND BULAN = bulan aktif
Sisa Budget Kantor = Budget Kantor - Total Kantor
Total Pribadi = SUM NOMINAL WHERE TIPE = PRIBADI AND BULAN = bulan aktif
Total Semua = Total Kantor + Total Pribadi
Jumlah Transaksi Kantor = COUNT TIPE KANTOR bulan aktif
Jumlah Transaksi Pribadi = COUNT TIPE PRIBADI bulan aktif
```

Tampilkan warning jika:

- Sisa budget kantor kurang dari 20%.
- Pengeluaran kantor melebihi budget.

---

## 15. Status Transaksi

Gunakan status sederhana:

| Status | Arti |
|---|---|
| DRAFT | Data belum lengkap |
| READY | Siap klaim |
| SUBMITTED | Sudah diajukan ke sistem kantor |
| APPROVED | Klaim disetujui |
| REJECTED | Klaim ditolak/perlu revisi |

Untuk transaksi pribadi, status default bisa:

```text
PRIVATE_RECORDED
```

Atau agar sederhana, tetap gunakan:

```text
READY
```

Rekomendasi MVP:

- KANTOR lengkap = READY.
- KANTOR belum lengkap = DRAFT.
- PRIBADI = READY.

---

## 16. Tampilan UI yang Diinginkan

Aplikasi digunakan dari HP, jadi buat UI mobile-first.

Karakter UI:

- Simple.
- Compact.
- Tombol besar dan jelas.
- Form tidak terlalu panjang.
- Warna profesional.
- Tidak banyak animasi.
- Tidak perlu sidebar besar.

Layout mobile rekomendasi:

```text
Header: CashFlow App
Card ringkasan dashboard
Bottom navigation: Dashboard | Tambah | Riwayat | Report | Setting
```

Pada menu Tambah:

```text
Pilih Jenis Pengeluaran

[ Kantor / Dealer ]
[ Pribadi ]
```

---

## 17. Backend Function Minimal

Buat function backend Apps Script minimal berikut:

```javascript
getDashboardData(month)
getTransactions(filter)
createOfficeTransaction(payload)
createPersonalTransaction(payload)
updateTransaction(trxId, payload)
deleteTransaction(trxId)
getSettings()
updateSettings(payload)
uploadReceipt(base64File, fileName, claimCode)
generateClaimCode(payload)
```

Catatan:

- Gunakan header map untuk membaca/menulis kolom.
- Validasi nominal harus angka dan lebih dari 0.
- Validasi tanggal wajib valid.
- Validasi transaksi kantor lebih ketat daripada pribadi.
- Semua response backend gunakan format konsisten.

Contoh response sukses:

```javascript
{
  ok: true,
  data: {},
  message: 'Berhasil disimpan'
}
```

Contoh response error:

```javascript
{
  ok: false,
  message: 'Nominal tidak valid'
}
```

---

## 18. Validasi Payload

### 18.1 Payload Kantor

Wajib:

```text
tanggal
kodeDealer
namaTempat
deskripsi
keteranganTambahan
nominal
fotoKwitansi
```

Opsional:

```text
namaDealer
```

### 18.2 Payload Pribadi

Wajib:

```text
tanggal
deskripsi
nominal
```

---

## 19. Tahapan Pengerjaan MVP

Kerjakan bertahap.

### Phase 1 - Setup Foundation

- Buat project Apps Script.
- Buat file utama backend.
- Buat HTML shell.
- Buat sheet TRANSAKSI, SETTING, LOG jika belum ada.
- Buat helper header map.
- Buat helper response success/error.

### Phase 2 - Dashboard

- Ambil data bulan berjalan.
- Hitung total kantor.
- Hitung total pribadi.
- Hitung sisa budget.
- Render dashboard card.

### Phase 3 - Tambah Pengeluaran Pribadi

- Buat form pribadi.
- Simpan ke sheet TRANSAKSI.
- Tampilkan di riwayat.
- Update dashboard.

Prioritaskan pribadi dulu karena form paling sederhana.

### Phase 4 - Tambah Pengeluaran Kantor

- Buat form kantor.
- Generate claim code.
- Simpan transaksi kantor tanpa upload dulu jika perlu.
- Validasi data wajib.

### Phase 5 - Upload Kwitansi

- Upload foto ke Google Drive.
- Simpan URL dan file ID ke sheet.
- Nama file menggunakan claim code + timestamp.

### Phase 6 - Riwayat dan Report

- Buat filter bulan.
- Filter tipe transaksi.
- Tampilkan list transaksi.
- Buat report kantor.
- Buat report pribadi.

### Phase 7 - Setting

- Ubah budget kantor bulanan.
- Simpan folder Drive ID.

---

## 20. Hal yang Tidak Dikerjakan di MVP

Jangan kerjakan dulu:

- OCR kwitansi.
- Approval atasan.
- Multi-user role.
- Export PDF kompleks.
- Grafik terlalu banyak.
- Integrasi ke sistem kantor.
- Database eksternal.
- WhatsApp notification.
- Email otomatis.

Semua fitur tersebut bisa masuk tahap lanjutan setelah MVP stabil.

---

## 21. Contoh Data Transaksi

```text
TRX_ID: TRX-20260706-193000-001
TANGGAL: 2026-07-06
BULAN: 2026-07
TIPE: KANTOR
KODE_DEALER: 5070001
NAMA_DEALER: Dealer A
CLAIM_CODE: 5070001_07_INT_ngopi_pic_dealer
NAMA_TEMPAT: Kopi Kenangan
DESKRIPSI: Ngopi dengan PIC dealer bahas target bulanan
KETERANGAN_TAMBAHAN: Ngopi PIC Dealer
NOMINAL: 200000
FOTO_KWITANSI_URL: https://drive.google.com/...
FOTO_KWITANSI_FILE_ID: abc123
STATUS: READY
CREATED_AT: 2026-07-06 19:30:00
UPDATED_AT: 2026-07-06 19:30:00
```

```text
TRX_ID: TRX-20260706-200000-002
TANGGAL: 2026-07-06
BULAN: 2026-07
TIPE: PRIBADI
KODE_DEALER:
NAMA_DEALER:
CLAIM_CODE:
NAMA_TEMPAT:
DESKRIPSI: Beli bensin
KETERANGAN_TAMBAHAN:
NOMINAL: 50000
FOTO_KWITANSI_URL:
FOTO_KWITANSI_FILE_ID:
STATUS: READY
CREATED_AT: 2026-07-06 20:00:00
UPDATED_AT: 2026-07-06 20:00:00
```

---

## 22. Target Akhir MVP

Aplikasi MVP dianggap selesai jika sudah bisa:

1. Membuka dashboard.
2. Menampilkan budget kantor bulan berjalan.
3. Menampilkan total kantor, pribadi, dan total semua.
4. Menambah pengeluaran pribadi.
5. Menambah pengeluaran kantor.
6. Generate claim code format baru:

```text
5070001_07_INT_deskripsi_tambahan
```

7. Upload foto kwitansi kantor ke Drive.
8. Menyimpan URL kwitansi ke sheet.
9. Melihat riwayat transaksi.
10. Melihat report kantor dan pribadi.

---

## 23. Catatan Akhir Untuk Roo

Bangun aplikasi ini secara pragmatis.

Fokus pada hasil:

- User bisa catat uang keluar dengan cepat.
- User bisa membedakan pengeluaran kantor dan pribadi.
- User bisa melihat sisa budget kantor.
- User bisa menyimpan foto kwitansi.
- User bisa mengambil data klaim kantor dengan format rapi.

Jangan over-engineering.

