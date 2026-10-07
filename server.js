/**
 * AirMouse - Fruit Ninja with Phone-as-Controller
 * Server: Dual HTTP (3000) & HTTPS (3443) + Socket.io
 * 
 * Note: Modern mobile browsers (iOS Safari, Android Chrome) REQUIRE HTTPS
 * to access DeviceOrientation & DeviceMotion gyroscope sensors over a local IP.
 */

const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const os = require('os');
const QRCode = require('qrcode');
const path = require('path');
const selfsigned = require('selfsigned');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = 3443;

// --- Pages ---
// (Only the two game pages are served - server.js and package files stay private)

// --- Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/controller', '/controller.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'controller.html'));
});

// --- QR Code endpoint (returns data-URL PNG for both HTTP & HTTPS) ---
app.get('/api/qrcode', async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const ip = getLocalIP();
  
  let targetUrl;
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    targetUrl = `${proto}://${host}/controller`;
  } else {
    targetUrl = `https://${ip}:${HTTPS_PORT}/controller`;
  }

  const httpsUrl = targetUrl;
  const httpUrl = `http://${ip}:${HTTP_PORT}/controller`;
  
  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });
    
    res.json({
      ip,
      url: targetUrl,
      dataUrl,
      httpsUrl,
      httpUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// --- Generate Self-Signed Certificate for HTTPS ---
const ip = getLocalIP();
const pems = selfsigned.generate([
  { name: 'commonName', value: ip },
  { name: 'organizationName', value: 'AirMouse Dojo' }
], {
  days: 365,
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: ip },
        { type: 7, ip: '127.0.0.1' }
      ]
    }
  ]
});

// --- HTTP Server ---
const httpServer = http.createServer(app);
// --- HTTPS Server ---
const httpsServer = https.createServer({
  key: pems.private,
  cert: pems.cert
}, app);

// --- Socket.io attached to both servers ---
const io = new Server({
  cors: { origin: '*' }
});
io.attach(httpServer);
io.attach(httpsServer);

// Track connected game (PC) and controller (phone) sockets
let gameSockets = new Set();
let controllerSockets = new Set();

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // PC game registers itself
  socket.on('game:register', () => {
    gameSockets.add(socket.id);
    console.log(`[game] registered: ${socket.id}`);
    socket.emit('controller:count', controllerSockets.size);
  });

  // Phone controller registers itself
  socket.on('phone:connect', () => {
    controllerSockets.add(socket.id);
    console.log(`[controller] connected: ${socket.id}`);
    for (const gid of gameSockets) {
      io.to(gid).emit('controller:connected', { id: socket.id });
      io.to(gid).emit('controller:count', controllerSockets.size);
    }
    socket.emit('phone:paired', { success: true });
  });

  // Relay touch / touchpad events from phone → game
  socket.on('phone:touchstart', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:touchstart', data);
    }
  });

  socket.on('phone:touchmove', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:touchmove', data);
    }
  });

  socket.on('phone:touchend', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:touchend', data);
    }
  });

  // Gyroscope & Motion Stream from phone → game
  socket.on('phone:gyro', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:gyro', data);
    }
  });

  // Re-center pointer calibration
  socket.on('phone:recenter', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:recenter', data);
    }
  });

  // Slash trigger (hold button or high-velocity swing)
  socket.on('phone:slash_state', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:slash_state', data);
    }
  });

  // Game control actions (play / restart / menu from phone)
  socket.on('phone:action', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:action', data);
    }
  });

  // Mode changes
  socket.on('phone:mode_change', (data) => {
    for (const gid of gameSockets) {
      io.to(gid).emit('remote:mode_change', data);
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    if (controllerSockets.has(socket.id)) {
      controllerSockets.delete(socket.id);
      for (const gid of gameSockets) {
        io.to(gid).emit('controller:disconnected', { id: socket.id });
        io.to(gid).emit('controller:count', controllerSockets.size);
      }
    }
    gameSockets.delete(socket.id);
  });
});

// --- Utility: Get local network IP ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// --- Start Servers ---
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`🍉  AirMouse HTTP  → http://localhost:${HTTP_PORT} | http://${ip}:${HTTP_PORT}/controller`);
});

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`🔒  AirMouse HTTPS → https://${ip}:${HTTPS_PORT}/controller (Recommended for Mobile Gyro)`);
});
