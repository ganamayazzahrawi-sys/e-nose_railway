"""
SISTEM E-NOSE - PICO 2W FIRMWARE
Raspberry Pi Pico 2W - WiFi HTTP Client
Menghubungkan ke server melalui WiFi dan mengontrol sistem e-nose
"""

import network
import urequests
import ujson
from machine import Pin, ADC, I2C
import utime
import math
import sys

# ═══════════════════════════════════════════════════════════════════════════
# KONFIGURASI - SESUAIKAN DENGAN JARINGAN DAN SERVER ANDA
# ═══════════════════════════════════════════════════════════════════════════

WIFI_SSID     = "NAMA_WIFI_ANDA"      # Ganti dengan SSID WiFi
WIFI_PASSWORD = "PASSWORD_WIFI"       # Ganti dengan password WiFi

# URL server - gunakan IP lokal jika dalam jaringan yang sama
# Contoh: "http://192.168.1.100" atau domain Replit Anda
SERVER_URL = "https://YOUR-REPLIT-DOMAIN.replit.app"

# Interval polling command dari server (milidetik)
POLL_INTERVAL_MS = 2000

# ═══════════════════════════════════════════════════════════════════════════
# KONSTANTA HARDWARE
# ═══════════════════════════════════════════════════════════════════════════

VCC     = 5
ADC_MAX = 65535

# Resistor Load (ukur dengan multimeter)
RL_MQ3   = 46500   # ohm
RL_MQ4   = 970     # ohm
RL_MQ138 = 4200    # ohm

# Resistansi R0 dari kalibrasi (udara bersih)
R0_MQ3   = 3243.2
R0_MQ4   = 2959.142
R0_MQ138 = 3945.3

# Konstanta kurva dari datasheet
A_MQ3,   B_MQ3   = 7.5249, -0.9542
A_MQ4,   B_MQ4   = 4.5949, -0.5151
A_MQ138, B_MQ138 = 1.0312, -0.3601

# ═══════════════════════════════════════════════════════════════════════════
# KONFIGURASI PIN
# ═══════════════════════════════════════════════════════════════════════════

i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)

adc_mq3   = ADC(Pin(26))
adc_mq4   = ADC(Pin(27))
adc_mq138 = ADC(Pin(28))

tgs2602_pin = Pin(2, Pin.IN)

led_ready  = Pin(15, Pin.OUT)
relay_pump = Pin(14, Pin.OUT)

# ═══════════════════════════════════════════════════════════════════════════
# LCD I2C CLASS
# ═══════════════════════════════════════════════════════════════════════════

class LCD_I2C:
    def __init__(self, i2c, addr=0x27, rows=4, cols=20):
        self.i2c  = i2c
        self.addr = addr
        self.rows = rows
        self.cols = cols
        utime.sleep_ms(50)
        for _ in range(3):
            self._write_nibble(0x03)
            utime.sleep_ms(5)
        self._write_nibble(0x02)
        self._send_byte(0x28, 0)
        self._send_byte(0x0C, 0)
        self._send_byte(0x06, 0)
        self.clear()

    def _write_nibble(self, nibble, mode=0):
        bl   = 0x08
        byte = (nibble << 4) | bl | mode
        self.i2c.writeto(self.addr, bytes([byte | 0x04]))
        utime.sleep_us(1)
        self.i2c.writeto(self.addr, bytes([byte]))
        utime.sleep_us(100)

    def _send_byte(self, byte, mode):
        self._write_nibble((byte >> 4) & 0x0F, mode)
        self._write_nibble(byte & 0x0F, mode)

    def clear(self):
        self._send_byte(0x01, 0)
        utime.sleep_ms(2)

    def set_cursor(self, row, col):
        offsets = [0x00, 0x40, 0x14, 0x54]
        self._send_byte(0x80 | (offsets[row] + col), 0)

    def print(self, text, row=0, col=0):
        self.set_cursor(row, col)
        for ch in text[:self.cols - col]:
            self._send_byte(ord(ch), 1)

    def center(self, text, row):
        col = max(0, (self.cols - len(text)) // 2)
        self.print(text, row, col)

# ═══════════════════════════════════════════════════════════════════════════
# INISIALISASI
# ═══════════════════════════════════════════════════════════════════════════

devices  = i2c.scan()
lcd_addr = devices[0] if devices else 0x27
lcd      = LCD_I2C(i2c, addr=lcd_addr)

led_ready.value(0)
relay_pump.value(1)  # OFF (relay aktif LOW)

# ═══════════════════════════════════════════════════════════════════════════
# FUNGSI UTILITAS
# ═══════════════════════════════════════════════════════════════════════════

def pump_on():
    relay_pump.value(0)
    print("PUMP: ON")

def pump_off():
    relay_pump.value(1)
    print("PUMP: OFF")

def led_on():
    led_ready.value(1)

def led_off():
    led_ready.value(0)

def read_adc_avg(adc, samples=10):
    total = 0
    for _ in range(samples):
        total += adc.read_u16()
        utime.sleep_ms(5)
    return total // samples

def hitung_ppm(raw, RL, R0, a, b):
    Vout = (raw / ADC_MAX) * VCC
    if Vout == 0:
        return 0.0
    Rs    = ((VCC - Vout) / Vout) * RL
    ratio = Rs / R0
    if ratio <= 0:
        return 0.0
    return a * math.pow(ratio, b)

def read_all_sensors():
    raw3   = read_adc_avg(adc_mq3)
    raw4   = read_adc_avg(adc_mq4)
    raw138 = read_adc_avg(adc_mq138)
    tgs    = float(tgs2602_pin.value())

    ppm3   = hitung_ppm(raw3,   RL_MQ3,   R0_MQ3,   A_MQ3,   B_MQ3)
    ppm4   = hitung_ppm(raw4,   RL_MQ4,   R0_MQ4,   A_MQ4,   B_MQ4)
    ppm138 = hitung_ppm(raw138, RL_MQ138, R0_MQ138, A_MQ138, B_MQ138)

    return ppm3, ppm4, ppm138, tgs

# ═══════════════════════════════════════════════════════════════════════════
# FUNGSI HTTP
# ═══════════════════════════════════════════════════════════════════════════

def http_get(path):
    try:
        url      = SERVER_URL + "/api" + path
        response = urequests.get(url, timeout=10)
        data     = response.json()
        response.close()
        return data
    except Exception as e:
        print(f"HTTP GET error: {e}")
        return None

def http_post(path, payload):
    try:
        url      = SERVER_URL + "/api" + path
        headers  = {"Content-Type": "application/json"}
        body     = ujson.dumps(payload)
        response = urequests.post(url, data=body, headers=headers, timeout=10)
        data     = response.json()
        response.close()
        return data
    except Exception as e:
        print(f"HTTP POST error: {e}")
        return None

def update_status(state, session_id=None, message=None):
    payload = {"state": state}
    if session_id is not None:
        payload["sessionId"] = session_id
    if message is not None:
        payload["message"] = message
    return http_post("/iot/status", payload)

def get_command():
    return http_get("/iot/command")

def send_sensor_data(session_id, ppm3, ppm4, ppm138, tgs, samples_count):
    payload = {
        "mq3AlcoholPpm":  round(ppm3, 4),
        "mq4MethanePpm":  round(ppm4, 4),
        "mq138AcetonePpm": round(ppm138, 4),
        "tgs2602Voc":     round(tgs, 4),
        "samplesCount":   samples_count,
    }
    return http_post(f"/sessions/{session_id}/sensor-data", payload)

# ═══════════════════════════════════════════════════════════════════════════
# KONEKSI WIFI
# ═══════════════════════════════════════════════════════════════════════════

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    lcd.clear()
    lcd.center("Connecting WiFi", 0)
    lcd.print(WIFI_SSID[:20], 1, 0)
    led_off()

    print(f"Menghubungkan ke {WIFI_SSID}...")

    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    timeout = 20
    for i in range(timeout):
        if wlan.isconnected():
            break
        lcd.print(f"Mencoba... {i+1}/{timeout}", 2, 0)
        print(f"  [{i+1}/{timeout}] Menunggu koneksi...")
        utime.sleep(1)

    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        print(f"Terhubung! IP: {ip}")
        lcd.clear()
        lcd.center("WiFi Connected!", 0)
        lcd.center(ip, 1)
        led_on()
        utime.sleep(2)
        return True
    else:
        print("Gagal terhubung ke WiFi!")
        lcd.clear()
        lcd.center("WiFi GAGAL!", 1)
        lcd.center("Cek SSID/Password", 2)
        return False

# ═══════════════════════════════════════════════════════════════════════════
# FASE PURGING
# ═══════════════════════════════════════════════════════════════════════════

def run_purging(session_id, duration=10):
    print(f"\n=== PURGING ({duration}s) ===")
    lcd.clear()
    lcd.center("PURGING", 0)
    lcd.center("Membersihkan...", 1)

    update_status("purging", session_id, "Membersihkan chamber")
    pump_on()
    led_off()

    for i in range(duration, 0, -1):
        lcd.print(f"Waktu: {i} detik    ", 2, 0)
        print(f"  Purging {i}s tersisa...", end='\r')
        utime.sleep(1)

    pump_off()
    led_on()
    print("\nPurging selesai!")

    lcd.clear()
    lcd.center("SIAP!", 1)
    lcd.center("Tiupkan napas", 2)
    lcd.center("ke sensor", 3)

    update_status("ready", session_id, "Siap untuk sampling")

# ═══════════════════════════════════════════════════════════════════════════
# FASE SAMPLING
# ═══════════════════════════════════════════════════════════════════════════

def run_sampling(session_id, duration=5):
    print(f"\n=== SAMPLING ({duration}s) ===")
    lcd.clear()
    lcd.center("SAMPLING...", 0)
    lcd.center("Tiup ke sensor", 1)

    update_status("sampling", session_id, "Membaca sensor")
    pump_off()
    led_off()

    samples = []
    start   = utime.ticks_ms()

    while utime.ticks_diff(utime.ticks_ms(), start) < duration * 1000:
        elapsed = utime.ticks_diff(utime.ticks_ms(), start) // 1000
        remaining = duration - elapsed
        lcd.print(f"Waktu: {remaining}s    ", 2, 0)

        ppm3, ppm4, ppm138, tgs = read_all_sensors()
        samples.append((ppm3, ppm4, ppm138, tgs))
        print(f"  Sample: MQ3={ppm3:.1f} MQ4={ppm4:.1f} MQ138={ppm138:.1f} TGS={tgs:.1f}")
        utime.sleep_ms(200)

    # Hitung rata-rata
    n      = len(samples)
    avg3   = sum(s[0] for s in samples) / n
    avg4   = sum(s[1] for s in samples) / n
    avg138 = sum(s[2] for s in samples) / n
    avg_tgs = sum(s[3] for s in samples) / n

    print(f"\nHasil ({n} sampel):")
    print(f"  MQ3  Alcohol: {avg3:.2f} ppm")
    print(f"  MQ4  Methane: {avg4:.2f} ppm")
    print(f"  MQ138 Acetone: {avg138:.2f} ppm")
    print(f"  TGS2602 VOC:  {avg_tgs:.2f}")

    # Tampilkan di LCD
    lcd.clear()
    lcd.print(f"Alc:{avg3:.1f}ppm", 0, 0)
    lcd.print(f"CH4:{avg4:.1f}ppm", 1, 0)
    lcd.print(f"Ace:{avg138:.1f}ppm", 2, 0)
    lcd.print(f"VOC:{avg_tgs:.1f}", 3, 0)

    # Kirim ke server
    result = send_sensor_data(session_id, avg3, avg4, avg138, avg_tgs, n)
    if result:
        print("Data berhasil dikirim ke server!")
        update_status("completed", session_id, "Sampling selesai")
    else:
        print("Gagal kirim data ke server!")
        update_status("error", session_id, "Gagal kirim data")

    led_on()
    utime.sleep(3)
    return avg3, avg4, avg138, avg_tgs

# ═══════════════════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════════════════

def main():
    # Startup
    lcd.clear()
    lcd.center("** E-NOSE **", 0)
    lcd.center("Sistem Deteksi", 1)
    lcd.center("Diabetes", 2)
    lcd.center("v1.0", 3)
    utime.sleep(2)

    # Koneksi WiFi
    if not connect_wifi():
        lcd.clear()
        lcd.center("Mode Offline", 1)
        lcd.center("Tidak ada WiFi", 2)
        while True:
            led_on()
            utime.sleep(0.5)
            led_off()
            utime.sleep(0.5)

    # Tampilkan status ready
    lcd.clear()
    lcd.center("SISTEM READY", 1)
    lcd.center("Menunggu perintah", 2)

    update_status("idle", None, "Sistem siap")
    print("Sistem siap. Menunggu perintah dari server...")

    last_poll = utime.ticks_ms()
    current_session = None

    while True:
        try:
            # Poll command dari server
            if utime.ticks_diff(utime.ticks_ms(), last_poll) >= POLL_INTERVAL_MS:
                last_poll = utime.ticks_ms()

                cmd_data = get_command()

                if cmd_data and cmd_data.get("command") != "idle":
                    cmd       = cmd_data.get("command")
                    session_id = cmd_data.get("sessionId")
                    purge_dur  = cmd_data.get("purgeDuration", 10)
                    sample_dur = cmd_data.get("sampleDuration", 5)

                    print(f"\nPerintah diterima: {cmd} (session={session_id})")

                    if cmd == "start_session" and session_id:
                        current_session = session_id
                        lcd.clear()
                        lcd.center(f"Sesi #{session_id}", 0)
                        lcd.center("Dimulai...", 1)
                        utime.sleep(1)

                        # Jalankan purging
                        run_purging(session_id, purge_dur or 10)
                        utime.sleep(2)

                        # Jalankan sampling
                        run_sampling(session_id, sample_dur or 5)
                        current_session = None

                        # Kembali ke idle
                        lcd.clear()
                        lcd.center("SELESAI", 1)
                        lcd.center("Siap sesi berikut", 2)
                        utime.sleep(3)

                        lcd.clear()
                        lcd.center("SISTEM READY", 1)
                        lcd.center("Menunggu perintah", 2)
                        update_status("idle", None, "Siap untuk sesi berikutnya")

            utime.sleep_ms(100)

        except KeyboardInterrupt:
            print("\nDihentikan oleh pengguna")
            break
        except Exception as e:
            print(f"Error: {e}")
            update_status("error", current_session, str(e))
            utime.sleep(5)
            update_status("idle", None, "Sistem siap")

    # Cleanup
    lcd.clear()
    lcd.center("SISTEM", 1)
    lcd.center("BERHENTI", 2)
    pump_off()
    led_off()

main()
