# MedNode IoT Patient Monitoring System

This project is a clinical-grade IoT patient monitoring system that integrates an ESP32 hardware node, a FastAPI backend, and a modern React (Vite) frontend dashboard.

## Project Structure

- `backend/`: FastAPI server providing REST APIs, WebSockets, and SQLite database (`hospital.db`).
- `frontend/`: React & Vite based frontend application styled with Tailwind CSS and glassmorphism UI.
- `esp_32_code/`: Arduino IDE C++ code for the ESP32 hardware, integrating sensors (MAX30105, etc.) and connecting via WebSockets to the backend.

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- **Arduino IDE** (for ESP32 programming)

## Libraries Used (ESP32 Arduino)

To successfully compile the ESP32 code, install the following libraries via the Arduino IDE Library Manager:

1. **[SparkFun MAX3010x Pulse and Proximity Sensor Library]** - For the MAX30102 Heart Rate/SpO2 sensor.
2. **[DallasTemperature]** by Miles Burton - For the DS18B20 temperature sensor.
3. **[OneWire]** by Paul Stoffregen - Dependency for DallasTemperature.
4. **[hd44780]** by extclass (Bill Perry) - For the I2C LCD Display (`hd44780_I2Cexp`).
5. **[ArduinoJson]** by Benoit Blanchon - For parsing and building JSON payloads.
6. **[WebSockets]** by Markus Sattler - For real-time telemetry streaming (`WebSocketsClient`).

*(Note: `WiFi.h`, `Wire.h`, and `mbedtls` for AES encryption are built into the ESP32 core and do not need to be installed manually).*

## How to Start the System

We have provided convenient Windows batch (`.bat`) scripts to run the system quickly.

### 1. Run Everything Automatically (Recommended)
Double-click on **`run_all.bat`** in the root directory.
This script will:
1. Automatically fetch your computer's local IP address.
2. Start the FastAPI backend server on port 8000.
3. Open a separate window to install frontend dependencies (if needed) and start the Vite development server.
4. Allow your frontend and backend to be accessible from other devices (like a smartphone) on the same WiFi network!

### 2. Run Manually (Separate Scripts)
If you prefer to start them individually:
- **`backend_server.bat`**: Activates the Python virtual environment and starts the FastAPI server (`uvicorn main:app --reload --host 0.0.0.0 --port 8000`). It also prints your local IP address.
- **`frontend_server.bat`**: Installs NPM packages (if missing) and starts the Vite development server.
- **`frontend_client.bat`**: If you ever experience caching or build issues with the frontend, this script safely clears `node_modules`, reinstalls dependencies, and forces a clean production build.

## Accessing the Dashboard

Once the servers are running:
- **Locally:** Open your browser and go to `http://localhost:5173`
- **From another device (e.g., Phone):** Open your browser and go to `http://<YOUR-SYSTEM-IP>:5173` (The exact IP will be printed in the terminal when you run the backend).

**Demo Login:**
- **Doctor ID:** `dr_smith`
- **Password:** `password123`

## Troubleshooting

- **ESP32 is Offline:** Ensure your ESP32 is powered, connected to the correct WiFi network (`Rycton`), and the `ws_host` in the Arduino code is updated to match your computer's local IP address.
- **Frontend shows Network Error:** Make sure both the backend and frontend are running. If you are accessing from a mobile device, make sure your PC's firewall allows incoming connections on port `8000` (FastAPI) and `5173` (Vite).
