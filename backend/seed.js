import bcrypt from 'bcryptjs';
import { dbRun, initDb, dbGet } from './db.js';

const seed = async () => {
  // Ensure tables exist
  await initDb();

  console.log('Seeding default users...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('password123', salt);
  const managerHash = await bcrypt.hash('password123', salt);
  const publicHash = await bcrypt.hash('password123', salt);

  try {
    // Clean up existing seeded data to start fresh
    await dbRun('DELETE FROM Users');
    await dbRun('DELETE FROM Vehicles');
    await dbRun('DELETE FROM AQIStations');
    await dbRun('DELETE FROM Alerts');
    await dbRun('DELETE FROM Predictions');
    await dbRun('DELETE FROM Settings');
    await dbRun('DELETE FROM Telemetry');

    // Users
    await dbRun(
      'INSERT INTO Users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      ['admin@aeroshield.com', adminHash, 'System Administrator', 'admin']
    );
    await dbRun(
      'INSERT INTO Users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      ['manager@aeroshield.com', managerHash, 'Raipur Fleet Manager', 'manager']
    );
    await dbRun(
      'INSERT INTO Users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      ['public@aeroshield.com', publicHash, 'Public Citizen', 'public']
    );

    // Vehicles (Raipur - Bhilai route trucks)
    const vehicles = [
      { id: 'AS-TRK-101', plate_number: 'CG-04-JD-1201', driver_name: 'Rajesh Kumar', load_type: 'Iron Ore', load_weight: 24.5, cover_status: 'Covered', water_tank_level: 85.0, battery_level: 92.0, status: 'Active', speed: 45.0, last_service_date: '2026-05-15' },
      { id: 'AS-TRK-102', plate_number: 'CG-04-JD-1202', driver_name: 'Amit Sharma', load_type: 'Coal', load_weight: 28.0, cover_status: 'Uncovered', water_tank_level: 15.0, battery_level: 88.0, status: 'Active', speed: 52.0, last_service_date: '2026-06-01' },
      { id: 'AS-TRK-103', plate_number: 'CG-07-LH-4512', driver_name: 'Gurpreet Singh', load_type: 'Bauxite', load_weight: 22.0, cover_status: 'Covered', water_tank_level: 60.0, battery_level: 79.0, status: 'Active', speed: 40.0, last_service_date: '2026-04-20' },
      { id: 'AS-TRK-104', plate_number: 'CG-07-LH-4513', driver_name: 'Dinesh Patel', load_type: 'Limestone', load_weight: 26.5, cover_status: 'Covered', water_tank_level: 5.0, battery_level: 14.0, status: 'Maintenance Due', speed: 0.0, last_service_date: '2026-02-10' },
      { id: 'AS-TRK-105', plate_number: 'CG-08-KL-9877', driver_name: 'Sanjay Yadav', load_type: 'Fly Ash', load_weight: 18.0, cover_status: 'Covered', water_tank_level: 95.0, battery_level: 95.0, status: 'Active', speed: 55.0, last_service_date: '2026-06-18' },
      { id: 'AS-TRK-106', plate_number: 'CG-08-KL-9878', driver_name: 'Ramesh Sen', load_type: 'Iron Ore', load_weight: 25.0, cover_status: 'Uncovered', water_tank_level: 50.0, battery_level: 82.0, status: 'Active', speed: 68.0, last_service_date: '2026-05-30' },
    ];

    for (const v of vehicles) {
      await dbRun(
        'INSERT INTO Vehicles (id, plate_number, driver_name, load_type, load_weight, cover_status, water_tank_level, battery_level, status, speed, last_service_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [v.id, v.plate_number, v.driver_name, v.load_type, v.load_weight, v.cover_status, v.water_tank_level, v.battery_level, v.status, v.speed, v.last_service_date]
      );
    }

    // AQI Stations
    const stations = [
      { id: 'ST-URLA', name: 'Urla Industrial Area', lat: 21.3120, lng: 81.6150, current_aqi: 285, pm25: 110, pm10: 245, temp: 36.5, humidity: 48.0, wind_speed: 12.5 },
      { id: 'ST-SILT', name: 'Siltara Industrial Zone', lat: 21.3850, lng: 81.6520, current_aqi: 310, pm25: 135, pm10: 290, temp: 37.0, humidity: 42.0, wind_speed: 10.0 },
      { id: 'ST-BHIL', name: 'Bhilai Steel Plant Area', lat: 21.1890, lng: 81.3910, current_aqi: 240, pm25: 88, pm10: 195, temp: 35.8, humidity: 52.0, wind_speed: 14.2 },
      { id: 'ST-RAPR', name: 'Raipur City Center', lat: 21.2514, lng: 81.6296, current_aqi: 142, pm25: 42, pm10: 95, temp: 34.0, humidity: 58.0, wind_speed: 8.5 },
      { id: 'ST-DURG', name: 'Durg Railway Station Area', lat: 21.1904, lng: 81.2849, current_aqi: 178, pm25: 58, pm10: 124, temp: 35.0, humidity: 55.0, wind_speed: 9.8 },
    ];

    for (const s of stations) {
      await dbRun(
        'INSERT INTO AQIStations (id, name, lat, lng, current_aqi, pm25, pm10, temp, humidity, wind_speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.name, s.lat, s.lng, s.current_aqi, s.pm25, s.pm10, s.temp, s.humidity, s.wind_speed]
      );
    }

    // Default Alerts
    const initialAlerts = [
      { vehicle_id: 'AS-TRK-102', type: 'LOW_WATER', message: 'AeroShield water tank level critical (15%) on CG-04-JD-1202', severity: 'warning', resolved: 0, timestamp: new Date().toISOString() },
      { vehicle_id: 'AS-TRK-104', type: 'SYSTEM_OFFLINE', message: 'AeroShield system offline on vehicle CG-07-LH-4513 - Battery Critical', severity: 'danger', resolved: 0, timestamp: new Date().toISOString() },
      { vehicle_id: 'AS-TRK-106', type: 'SPEEDING', message: 'Vehicle CG-08-KL-9878 speeding (68 km/h) in sensitive zone near Urla School', severity: 'danger', resolved: 0, timestamp: new Date().toISOString() },
      { vehicle_id: null, type: 'CRITICAL_AQI', message: 'AQI at Siltara Industrial Zone exceeded 300 (Hazardous)', severity: 'danger', resolved: 0, timestamp: new Date().toISOString() },
    ];

    for (const a of initialAlerts) {
      await dbRun(
        'INSERT INTO Alerts (vehicle_id, type, message, severity, resolved, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [a.vehicle_id, a.type, a.message, a.severity, a.resolved, a.timestamp]
      );
    }

    // AI Predictions
    const predictions = [
      { target: 'AQI_CORRIDOR_TOMORROW', type: 'AQI', predicted_value: '265', confidence: 88.5, timestamp: new Date().toISOString() },
      { target: 'FAILURE_RISK_AS_TRK_104', type: 'MAINTENANCE', predicted_value: 'High Risk (92%) - Battery & Water Pump servicing past due', confidence: 94.0, timestamp: new Date().toISOString() },
      { target: 'TRAFFIC_CONGESTION_NH53_PM', type: 'TRAFFIC', predicted_value: 'Heavy (Peak Hours 17:00 - 20:00)', confidence: 82.0, timestamp: new Date().toISOString() },
      { target: 'DUST_HOTSPOT_EXPANSION_URLA', type: 'HOTSPOT', predicted_value: 'Expansion Eastward toward residential zones by 1.2km', confidence: 79.5, timestamp: new Date().toISOString() },
      { target: 'HEALTH_RISK_INDEX_TOMORROW', type: 'HEALTH', predicted_value: 'High Risk (Level 4/5) - High PM10 and low wind speed', confidence: 86.0, timestamp: new Date().toISOString() },
    ];

    for (const p of predictions) {
      await dbRun(
        'INSERT INTO Predictions (target, type, predicted_value, confidence, timestamp) VALUES (?, ?, ?, ?, ?)',
        [p.target, p.type, p.predicted_value, p.confidence, p.timestamp]
      );
    }

    // Default Settings
    await dbRun('INSERT INTO Settings (key, value) VALUES (?, ?)', ['aqi_danger_threshold', '250']);
    await dbRun('INSERT INTO Settings (key, value) VALUES (?, ?)', ['speed_limit', '60']);
    await dbRun('INSERT INTO Settings (key, value) VALUES (?, ?)', ['low_water_threshold', '20']);
    await dbRun('INSERT INTO Settings (key, value) VALUES (?, ?)', ['mitigation_mode', 'Auto']);

    console.log('Database successfully seeded!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

seed();
