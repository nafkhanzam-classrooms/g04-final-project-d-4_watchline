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

Data yang butuh akses cepat disimpan di memory. Data yang perlu bertahan lama (akun, histori chat) disimpan di database.

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
