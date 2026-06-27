import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Droplet, 
  Battery, 
  Gauge, 
  AlertTriangle,
  X,
  Calendar,
  Layers,
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  driver_name: string;
  load_type: string;
  load_weight: number;
  cover_status: string;
  water_tank_level: number;
  battery_level: number;
  status: string;
  speed: number;
  last_service_date: string;
  dust_emission?: number;
  fan_speed?: number;
  electrostatic_status?: string;
  mist_pressure?: number;
}

interface FleetMonitoringProps {
  user: { name: string; email: string; role: string } | null;
  vehicles: Vehicle[];
  onAddOrUpdateVehicle: (v: Vehicle) => Promise<boolean>;
  onDeleteVehicle: (id: string) => Promise<boolean>;
}

const FleetMonitoring: React.FC<FleetMonitoringProps> = ({ user, vehicles, onAddOrUpdateVehicle, onDeleteVehicle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');

  // Form state
  const [formId, setFormId] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formLoadType, setFormLoadType] = useState('');
  const [formLoadWeight, setFormLoadWeight] = useState(20);
  const [formCover, setFormCover] = useState('Covered');
  const [formStatus, setFormStatus] = useState('Active');
  const [formWater, setFormWater] = useState(100);
  const [formBattery, setFormBattery] = useState(100);
  const [formServiceDate, setFormServiceDate] = useState('');

  const isAdmin = user?.role === 'admin';

  // Open modal for Create
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormId(`AS-TRK-${100 + vehicles.length + 1}`);
    setFormPlate('');
    setFormDriver('');
    setFormLoadType('Iron Ore');
    setFormLoadWeight(25);
    setFormCover('Covered');
    setFormStatus('Active');
    setFormWater(100);
    setFormBattery(100);
    setFormServiceDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (v: Vehicle) => {
    setIsEditMode(true);
    setEditingId(v.id);
    setFormId(v.id);
    setFormPlate(v.plate_number);
    setFormDriver(v.driver_name);
    setFormLoadType(v.load_type);
    setFormLoadWeight(v.load_weight);
    setFormCover(v.cover_status);
    setFormStatus(v.status);
    setFormWater(v.water_tank_level);
    setFormBattery(v.battery_level);
    setFormServiceDate(v.last_service_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Vehicle = {
      id: formId,
      plate_number: formPlate,
      driver_name: formDriver,
      load_type: formLoadType,
      load_weight: +formLoadWeight,
      cover_status: formCover,
      water_tank_level: +formWater,
      battery_level: +formBattery,
      status: formStatus,
      speed: isEditMode ? (vehicles.find(v => v.id === editingId)?.speed || 0) : 0,
      last_service_date: formServiceDate
    };

    const success = await onAddOrUpdateVehicle(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${id}?`)) {
      await onDeleteVehicle(id);
    }
  };

  // Filter & Search
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.driver_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. TOP UTILITY TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-industrial-bgLight p-4 rounded-xl border dark:border-industrial-border border-slate-200">
        <div className="flex flex-1 w-full gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Search truck ID, driver name or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 text-xs rounded-lg dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary transition"
            />
          </div>
          {/* Filter */}
          <div className="relative w-40">
            <span className="absolute left-3 top-2.5 text-slate-400"><Filter size={14} /></span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 border-slate-200 text-xs rounded-lg dark:text-slate-100 focus:outline-none focus:border-primary transition cursor-pointer appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Maintenance Due">Maintenance Due</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow-md shadow-primary/10 transition"
          >
            <Plus size={14} />
            <span>ADD VEHICLE</span>
          </button>
        )}
      </div>

      {/* 2. FLEET CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((v) => {
          const isWaterLow = v.water_tank_level <= 20;
          const isBatteryLow = v.battery_level <= 15;
          const isSpeedHigh = v.speed > 60;
          const isMaint = v.status === 'Maintenance Due';

          return (
            <div 
              key={v.id} 
              className="rounded-2xl bg-white dark:bg-industrial-bgLight border dark:border-industrial-border border-slate-200 p-5 flex flex-col justify-between glass-card-hover"
            >
              <div>
                {/* Card Title Header */}
                <div className="flex items-start justify-between border-b dark:border-slate-800 border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{v.plate_number}</span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{v.id}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                    isMaint 
                      ? 'bg-danger/10 text-danger border border-danger/20' 
                      : 'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}>
                    {v.status}
                  </span>
                </div>

                {/* Main telemetry points */}
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Driver</span>
                    <span className="dark:text-slate-200 text-slate-800">{v.driver_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Cargo Payload</span>
                    <span className="dark:text-slate-200 text-slate-800">{v.load_weight}t ({v.load_type})</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Cover Status</span>
                    <span className={`font-bold ${v.cover_status === 'Covered' ? 'text-secondary' : 'text-danger'}`}>
                      {v.cover_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Current Speed</span>
                    <span className={`flex items-center gap-1 font-bold ${isSpeedHigh ? 'text-danger animate-pulse' : 'dark:text-slate-200 text-slate-800'}`}>
                      <Gauge size={12} />
                      {Math.round(v.speed)} km/h
                    </span>
                  </div>
                </div>

                {/* Progress Gauges (Water & Battery) */}
                <div className="space-y-3 mt-4 pt-4 border-t dark:border-slate-850 border-slate-100">
                  {/* Water level */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                      <span className="flex items-center gap-1 text-primary"><Droplet size={10} /> Water Tank</span>
                      <span className={isWaterLow ? 'text-danger animate-pulse font-bold' : 'dark:text-slate-300 text-slate-600'}>
                        {v.water_tank_level}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isWaterLow ? 'bg-danger' : 'bg-primary'}`} 
                        style={{ width: `${v.water_tank_level}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Battery level */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold">
                      <span className="flex items-center gap-1 text-secondary"><Battery size={10} /> AeroShield Battery</span>
                      <span className={isBatteryLow ? 'text-danger animate-pulse font-bold' : 'dark:text-slate-300 text-slate-600'}>
                        {v.battery_level}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isBatteryLow ? 'bg-danger' : 'bg-secondary'}`} 
                        style={{ width: `${v.battery_level}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Sensor Health and Maintenance warnings */}
                <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Serviced: {v.last_service_date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers size={12} />
                    <span>Dust Sensor: </span>
                    <span className={v.water_tank_level === 0 ? 'text-danger' : 'text-secondary'}>
                      {v.water_tank_level === 0 ? 'Degraded' : 'Nominal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex gap-2 border-t dark:border-slate-800 border-slate-100 pt-4 mt-5">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    <Edit3 size={12} />
                    <span>EDIT</span>
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition"
                  >
                    <Trash2 size={12} />
                    <span>DELETE</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. ADD/EDIT TRUCK DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-industrial-bgLight rounded-2xl shadow-2xl border dark:border-slate-700 border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b dark:border-slate-800 border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {isEditMode ? `Edit Vehicle Profile: ${editingId}` : 'Register Heavy Mineral Vehicle'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 dark:text-slate-400 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Truck ID */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Truck Identifier</label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 dark:text-slate-100"
                  />
                </div>
                {/* Plate number */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="CG-04-JD-XXXX"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Driver Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Assigned Driver</label>
                <input
                  type="text"
                  required
                  placeholder="Driver Full Name"
                  value={formDriver}
                  onChange={(e) => setFormDriver(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Load Type */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Cargo Type</label>
                  <select
                    value={formLoadType}
                    onChange={(e) => setFormLoadType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  >
                    <option value="Iron Ore">Iron Ore</option>
                    <option value="Coal">Coal</option>
                    <option value="Bauxite">Bauxite</option>
                    <option value="Limestone">Limestone</option>
                    <option value="Fly Ash">Fly Ash</option>
                  </select>
                </div>
                {/* Load Weight */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Cargo Weight (Tons)</label>
                  <input
                    type="number"
                    required
                    value={formLoadWeight}
                    onChange={(e) => setFormLoadWeight(+e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cover status */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Cover Status</label>
                  <select
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  >
                    <option value="Covered">Covered</option>
                    <option value="Uncovered">Uncovered</option>
                  </select>
                </div>
                {/* Vehicle Status */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Vehicle Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance Due">Maintenance Due</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Water Level */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Initial Water level (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={formWater}
                    onChange={(e) => setFormWater(+e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  />
                </div>
                {/* Battery Level */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Initial Battery level (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={formBattery}
                    onChange={(e) => setFormBattery(+e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Service Date */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Last Maintenance Date</label>
                <input
                  type="date"
                  required
                  value={formServiceDate}
                  onChange={(e) => setFormServiceDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg focus:outline-none focus:border-primary dark:text-slate-100"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t dark:border-slate-800 border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border dark:border-slate-700 border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-lg shadow-primary/10"
                >
                  SAVE CONFIGURATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FleetMonitoring;
