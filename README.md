# ARM CLASH 3D 🏆
### Game Panco 3D Online (First-Person Perspective) dengan Auto Match, Undang Teman, dan Bot AI

Arm Clash 3D adalah game web panco (arm wrestling) 3D multiplayer real-time bergaya modern yang dapat dimainkan langsung melalui browser tanpa perlu registrasi atau login akun.

---

## Fitur Utama

1. **First-Person Perspective (FPP) 3D Gameplay:**
   - Sudut pandang orang pertama melihat lengan kanan pemain beradu kekuatan di atas meja panco turnamen.
   - Karakter lawan di seberang meja memiliki model 3D lengkap (kepala, ekspresi wajah, rambut, tubuh, kaos atletik, dan pose bertanding).
   - Kinematika lengan prosedural (Inverse Kinematics): siku terkunci di bantalan meja dan telapak tangan saling menggenggam erat tanpa terlepas atau melayang.
   - Lingkungan taman kota 3D di siang hari (pepohonan variatif, rumput, jalan setapak, bangku taman, lampu taman, gedung kota, pencahayaan matahari, dan bayangan realistis).

2. **Mekanik Timing Needle Minigame:**
   - Dial sirkular dengan jarum berputar dan target area berwarna acak.
   - Arah putaran jarum berganti setiap ronde: berputar searah jarum jam (↻), kemudian berganti berlawanan arah (↺) secara konsisten.
   - Dynamic Difficulty: seiring streak dan ronde meningkat, kecepatan jarum bertambah dan area target menyempit.
   - Input: Tombol `SPACE`, `ENTER`, atau tap tombol **"TARIK!"** di layar (ramah sentuhan di ponsel / tablet).

3. **Sistem Kekuatan & Kemenangan Pin:**
   - Timing tepat: `+1 Kekuatan` & momentum bertambah.
   - Timing meleset: `-1 Kekuatan`.
   - Lengan kedua pemain bergeser secara mulus sesuai momentum kekuatan.
   - Kemenangan pin diraih ketika tangan lawan terhempas ke bantalan meja, memicu efek dentuman, partikel hentakan, kamera dramatis, dan confetti kemenangan.

4. **3 Mode Permainan:**
   - **Auto Match (Matchmaking Online):** Masuk antrean matchmaking real-time via Socket.IO, dipasangkan otomatis dengan pemain lain yang aktif, hitung mundur bersama, dan bertanding di arena yang sama.
   - **Undang Teman (Custom Room Link):** Buat room privat dengan 6 digit kode unik (misal: `ARM921`), salin link undangan (`?room=ARM921`), dan teman dapat langsung masuk tanpa login.
   - **Lawan Bot (AI Offline):** Bertanding instan melawan bot dengan 3 tingkat kesulitan:
     - **Easy (Pemula):** Bot sering melakukan kesalahan timing (~44% akurasi).
     - **Normal (Seimbang):** Tantangan pas dan realistis (~72% akurasi).
     - **Hard (Master):** Kecepatan dan ketepatan tinggi (~88% akurasi).

5. **Audio & Efek Suara Prosedural:**
   - Disintesis langsung melalui Web Audio API murni (tanpa ketergantungan file MP3 eksternal yang rawan 404).
   - Suara kicau burung taman, bunyi hit/chime jarum, bunyi buzz kesalahan, derit beban meja/otot, hantaman meja saat pin, serta musik kemenangan/kekalahan.
   - Pengaturan mute dan kontrol volume audio.

---

## Struktur Folder

```
panco-game/
├── package.json               # Skrip orkestrasi root (npm run dev, build, start)
├── client/                    # Frontend (React 19 + Vite + Three.js + Socket.IO Client)
│   ├── index.html             # HTML entry & font Outfit / Bebas Neue
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx            # State utama, Socket.IO listener, alur game
│       ├── index.css          # Styling tema atletik, glassmorphism, animasi
│       ├── main.jsx
│       ├── audio/
│       │   └── SoundManager.js # Synthesizer Web Audio API lengkap
│       ├── bot/
│       │   └── BotEngine.js    # AI Bot dengan 3 tingkat kesulitan
│       ├── components/
│       │   ├── HomeScreen.jsx       # Menu utama, profil nama, tombol mode
│       │   ├── TimingNeedle.jsx     # Gauge jarum melingkar & deteksi input
│       │   ├── HUD.jsx              # Bar tug-of-war momentum panco
│       │   ├── MatchmakingModal.jsx # Radar animasi pencarian lawan
│       │   ├── InviteModal.jsx      # Pembuatan kode & salin link undangan
│       │   └── ResultModal.jsx      # Layar kemenangan/kekalahan + statistik
│       └── three/
│           ├── SceneManager.js      # WebGL renderer, loop animasi, kamera
│           ├── ParkEnvironment.js  # Taman 3D, pohon, rumput, gedung, awan
│           ├── ArmTable.js          # Meja panco turnamen, bantalan siku, peg
│           ├── ArmWrestlers.js      # Lengan FPP, karakter lawan, IK panco
│           └── ParticleSystem.js    # Partikel debu, kilatan pin, keringat
└── server/                    # Backend (Node.js + Express + Socket.IO)
    ├── package.json
    ├── server.js              # Server HTTP & penyedia file statis produksi
    └── gameManager.js         # Antrean matchmaking & sinkronisasi ronde
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js versi 18 ke atas (disarankan versi LTS atau v20+).
- npm versi 9 ke atas.

### 1. Instalasi Seluruh Dependensi
Jalankan perintah ini di direktori utama:
```bash
npm run install:all
```
*Atau secara manual:*
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Menjalankan Mode Pengembangan (Dev Server)
Untuk menjalankan backend server (port 3001) dan frontend Vite dev server (port 5173) secara bersamaan:
```bash
npm run dev
```
Buka browser di: **`http://localhost:5173`**

### 3. Menjalankan Mode Produksi (Single Service)
Untuk mem-build frontend dan menjalankannya langsung melalui server Express:
```bash
npm run build
npm start
```
Buka browser di: **`http://localhost:3001`**

---

## Konfigurasi Environment Variable

Secara default, aplikasi berjalan tanpa konfigurasi tambahan. Jika diperlukan, Anda dapat mengatur:

| Variabel | Default | Keterangan |
| :--- | :--- | :--- |
| `PORT` | `3001` | Port untuk server backend Node.js / Express |

---

## Panduan Deployment ke Hosting

### Opsi 1: Render / Railway / Fly.io / VPS (Full-Stack All-in-One)
Backend Express sudah dikonfigurasi untuk menyajikan bundle statis `client/dist` jika sudah di-build, sekaligus menangani koneksi WebSocket Socket.IO.

1. **Build Command:**
   ```bash
   npm run install:all && npm run build
   ```
2. **Start Command:**
   ```bash
   npm start
   ```

### Opsi 2: Frontend di Vercel/Netlify + Backend di Render/Railway
1. **Deploy Backend (Render):**
   - Masukkan direktori `server`.
   - Command: `npm install && npm start`.
   - Dapatkan URL backend (misal: `https://arm-clash-server.onrender.com`).
2. **Deploy Frontend (Vercel):**
   - Root direktori: `client`.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Di `client/src/App.jsx`, arahkan Socket.IO URL ke URL backend yang dideploy.

---

## Lisensi & Hak Cipta
Dibuat untuk **Arm Clash 3D** - Siap dimainkan dan dikembangkan lebih lanjut.
