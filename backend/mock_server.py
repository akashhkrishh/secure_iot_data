# mock_esp_client.py

import asyncio
import websockets
import json
import base64
import random

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

# SAME KEY/IV AS BACKEND
KEY = b'my_secure_16_key'
IV = b'my_secure_16_iv_'

WS_URL = "ws://127.0.0.1:8000/ws/sensor"

streaming = False


# ---------------- ENCRYPT ----------------

def encrypt_payload(data_dict):
    json_string = json.dumps(data_dict, separators=(',', ':'))

    cipher = AES.new(KEY, AES.MODE_CBC, IV)

    padded_data = pad(
        json_string.encode('utf-8'),
        AES.block_size
    )

    encrypted_bytes = cipher.encrypt(padded_data)

    return base64.b64encode(encrypted_bytes).decode('utf-8')


# ---------------- DECRYPT ----------------

def decrypt_payload(base64_ciphertext):
    ciphertext = base64.b64decode(base64_ciphertext)

    cipher = AES.new(KEY, AES.MODE_CBC, IV)

    decrypted_bytes = unpad(
        cipher.decrypt(ciphertext),
        AES.block_size
    )

    return json.loads(decrypted_bytes.decode('utf-8'))


# ---------------- SENSOR DATA ----------------

def generate_sensor_data():
    return {
        "temp": round(random.uniform(96.5, 99.5), 1),
        "hr": random.randint(65, 110),
        "spo2": random.randint(94, 100)
    }


# ---------------- SEND LOOP ----------------

async def sensor_stream(ws):
    global streaming

    while True:

        if streaming:

            sensor_data = generate_sensor_data()

            encrypted = encrypt_payload(sensor_data)

            payload = {
                "data": encrypted
            }

            await ws.send(
                json.dumps(payload, separators=(',', ':'))
            )

            print("SENT:", sensor_data)

        await asyncio.sleep(1)


# ---------------- RECEIVE LOOP ----------------

async def receive_commands(ws):
    global streaming

    async for message in ws:

        try:
            payload_dict = json.loads(message)

            encrypted_data = payload_dict.get("data")

            decrypted = decrypt_payload(encrypted_data)

            print("COMMAND:", decrypted)

            cmd = decrypted.get("cmd")

            if cmd == "start_stream":
                streaming = True
                print("STREAM STARTED")

            elif cmd == "stop_stream":
                streaming = False
                print("STREAM STOPPED")

        except Exception as e:
            print("ERROR:", e)


# ---------------- MAIN ----------------

async def main():

    async with websockets.connect(WS_URL) as ws:

        print("Connected to backend")

        send_task = asyncio.create_task(
            sensor_stream(ws)
        )

        receive_task = asyncio.create_task(
            receive_commands(ws)
        )

        await asyncio.gather(
            send_task,
            receive_task
        )


if __name__ == "__main__":
    asyncio.run(main())