[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/4SHtB1vz)

## Anggota Kelompok

| Nama                    | NRP        | Kelas |
| ----------------------- | ---------- | ----- |
| Farras Nazhif Pratikno  | 5025241260 | D     |
| Mohammad Najib Bahrudin | 5025241230 | D     |
| Raziq Danish Safaraz    | 5025241258 | D     |

---

## Pendahuluan

### Deskripsi dan Tujuan Project

WatchLine adalah server untuk nonton bareng secara real-time. Beberapa pengguna bisa masuk ke satu room, dan video yang mereka tonton akan tersinkronisasi.

Sebagai contoh, kalau satu orang menekan play, semua ikut play. Ada juga fitur chat room dan direct message.

Semua komunikasi berjalan lewat satu koneksi WebSocket. Server dibangun dengan Python (`asyncio` + `websockets`), dan data disimpan di PostgreSQL.

---

## Arsitektur

### Design Arsitektur

Kode dipisah menjadi empat lapisan:

| Komponen      | Deskripsi                                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **main.py**   | Menerima koneksi WebSocket, mem-parsing pesan JSON, lalu mengarahkan ke handler yang sesuai berdasarkan field `type`.                                                                                                                                          |
| **handlers/** | Setiap file menangani satu domain fitur: validasi input, pemanggilan service, dan pengiriman respons ke client.                                                                                                                                                |
| **services/** | Berisi logika inti yang tidak bergantung pada protokol transport. Session, keanggotaan room, dan interaksi database.                                                                                                                                           |
| **db.py**     | saat server pertama kali jalan, db.py membuat tabel users, rooms, room_members, dan messages kalau belum ada serta menyediakan fungsi query seperti `execute` (untuk INSERT/UPDATE/DELETE), `fetchone` (ambil satu baris), dan `fetchall` (ambil semua baris). |

### Flow Arsitektur

![Flow Arsitektur](/docs/architecture.webp)

### Skema Database

![Skema Database](/docs/db-schema.webp)

Tabel `users` menyimpan akun, `rooms` untuk daftar room, `room_members` untuk keanggotaan room, dan `messages` untuk histori chat termasuk DM.

---

## Implementasi Jaringan

Server menggunakan WebSocket karena membutuhkan komunikasi dua arah secara real-time. Kalau menggunakan HTTP biasa, client harus terus-menerus melakukan polling ke server. Dengan WebSocket, koneksi tetap terbuka dan server bisa mengirim data kapanpun. Hal ini sangat sesuai dengan project kami terutama fitur chat dan sinkronisasi video.

WebSocket juga berfungsi untuk membuat koneksi dua arah secara real-time pada platform **web**.

### Protokol Level Aplikasi

Semua komunikasi antara client dan server menggunakan pesan JSON melalui satu koneksi WebSocket. Field `type` berfungsi sebagai penanda aksi yang diminta.

**Autentikasi:**

```json
{"type": "REGISTER", "username": "user1", "password": "pass123"}
{"type": "AUTH_OK", "token": "abc123...", "username": "user1"}
```

```json
{"type": "LOGIN", "username": "user1", "password": "pass123"}
{"type": "AUTH_OK", "token": "abc123...", "username": "user1"}
```

```json
{"type": "LOGOUT", "token": "abc123..."}
{"type": "LOGOUT_OK"}
```

```json
{"type": "RECONNECT", "token": "abc123..."}
{"type": "AUTH_OK", "token": "abc123...", "username": "user1"}
```

**Manajemen Room:**

```json
{"type": "ROOM_CREATE", "name": "movie-night"}
{"type": "ROOM_CREATE", "room_id": 1, "name": "movie-night"}
```

```json
{"type": "ROOM_JOIN", "roomId": 1}
{"type": "ROOM_JOIN", "roomId": 1}
```

```json
{"type": "ROOM_LIST"}
{"type": "ROOM_LIST_RESP", "rooms": [{"id": 1, "name": "movie-night", "owner_id": 1}]}
```

**Chat:**

```json
{"type": "CHAT_SEND", "roomId": 1, "content": "Hello!"}
{"type": "CHAT_MSG", "roomId": 1, "username": "user1", "content": "Hello!"}
```

```json
{"type": "CHAT_DM", "target": "user2", "content": "Hai, ini private"}
{"type": "CHAT_DM", "from": "user1", "to": "user2", "content": "Hai, ini private"}
```

**Sinkronisasi Video:**

```json
{"type": "VIDEO_SYNC", "roomId": 1, "event": "play", "videoTime": 42.5, "videoUrl": "https://..."}
{"type": "VIDEO_STATE", "roomId": 1, "username": "user1", "event": "play", "videoTime": 42.5, "videoUrl": "https://..."}
```

**Visualisasi Komunikasi Protokol:**

![Visualisasi Komunikasi Protokol](/docs/protocol.webp)

### Pola Komunikasi

| Pola                    | Tipe                          | Cara Kerja                                             |
| ----------------------- | ----------------------------- | ------------------------------------------------------ |
| Request-Response        | Login, buat room, list room   | Server membalas hanya ke socket pengirim               |
| Broadcast (1-ke-banyak) | Chat room, sinkronisasi video | Server mengirim ke semua member di `_members[room_id]` |
| Unicast (1-ke-1)        | Direct message                | Server mencari socket target dari dict `clients`       |

### I/O Multiplexing

Server menggunakan event loop dari `asyncio`. Di balik layar, `asyncio` memanfaatkan modul `selectors` untuk memilih mekanisme I/O multiplexing yang tersedia di OS:

| Sistem Operasi | Selector                 |
| -------------- | ------------------------ |
| Linux (Docker) | epoll                    |
| macOS          | kqueue                   |
| Windows        | IOCP (ProactorEventLoop) |
| Fallback       | poll / select            |

> Alasan kenapa kami memilih menggunakan `asyncio` adalah karena kami sebenarnya ingin menggunakan epoll untuk mekanisme utama kami. Namun, untuk mempermudah proses development di local/device kami, kami memakai `asyncio` agar lebih fleksibel.

---

## Stabilitas Sistem

### Kelengkapan Sistem

| Mekanisme           | Penjelasan                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Retry koneksi DB    | `db.get_conn()` mencoba koneksi ke PostgreSQL hingga 10 kali dengan interval 2 detik. Hal ini berguna saat startup karena database mungkin belum siap. |
| Docker healthcheck  | Perintah `pg_isready` memastikan container server baru berjalan setelah PostgreSQL benar-benar menerima koneksi.                                       |
| Graceful disconnect | `on_connect()` menggunakan `try/finally` sehingga meski client disconnect tiba-tiba, state tetap dibersihkan dari `clients` dan `_members`.            |
| Isolasi error       | `send_msg()` menangkap exception `ConnectionClosed`. Kalau satu socket mati, broadcast ke user lain tetap berjalan.                                    |
| Validasi JSON       | Pesan yang bukan JSON valid dibalas dengan pesan error tanpa memutus koneksi.                                                                          |
| Auth guard          | Semua pesan selain auth ditolak jika client belum login.                                                                                               |

### Concurrency

```python
async for message in ws:           # Tunggu pesan masuk (baru ke event lain)
    await route_message(ws, msg)   # Proses pesan
```

Saat memakai await, event loop akan menajalankan event lain semisal ada koneksi yang lambat. Maka, Satu thread cukup untuk menangani ratusan koneksi bersamaan karena tidak ada event yang akan mem-block. Dengan kata lain, mereka hanya menunggu giliran.

Sebagai contoh, semisal ada dua 2 koneksi (koneksi A dan B). Jika koneksi A mengakses server dengan lambat, server tidak akan menunggu hingga koneksi A merespon. Namun, langsung lanjut ke koneksi B.

Oleh karena itu:

**Tidak ada race condition**. Semua state (clients, \_members, \_sessions) diakses dari satu thread, sehingga tidak diperlukan locking atau mekanisme sinkronisasi tambahan.

**Broadcast non-blocking**. asyncio.ensure_future(send(obj, msg)) mengirim pesan ke semua member room tanpa menunggu satu pengiriman selesai sebelum melanjutkan ke berikutnya.

**Isolasi koneksi**. Setiap koneksi WebSocket berjalan di thread-nya sendiri. Client yang lambat merespons tidak menghalangi client lain.

### Manajemen State

| State                  | Penyimpanan                  | Umur                              |
| ---------------------- | ---------------------------- | --------------------------------- |
| Koneksi aktif          | Dict `clients` (in-memory)   | Hilang saat server mati           |
| Token sesi             | Dict `_sessions` (in-memory) | Hilang saat server mati           |
| Member online di room  | Dict `_members` (in-memory)  | Hilang saat server mati           |
| Users, rooms, messages | PostgreSQL                   | Persisten walaupun server restart |

Dataa yang butuh akses cepat disimpan di memory. Data yang perlu bertahan lama (akun, histori chat) disimpan di database.

---

## Pengujian Performa dan Beban Server

Pengujian dilakukan dengan menggunakan script yang ada di dalam folder `/tests`.

### Pengujian Latency

Pengujian latency dilakukan untuk mengukur waktu _round-trip_ antara client dan server. Pada pengujian ini, client secara berulang mengirimkan request `ROOM_LIST` dan mengukur waktu yang dibutuhkan hingga server memberikan respons.

Pengujian dilakukan sebanyak 100 iterasi. Adapun hasil dari pengujian adalah sebagai berikut:

| Parameter       | Nilai   |
| --------------- | ------- |
| Jumlah Sampel   | 100     |
| Rata-rata       | 0,45 ms |
| Minimum         | 0,29 ms |
| Maksimum        | 1,43 ms |
| Median (P50)    | 0,38 ms |
| P95             | 0,73 ms |
| P99             | 0,93 ms |
| Standar Deviasi | 0,17 ms |

Hasil pengujian menunjukkan bahwa server mampu memberikan respons dengan sangat cepat. Nilai rata-rata latency sebesar 0,45 ms menunjukkan bahwa komunikasi antara client dan server berlangsung hampir tanpa jeda yang signifikan.

Selain itu, nilai P95 sebesar 0,73 ms dan P99 sebesar 0,93 ms menunjukkan bahwa sebagian besar request memperoleh respons dalam waktu kurang dari 1 ms. Standar deviasi yang rendah mengindikasikan bahwa performa server relatif stabil dan konsisten selama pengujian berlangsung.

### Pengujian Connection Rate

Pengujian _connection rate_ dilakukan untuk mengukur kemampuan server dalam menerima koneksi baru dan melakukan proses autentikasi pengguna secara berulang dalam waktu singkat.

Pada skenario ini dilakukan 200 koneksi secara berturut-turut dengan proses registrasi pengguna. Adapun hasil dari pengujian adalah sebagai berikut:

| Parameter       | Nilai               |
| --------------- | ------------------- |
| Jumlah Koneksi  | 200                 |
| Durasi          | 0,40 detik          |
| Connection Rate | 496,5 koneksi/detik |

Hasil pengujian menunjukkan bahwa server mampu menerima hampir 500 koneksi baru setiap detik. Nilai ini menunjukkan bahwa mekanisme asynchronous yang digunakan pada server berhasil mengurangi overhead yang umumnya muncul pada model _thread-per-client_.

### Pengujian Beban

Pengujian beban dilakukan untuk mengetahui kemampuan server dalam menangani banyak client yang aktif secara bersamaan.

Dalam skenario ini terdapat 100 client yang bergabung ke room yang sama. Masing-masing client mengirimkan 20 pesan chat sehingga total terdapat 2.000 pesan yang harus diproses dan didistribusikan oleh server. Adapun hasil dari pengujian adalah sebagai berikut:

| Parameter         | Nilai             |
| ----------------- | ----------------- |
| Jumlah Client     | 100               |
| Pesan per Client  | 20                |
| Total Pesan       | 2.000             |
| Error             | 0                 |
| Durasi            | 12,16 detik       |
| Throughput        | 164,4 pesan/detik |
| Rata-rata Latency | 16,86 ms          |
| P50               | 2,30 ms           |
| P95               | 28,49 ms          |
| P99               | 981,78 ms         |

Server berhasil memproses seluruh 2.000 pesan tanpa menghasilkan error. Throughput sebesar 164,4 pesan per detik menunjukkan bahwa sistem mampu menangani lalu lintas komunikasi yang cukup tinggi untuk aplikasi watch party skala kecil hingga menengah.

Nilai rata-rata latency sebesar 16,86 ms masih berada pada kategori yang baik untuk aplikasi komunikasi real-time. Namun terdapat lonjakan latency pada persentil P99 yang mencapai 981,78 ms.

Lonjakan tersebut terjadi karena seluruh client berada pada room yang sama sehingga setiap pesan yang diterima server harus dibroadcast ke banyak client secara bersamaan. Kondisi ini menyebabkan meningkatnya beban event loop dan proses _fan-out_ pesan pada saat lalu lintas komunikasi mencapai puncaknya.

Meskipun demikian, tidak ditemukan kegagalan pengiriman pesan maupun error selama pengujian berlangsung.

### Pengujian Broadcast Fan-Out

Pengujian ini dilakukan untuk mengukur waktu yang dibutuhkan server dalam mendistribusikan satu pesan ke seluruh anggota room.

Pada pengujian ini terdapat 50 penerima dalam satu room dan pengujian dilakukan sebanyak 10 kali. Adapun hasil dari pengujian adalah sebagai berikut:

| Parameter       | Nilai   |
| --------------- | ------- |
| Jumlah Penerima | 50      |
| Jumlah Putaran  | 10      |
| Rata-rata       | 2,21 ms |
| Minimum         | 2,04 ms |
| Maksimum        | 2,72 ms |
| P95             | 2,72 ms |

Hasil pengujian menunjukkan bahwa server mampu mendistribusikan satu pesan ke 50 client hanya dalam waktu rata-rata 2,21 ms. Nilai ini menunjukkan bahwa mekanisme broadcast yang diterapkan sangat efisien untuk kebutuhan aplikasi komunikasi real-time.

Perbedaan antara nilai minimum dan maksimum relatif kecil sehingga dapat disimpulkan bahwa performa distribusi pesan cukup stabil meskipun jumlah penerima cukup banyak.

---

## Kendala dan Solusi

### Kendala

Kami sebelumnya menggunakan library socket. Namun, saat mengintegrasikannya dengan frontend, jaringan tidak dapat terhubung

### Solusi

Solusinya adalah menggunakan library WebSocket untuk mengintegrasikan socket untuk platform **web**

---

## Cara Menjalankan

### Docker Compose

```bash
docker compose up --build
```

Perintah ini menjalankan PostgreSQL dan server WebSocket di port 8080.

### Dengan TLS

Untuk koneksi terenkripsi (`wss://`):

```bash
chmod +x generate_certs.sh
./generate_certs.sh
docker compose up --build
```

Server mendeteksi sertifikat di `server/certs/` secara otomatis dan mengaktifkan mode TLS.

### Environment Variables

| Variable      | Default            | Keterangan           |
| ------------- | ------------------ | -------------------- |
| `SERVER_HOST` | `0.0.0.0`          | Alamat bind server   |
| `SERVER_PORT` | `8080`             | Port yang digunakan  |
| `DB_HOST`     | `localhost`        | Host PostgreSQL      |
| `DB_PORT`     | `5432`             | Port PostgreSQL      |
| `DB_NAME`     | `watchline`        | Nama database        |
| `DB_USER`     | `watchline`        | User database        |
| `DB_PASS`     | `watchline`        | Password database    |
| `TLS_CERT`    | `certs/server.crt` | Path sertifikat TLS  |
| `TLS_KEY`     | `certs/server.key` | Path private key TLS |
