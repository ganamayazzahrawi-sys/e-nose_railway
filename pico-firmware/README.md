# Firmware Pico 2W - E-Nose System

## Cara Upload ke Pico 2W

### 1. Siapkan Thonny
- Buka Thonny IDE
- Hubungkan Pico 2W ke PC via USB
- Pilih interpreter: **MicroPython (Raspberry Pi Pico)**

### 2. Konfigurasi main.py
Buka `main.py` dan ubah bagian ini:

```python
WIFI_SSID     = "NAMA_WIFI_ANDA"      # Ganti dengan SSID WiFi
WIFI_PASSWORD = "PASSWORD_WIFI"       # Ganti dengan password WiFi
SERVER_URL    = "https://YOUR-REPLIT-DOMAIN.replit.app"  # Ganti dengan URL server
```

**SERVER_URL**: 
- Jika pakai Replit: ambil dari URL di browser (contoh: `https://my-app.username.replit.app`)
- Jika jaringan lokal: gunakan IP server (contoh: `http://192.168.1.100`)

### 3. Upload ke Pico
Di Thonny:
1. File → Save As → pilih **Raspberry Pi Pico**
2. Simpan sebagai `main.py`
3. Klik Run atau tekan F5

### 4. Test Koneksi
Setelah upload, Pico akan:
1. Menampilkan layar startup di LCD
2. Menghubungkan ke WiFi
3. Menampilkan IP address jika berhasil
4. Mulai polling perintah dari server setiap 2 detik

## Alur Kerja

```
Web → Buat Sesi → Server menyimpan command "start_session"
                ↓
Pico polling /api/iot/command setiap 2 detik
                ↓
Pico menerima perintah → Purging (pump ON, 10 detik)
                ↓
Pico → Sampling (baca sensor, 5 detik)
                ↓
Pico → Kirim data ke /api/sessions/{id}/sensor-data
                ↓
Web → Tampilkan hasil sensor
```

## Pin Hardware

| Komponen | Pin Pico |
|----------|----------|
| LCD SDA  | GP0      |
| LCD SCL  | GP1      |
| TGS2602  | GP2      |
| Relay Pump | GP14   |
| LED Ready | GP15    |
| MQ-3 ADC | GP26     |
| MQ-4 ADC | GP27     |
| MQ-138 ADC | GP28   |

## Troubleshooting

- **WiFi tidak terhubung**: Cek SSID dan password, pastikan frekuensi 2.4GHz
- **Tidak bisa reach server**: Pastikan SERVER_URL benar, cek firewall
- **LCD tidak tampil**: Cek alamat I2C (default 0x27), cek kabel SDA/SCL
- **Sensor 0 semua**: Tunggu sensor warm-up ±30 detik setelah dinyalakan
