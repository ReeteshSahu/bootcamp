import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun, initDb } from './db.js';
import { startSimulation } from './simulation.js';

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'aeroshield_secure_token_secret_123456';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize HTTP and WS server
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Attach WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket stream');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to AeroShield Telemetry' }));
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket stream');
  });
});

// Middleware: Authenticate JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Middleware: Authorize Roles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied for this action' });
    }
    next();
  };
};

// Helper: Log audit action
const logAction = async (email, action, details) => {
  await dbRun(
    'INSERT INTO AuditLogs (user_email, action, details, timestamp) VALUES (?, ?, ?, ?)',
    [email, action, details, new Date().toISOString()]
  );
};

// API: Register User
app.post('/api/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required registration details' });
  }

  try {
    const existing = await dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'User email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const assignedRole = role || 'public';

    await dbRun(
      'INSERT INTO Users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hash, name, assignedRole]
    );

    await logAction(email, 'REGISTER', `User registered with role: ${assignedRole}`);
    res.json({ message: 'User registered successfully. Please login.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Login User
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAction(user.email, 'LOGIN', 'User logged in successfully');
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Dashboard summary statistics
app.get('/api/dashboard', async (req, res) => {
  try {
    const stations = await dbAll('SELECT * FROM AQIStations');
    const vehicles = await dbAll('SELECT * FROM Vehicles');
    const alertsCount = await dbGet('SELECT COUNT(*) as cnt FROM Alerts WHERE resolved = 0');
    
    // Average AQI, PM2.5, PM10
    const avgAqi = stations.reduce((acc, s) => acc + s.current_aqi, 0) / stations.length;
    const avgPm25 = stations.reduce((acc, s) => acc + s.pm25, 0) / stations.length;
    const avgPm10 = stations.reduce((acc, s) => acc + s.pm10, 0) / stations.length;

    // Mitigation telemetry stats (based on active trucks)
    const activeVehicles = vehicles.filter(v => v.status === 'Active');
    const runningCount = activeVehicles.length;

    // Average dust emission reduction and hardware states
    let avgSpeed = 0;
    let avgWaterLevel = 0;
    let avgBatteryLevel = 0;
    
    if (runningCount > 0) {
      avgSpeed = activeVehicles.reduce((acc, v) => acc + v.speed, 0) / runningCount;
      avgWaterLevel = activeVehicles.reduce((acc, v) => acc + v.water_tank_level, 0) / runningCount;
      avgBatteryLevel = activeVehicles.reduce((acc, v) => acc + v.battery_level, 0) / runningCount;
    }

    res.json({
      summary: {
        avg_aqi: Math.round(avgAqi),
        avg_pm25: Math.round(avgPm25),
        avg_pm10: Math.round(avgPm10),
        active_trucks: runningCount,
        total_trucks: vehicles.length,
        unresolved_alerts: alertsCount.cnt,
        avg_speed: Math.round(avgSpeed),
        avg_water: Math.round(avgWaterLevel),
        avg_battery: Math.round(avgBatteryLevel),
        aeroshield_efficiency: runningCount > 0 ? 85 : 0 // AeroShield device collects ~85% dust particles when running
      },
      stations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get AQI metrics
app.get('/api/aqi', async (req, res) => {
  try {
    const stations = await dbAll('SELECT id, name, current_aqi, lat, lng FROM AQIStations');
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get PM10 metrics
app.get('/api/pm10', async (req, res) => {
  try {
    const stations = await dbAll('SELECT id, name, pm10 FROM AQIStations');
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get PM2.5 metrics
app.get('/api/pm25', async (req, res) => {
  try {
    const stations = await dbAll('SELECT id, name, pm25 FROM AQIStations');
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Weather details
app.get('/api/weather', async (req, res) => {
  try {
    const weather = await dbAll('SELECT id, name, temp, humidity, wind_speed FROM AQIStations');
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await dbAll('SELECT * FROM Vehicles');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Add/Modify Vehicle (Admin Only)
app.put('/api/vehicle', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id, plate_number, driver_name, load_type, load_weight, cover_status, status, speed, water_tank_level, battery_level, last_service_date } = req.body;
  if (!id || !plate_number || !driver_name) {
    return res.status(400).json({ error: 'Missing key vehicle details' });
  }

  try {
    const exists = await dbGet('SELECT * FROM Vehicles WHERE id = ?', [id]);
    if (exists) {
      // Update
      await dbRun(
        'UPDATE Vehicles SET plate_number = ?, driver_name = ?, load_type = ?, load_weight = ?, cover_status = ?, status = ?, speed = ?, water_tank_level = ?, battery_level = ?, last_service_date = ? WHERE id = ?',
        [plate_number, driver_name, load_type, load_weight, cover_status, status, speed, water_tank_level, battery_level, last_service_date, id]
      );
      await logAction(req.user.email, 'UPDATE_VEHICLE', `Updated vehicle profile: ${id}`);
      res.json({ message: 'Vehicle updated successfully' });
    } else {
      // Create
      await dbRun(
        'INSERT INTO Vehicles (id, plate_number, driver_name, load_type, load_weight, cover_status, water_tank_level, battery_level, status, speed, last_service_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, plate_number, driver_name, load_type, load_weight, cover_status, water_tank_level || 100.0, battery_level || 100.0, status || 'Active', speed || 0.0, last_service_date || new Date().toISOString().split('T')[0]]
      );
      await logAction(req.user.email, 'ADD_VEHICLE', `Added vehicle: ${id}`);
      res.json({ message: 'Vehicle added successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete Vehicle (Admin Only)
app.delete('/api/vehicle', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Vehicle ID is required' });

  try {
    await dbRun('DELETE FROM Vehicles WHERE id = ?', [id]);
    await logAction(req.user.email, 'DELETE_VEHICLE', `Deleted vehicle: ${id}`);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await dbAll('SELECT * FROM Alerts ORDER BY id DESC LIMIT 50');
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Resolve Alerts (Fleet Managers & Admin)
app.post('/api/alerts/resolve', authenticateToken, authorizeRoles(['admin', 'manager']), async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Alert ID is required' });

  try {
    await dbRun('UPDATE Alerts SET resolved = 1 WHERE id = ?', [id]);
    await logAction(req.user.email, 'RESOLVE_ALERT', `Resolved Alert ID: ${id}`);
    res.json({ message: 'Alert marked as resolved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get predictions
app.get('/api/predictions', async (req, res) => {
  try {
    const predictions = await dbAll('SELECT * FROM Predictions');
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Run prediction (Admin / Manager)
app.post('/api/prediction', authenticateToken, authorizeRoles(['admin', 'manager']), async (req, res) => {
  try {
    // Mock simulation model re-calculation
    const updateTime = new Date().toISOString();
    await dbRun('UPDATE Predictions SET confidence = MIN(98.5, confidence + (RANDOM() % 3)), timestamp = ?', [updateTime]);
    await logAction(req.user.email, 'RUN_AI_PREDICTION', 'Re-evaluated AI prediction forecasts');
    const predictions = await dbAll('SELECT * FROM Predictions');
    res.json({ message: 'AI forecast re-calculated', predictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: IoT Telemetry Ingestion (POST /sensor) - Public or IoT simulated device ingestion endpoint
app.post('/api/sensor', async (req, res) => {
  const { vehicle_id, lat, lng, dust_emission, speed, water_level, battery_level, fan_speed, electrostatic_status, mist_pressure } = req.body;
  if (!vehicle_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Invalid sensor ingestion payload' });
  }

  try {
    await dbRun(
      'INSERT INTO Telemetry (vehicle_id, lat, lng, dust_emission, speed, water_level, battery_level, fan_speed, electrostatic_status, mist_pressure, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicle_id, lat, lng, dust_emission || 0.0, speed || 0.0, water_level || 100.0, battery_level || 100.0, fan_speed || 0, electrostatic_status || 'Offline', mist_pressure || 0.0, new Date().toISOString()]
    );
    res.json({ status: 'success', message: 'Ingestion telemetry saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets from frontend/dist in production environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, '../frontend/dist');

app.use(express.static(frontendDistPath));

// For SPA routing, redirect fallback to index.html (skip API / Ingestion paths)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sensor')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Boot Database, run Seed, start simulation and listen on PORT
const init = async () => {
  try {
    await initDb();
    
    // Check if users exist. If not, seed database
    const users = await dbAll('SELECT * FROM Users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found in SQLite. Loading seed data...');
      // Dynamically trigger seed script import logic
      const seedModule = await import('./seed.js');
    } else {
      console.log('Database already populated. Starting server.');
    }

    startSimulation(wss);

    server.listen(PORT, () => {
      console.log(`AeroShield Express server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting backend:', err);
  }
};

init();
