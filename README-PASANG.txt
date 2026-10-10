TARSUS FINDER — CINEMATIC UI 4.0.0
==================================

FILE DALAM PAKET
- index.html      Struktur layar, beranda, sidebar, login UI, dan halaman fitur
- style.css       Desain cinematic blue glass dan responsif HP/tablet/PC
- app.js          Navigasi, login UI prototype, pencarian, favorit, riwayat, direktori
- data.js         Mesin data tarif lama dengan tambahan API daftar KA dan tarif per KA
- manifest.json   Konfigurasi PWA
- sw.js           Service worker dan cache versi baru

CARA MEMASANG DI GITHUB PAGES
1. Unduh ZIP ini lalu ekstrak.
2. Unggah ISI folder hasil ekstrak ke root repository tarsus-backup.
3. Pertahankan folder assets milikmu yang sudah ada, khususnya:
   assets/background.jpg
   assets/logo.png
   Jangan menimpa atau menghapus kedua file tersebut.
4. Jangan mengubah ID Google Sheets dan nama sheet MASTER_KA, MASTER_TARIF,
   MASTER_STASIUN. data.js di paket ini mempertahankan koneksi lama.
5. Commit perubahan, tunggu GitHub Pages selesai deploy, lalu buka aplikasi.
6. Jika versi lama masih tampil, tutup aplikasi/PWA sepenuhnya lalu buka ulang.

CATATAN PENTING TENTANG LOGIN
Layar login pada paket ini masih berupa PROTOTIPE ANTARMUKA. ID petugas dipakai
untuk memisahkan favorit dan riwayat di penyimpanan lokal perangkat. Kata sandi
belum diverifikasi oleh server, sehingga login ini TIDAK mengamankan situs publik.
Karena aplikasi ditujukan untuk internal, jangan memasukkan kata sandi kerja yang
sebenarnya dan jangan menganggap aplikasi sudah privat. Sebelum penggunaan internal
produksi, integrasikan autentikasi server (misalnya Firebase Authentication atau
backend perusahaan) dan batasi akses data dengan aturan server yang sesuai.

PENYIMPANAN FAVORIT & RIWAYAT
Disimpan lokal per ID petugas dan per browser/perangkat. Belum disinkronkan antar
perangkat. Menghapus data browser dapat menghapus favorit dan riwayat lokal.

DATABASE
Google Sheets harus dapat dibaca oleh aplikasi. Mesin pencarian tarif yang lama
tetap digunakan; penambahan API hanya membuka daftar kereta dan tarif untuk halaman
baru. Kebenaran hasil tetap mengikuti isi dan status pada spreadsheet.

ASSET
Paket ini sengaja tidak membawa ulang gambar logo/background. Gunakan aset asli
milikmu di assets/logo.png dan assets/background.jpg. Jika path repository-mu
berbeda, sesuaikan path di index.html dan style.css.
