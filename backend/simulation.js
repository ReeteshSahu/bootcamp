import { dbRun, dbAll, dbGet } from './db.js';

// Route coordinates representing key path segments along the Raipur-Bhilai-Durg NH-53 corridor
const POINTS = {
  RAIPUR: { lat: 21.2514, lng: 81.6296, name: 'Raipur City Center' },
  URLA: { lat: 21.3120, lng: 81.6150, name: 'Urla Industrial Area' },
  SILTARA: { lat: 21.3850, lng: 81.6520, name: 'Siltara Industrial Zone' },
  BHILAI: { lat: 21.1938, lng: 81.3509, name: 'Bhilai Steel Plant' },
  DURG: { lat: 21.1904, lng: 81.2849, name: 'Durg Railway Station' }
};

// Interpolation helper for truck path simulation
const interpolate = (p1, p2, t) => ({
  lat: p1.lat + (p2.lat - p1.lat) * t,
  lng: p1.lng + (p2.lng - p1.lng) * t
});

// Paths for trucks
const TRUCK_PATHS = {
  'AS-TRK-101': [POINTS.RAIPUR, POINTS.BHILAI, POINTS.DURG],
  'AS-TRK-102': [POINTS.URLA, POINTS.BHILAI],
  'AS-TRK-103': [POINTS.SILTARA, POINTS.RAIPUR],
  'AS-TRK-104': [POINTS.BHILAI], // Stationed in maintenance
  'AS-TRK-105': [POINTS.DURG, POINTS.BHILAI, POINTS.RAIPUR, POINTS.SILTARA],
  'AS-TRK-106': [POINTS.URLA, POINTS.RAIPUR, POINTS.BHILAI, POINTS.DURG]
};

// Local cache for simulation state
const states = {
  'AS-TRK-101': { t: 0.1, dir: 1, currentSegment: 0 },
  'AS-TRK-102': { t: 0.3, dir: 1, currentSegment: 0 },
  'AS-TRK-103': { t: 0.5, dir: -1, currentSegment: 0 },
  'AS-TRK-104': { t: 0, dir: 0, currentSegment: 0 },
  'AS-TRK-105': { t: 0.7, dir: 1, currentSegment: 0 },
  'AS-TRK-106': { t: 0.2, dir: -1, currentSegment: 1 }
};

export const startSimulation = (wss) => {
  console.log('Telemetry simulation loop started.');

  setInterval(async () => {
    try {
      // Get all vehicles
      const vehicles = await dbAll('SELECT * FROM Vehicles');
      const updatedVehicles = [];

      for (const vehicle of vehicles) {
        const id = vehicle.id;
        const state = states[id];
        const path = TRUCK_PATHS[id];

        if (!state || path.length <= 1) {
          // Stationary or maintenance vehicle
          updatedVehicles.push(vehicle);
          continue;
        }

        // Move truck along path
        // Increase/decrease t
        const step = 0.02 + Math.random() * 0.01;
        state.t += step * state.dir;

        // Check bounds
        if (state.t >= 1) {
          state.t = 1;
          state.dir = -1;
          // Shift segment if multi-point
          if (path.length > 2 && state.currentSegment < path.length - 2) {
            state.currentSegment++;
            state.t = 0;
            state.dir = 1;
          }
        } else if (state.t <= 0) {
          state.t = 0;
          state.dir = 1;
          if (path.length > 2 && state.currentSegment > 0) {
            state.currentSegment--;
            state.t = 1;
            state.dir = -1;
          }
        }

        // Get coordinates
        const p1 = path[state.currentSegment];
        const p2 = path[state.currentSegment + 1] || p1;
        const coords = interpolate(p1, p2, state.t);

        // Telemetry calculation
        let speed = vehicle.speed;
        if (vehicle.status === 'Active') {
          speed = Math.floor(40 + Math.random() * 25); // Speed between 40 and 65
        } else {
          speed = 0;
        }

        // Speed alert
        if (speed > 60 && Math.random() < 0.2) {
          const alertMsg = `Vehicle ${vehicle.plate_number} detected speeding (${speed} km/h) along corridor.`;
          const exists = await dbGet('SELECT * FROM Alerts WHERE vehicle_id = ? AND type = ? AND resolved = 0', [id, 'SPEEDING']);
          if (!exists) {
            await dbRun('INSERT INTO Alerts (vehicle_id, type, message, severity, timestamp) VALUES (?, ?, ?, ?, ?)', [
              id, 'SPEEDING', alertMsg, 'danger', new Date().toISOString()
            ]);
            broadcastToAll(wss, { type: 'NEW_ALERT', data: { vehicle_id: id, type: 'SPEEDING', message: alertMsg, severity: 'danger' } });
          }
        }

        // Water usage
        let waterLevel = vehicle.water_tank_level;
        if (vehicle.status === 'Active' && waterLevel > 0) {
          waterLevel = Math.max(0, +(waterLevel - (0.1 + Math.random() * 0.15)).toFixed(1));
        }

        // Water level alert
        if (waterLevel <= 20 && waterLevel > 0) {
          const alertMsg = `Water tank low (${waterLevel}%) on vehicle ${vehicle.plate_number}.`;
          const exists = await dbGet('SELECT * FROM Alerts WHERE vehicle_id = ? AND type = ? AND resolved = 0', [id, 'LOW_WATER']);
          if (!exists) {
            await dbRun('INSERT INTO Alerts (vehicle_id, type, message, severity, timestamp) VALUES (?, ?, ?, ?, ?)', [
              id, 'LOW_WATER', alertMsg, 'warning', new Date().toISOString()
            ]);
            broadcastToAll(wss, { type: 'NEW_ALERT', data: { vehicle_id: id, type: 'LOW_WATER', message: alertMsg, severity: 'warning' } });
          }
        } else if (waterLevel === 0) {
          const alertMsg = `Water tank empty! AeroShield inactive on vehicle ${vehicle.plate_number}.`;
          const exists = await dbGet('SELECT * FROM Alerts WHERE vehicle_id = ? AND type = ? AND resolved = 0', [id, 'EMPTY_WATER']);
          if (!exists) {
            await dbRun('INSERT INTO Alerts (vehicle_id, type, message, severity, timestamp) VALUES (?, ?, ?, ?, ?)', [
              id, 'EMPTY_WATER', alertMsg, 'danger', new Date().toISOString()
            ]);
            broadcastToAll(wss, { type: 'NEW_ALERT', data: { vehicle_id: id, type: 'EMPTY_WATER', message: alertMsg, severity: 'danger' } });
          }
        }

        // Battery drainage
        let batteryLevel = vehicle.battery_level;
        if (vehicle.status === 'Active') {
          batteryLevel = Math.max(5, +(batteryLevel - (0.05 + Math.random() * 0.05)).toFixed(1));
        }

        // Battery Alert
        if (batteryLevel <= 15) {
          const alertMsg = `AeroShield battery critical (${batteryLevel}%) on vehicle ${vehicle.plate_number}.`;
          const exists = await dbGet('SELECT * FROM Alerts WHERE vehicle_id = ? AND type = ? AND resolved = 0', [id, 'LOW_BATTERY']);
          if (!exists) {
            await dbRun('INSERT INTO Alerts (vehicle_id, type, message, severity, timestamp) VALUES (?, ?, ?, ?, ?)', [
              id, 'LOW_BATTERY', alertMsg, 'danger', new Date().toISOString()
            ]);
            broadcastToAll(wss, { type: 'NEW_ALERT', data: { vehicle_id: id, type: 'LOW_BATTERY', message: alertMsg, severity: 'danger' } });
          }
        }

        // Calculate dust emission based on setup
        // Standard emission: based on speed, load weight
        // Uncovered covers increase emissions
        // Water level = 0 reduces dust collection efficiency
        const isCovered = vehicle.cover_status === 'Covered';
        const coverMultiplier = isCovered ? 1.0 : 3.5;
        const waterMultiplier = waterLevel === 0 ? 5.0 : 1.0;
        
        let baseEmission = (speed * 0.3) + (vehicle.load_weight * 0.8) * coverMultiplier * waterMultiplier;
        
        // AeroShield operation reduces dust emissions by 85% if active (has water & battery > 10)
        const isAeroShieldActive = waterLevel > 0 && batteryLevel > 10 && vehicle.status === 'Active';
        const rawDustEmitted = baseEmission;
        const actualDustEmitted = isAeroShieldActive ? +(baseEmission * 0.15).toFixed(1) : +baseEmission.toFixed(1);

        const fanSpeed = isAeroShieldActive ? Math.floor(1800 + Math.random() * 500) : 0;
        const electrostaticStatus = isAeroShieldActive ? 'Active' : 'Offline';
        const mistPressure = isAeroShieldActive ? +(4.5 + Math.random() * 1.5).toFixed(1) : 0;

        // Update database
        await dbRun(
          'UPDATE Vehicles SET speed = ?, water_tank_level = ?, battery_level = ?, status = ? WHERE id = ?',
          [speed, waterLevel, batteryLevel, vehicle.status, id]
        );

        // Save telemetry record
        await dbRun(
          'INSERT INTO Telemetry (vehicle_id, lat, lng, dust_emission, speed, water_level, battery_level, fan_speed, electrostatic_status, mist_pressure, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, coords.lat, coords.lng, actualDustEmitted, speed, waterLevel, batteryLevel, fanSpeed, electrostaticStatus, mistPressure, new Date().toISOString()]
        );

        updatedVehicles.push({
          ...vehicle,
          lat: coords.lat,
          lng: coords.lng,
          speed,
          water_tank_level: waterLevel,
          battery_level: batteryLevel,
          dust_emission: actualDustEmitted,
          fan_speed: fanSpeed,
          electrostatic_status: electrostaticStatus,
          mist_pressure: mistPressure
        });
      }

      // Fluctuations in AQI Stations
      const stations = await dbAll('SELECT * FROM AQIStations');
      for (const s of stations) {
        // Find nearby trucks to increase AQI local pollution
        let nearTruckCount = 0;
        for (const t of updatedVehicles) {
          const dist = Math.sqrt(Math.pow(t.lat - s.lat, 2) + Math.pow(t.lng - s.lng, 2));
          if (dist < 0.05) nearTruckCount++;
        }

        let aqiNoise = Math.floor(-5 + Math.random() * 11); // -5 to +5
        let trafficLoad = nearTruckCount * 12;
        let newAqi = Math.max(40, s.current_aqi + aqiNoise + trafficLoad);
        
        // Cap AQI fluctuations to keep it realistic
        if (s.id === 'ST-URLA') newAqi = Math.min(380, Math.max(220, newAqi));
        if (s.id === 'ST-SILT') newAqi = Math.min(410, Math.max(240, newAqi));
        if (s.id === 'ST-BHIL') newAqi = Math.min(290, Math.max(160, newAqi));
        if (s.id === 'ST-RAPR') newAqi = Math.min(180, Math.max(90, newAqi));
        if (s.id === 'ST-DURG') newAqi = Math.min(220, Math.max(120, newAqi));

        const pm25 = Math.floor(newAqi * 0.42);
        const pm10 = Math.floor(newAqi * 0.88);

        await dbRun('UPDATE AQIStations SET current_aqi = ?, pm25 = ?, pm10 = ? WHERE id = ?', [newAqi, pm25, pm10, s.id]);

        // Trigger Station Alert if AQI exceeds threshold (e.g. 250)
        if (newAqi > 250 && Math.random() < 0.1) {
          const alertMsg = `Dangerous AQI level (${newAqi}) detected at ${s.name}.`;
          const exists = await dbGet('SELECT * FROM Alerts WHERE vehicle_id IS NULL AND type = ? AND message LIKE ? AND resolved = 0', ['CRITICAL_AQI', `%${s.name}%`]);
          if (!exists) {
            await dbRun('INSERT INTO Alerts (vehicle_id, type, message, severity, timestamp) VALUES (NULL, ?, ?, ?, ?)', [
              'CRITICAL_AQI', alertMsg, 'danger', new Date().toISOString()
            ]);
            broadcastToAll(wss, { type: 'NEW_ALERT', data: { vehicle_id: null, type: 'CRITICAL_AQI', message: alertMsg, severity: 'danger' } });
          }
        }
      }

      // Broadcast telemetry frame to web clients
      broadcastToAll(wss, {
        type: 'TELEMETRY_UPDATE',
        data: {
          vehicles: updatedVehicles,
          stations: await dbAll('SELECT * FROM AQIStations'),
          timestamp: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error('Error in simulation loop:', err);
    }
  }, 4000); // Trigger simulation frame every 4 seconds
};

const broadcastToAll = (wss, payload) => {
  if (!wss) return;
  const messageStr = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(messageStr);
    }
  });
};
