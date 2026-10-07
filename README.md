# 🍉 AirMouse — Fruit Ninja (Katana Sword Physics Edition)

A browser-based Fruit Ninja experience where you wield your **smartphone like an authentic Japanese Katana sword** using real-time **Gyroscope & Accelerometer physics** with anti-jitter filtering.

Point, tilt, and swing your phone through the air to swing a full-length Katana blade with authentic curvature, inertial momentum, and glowing slice trails!

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Launch the server
node server.js
```

The terminal will display:
```
🍉  AirMouse HTTP  → http://localhost:3000 | http://<your-ip>:3000/controller
🔒  AirMouse HTTPS → https://<your-ip>:3443/controller (Recommended for Mobile Gyro)
```

---

## 🗡️ Real Katana Physics & Controls

### 1. **1-Euro Anti-Jitter Filter**
- **Zero Jitter**: Uses an adaptive 1€ filter that dynamically adjusts damping based on hand velocity.
- Micro-tremors and hand jitter are completely filtered out when aiming or holding still.
- Fast sword swings track with zero latency.

### 2. **Rigid Body Sword Mechanics**
- The sword features a physical **Hilt**, **Blade Length (160px)**, and **Tip**.
- **Inertial Momentum**: When you swing your arm, the blade naturally rotates and whips around based on movement velocity and rotational momentum.
- Slicing checks intersection along the full sword cutting edge and tip sweep arc.

### 3. **Authentic Katana Rendering**
- **Tsuka**: Samurai braided hilt with gold diamond wrap.
- **Tsuba**: Detailed circular brass guard.
- **Nagasa & Hamon**: Curved folded steel with wavy temper line.
- **Energy Blade & Ribbon Trail**: High-speed swings ignite the blade with a glowing energy aura and sweeping light ribbon.

---

## 🎮 How to Play

1. **Open Game on PC**: Visit [`http://localhost:3000`](http://localhost:3000) or your deployed site [`https://gyromouse.vercel.app/`](https://gyromouse.vercel.app/).
2. **Connect Phone**: Scan the QR code or open the link on your mobile browser.
3. **Wield the Katana**:
   - **Aim & Point**: Tilt your phone naturally to point the sword.
   - **Physical Swing**: Fast wrist/arm swings automatically trigger high-speed Katana power slashes with audio swoosh effects!
   - **Hold to Slice**: Hold your thumb down on the trigger pad for continuous slicing mode.
   - **🎯 Re-Center**: Tap **"Re-Center Aim"** at any time while pointing at the screen center to reset your neutral angle.
   - **Controller Modes**: Switch between **Gyroscope**, **Touchpad Swipe**, or **Swing Katana** in the bottom footer.

---

## 📁 Project Structure

```
AirMouse/
├── server.js              # Dual HTTP (3000) & HTTPS (3443) Socket.io server (local play)
├── index.html             # PC game with Katana Physics & 1€ Filter (WebRTC + Socket.io)
├── controller.html        # Mobile Katana controller (iOS/Android sensor stream)
├── vercel.json            # Vercel deployment route rewrites
├── package.json
└── README.md
```

---

## 🚀 Cloud Deployment (Vercel)

The app is cloud-ready with **WebRTC P2P (PeerJS)** support. When deployed on Vercel:
- Phone connects directly to PC via encrypted WebRTC DataChannels (<5ms latency).
- Zero WebSocket server requirement on serverless hosts.


---

## 🌐 GitHub Pages Deployment

1. Push all files to a GitHub repo.
2. Go to **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open `https://<username>.github.io/<repo>/` on PC and scan the QR code with your phone (connects over WebRTC, no server needed).
