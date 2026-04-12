# Workspace

## Overview

Sistem E-Nose IoT terintegrasi untuk deteksi diabetes melalui analisis napas. Pico 2W terhubung WiFi dan berkomunikasi dengan server via HTTP.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, recharts, react-hook-form

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── e-nose/             # React frontend web app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pico-firmware/          # MicroPython firmware untuk Raspberry Pi Pico 2W
│   ├── main.py             # Firmware utama (WiFi HTTP client)
│   └── README.md           # Panduan upload dan konfigurasi
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## E-Nose System Architecture

### Alur Kerja IoT
1. User input data responden di web (nama, usia, gender, status diabetes)
2. User buat sesi baru → server simpan perintah `start_session`
3. Pico 2W polling `GET /api/iot/command` setiap 2 detik
4. Pico terima perintah → jalankan fase purging (pompa bersihkan chamber)
5. Pico jalankan fase sampling (baca sensor selama 5 detik)
6. Pico kirim data sensor ke `POST /api/sessions/{id}/sensor-data`
7. Web tampilkan hasil: MQ3 Alcohol PPM, MQ4 Methane PPM, MQ138 Acetone PPM, TGS2602 VOC

### Sensor
- **MQ-3**: Alkohol/Etanol (PPM) 
- **MQ-4**: Metana (PPM)
- **MQ-138**: Aseton - sangat relevan untuk deteksi diabetes (PPM)
- **TGS-2602**: VOC (Volatile Organic Compounds)

### API Endpoints
- `GET/POST /api/respondents` - Manajemen data responden
- `GET /api/respondents/:id` - Detail responden dengan semua sesi
- `GET/POST /api/sessions` - Manajemen sesi sampling
- `POST /api/sessions/:id/sensor-data` - Upload data sensor dari Pico
- `GET /api/iot/command` - Pico poll perintah (juga update lastSeen)
- `GET/POST /api/iot/status` - Status device Pico

## Database Tables

- `respondents` - Data responden (nama, usia, gender, status diabetes)
- `sessions` - Sesi sampling (state: pending→purging→ready→sampling→completed, hasil sensor)

## Pico 2W Configuration

Edit `pico-firmware/main.py`:
```python
WIFI_SSID     = "NAMA_WIFI_ANDA"
WIFI_PASSWORD = "PASSWORD_WIFI"
SERVER_URL    = "https://YOUR-REPLIT-DOMAIN.replit.app"
```
