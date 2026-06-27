import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Sliders, 
  CheckCircle,
  Truck,
  Wind
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
  dust_emission?: number;
}

interface ReportsProps {
  vehicles: Vehicle[];
}

const Reports: React.FC<ReportsProps> = ({ vehicles }) => {
  const [reportType, setReportType] = useState('daily');
  const [format, setFormat] = useState('csv');
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const handleExport = () => {
    setLoading(true);
    setExportMessage('');

    setTimeout(() => {
      try {
        const filteredVehicles = selectedVehicle === 'All' 
          ? vehicles 
          : vehicles.filter(v => v.id === selectedVehicle);

        let fileContent = '';
        let fileName = `AeroShield_${reportType.toUpperCase()}_Report_${startDate}`;

        if (format === 'csv') {
          // CSV compilation
          let headers = 'Vehicle ID,License Plate,Driver Name,Cargo Type,Weight (Tons),Cover Status,Water level (%),Battery Level (%),Dust Emission (mg/m3),Status\n';
          let rows = filteredVehicles.map(v => 
            `"${v.id}","${v.plate_number}","${v.driver_name}","${v.load_type}",${v.load_weight},"${v.cover_status}",${v.water_tank_level},${v.battery_level},${v.dust_emission || 0},"${v.status}"`
          ).join('\n');
          
          fileContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
          fileName += '.csv';
        } else if (format === 'excel') {
          // Mock HTML Excel Table
          let html = '<table><tr><th>Vehicle ID</th><th>License</th><th>Driver</th><th>Cargo</th><th>Tons</th><th>Cover</th><th>Water %</th><th>Battery %</th><th>Dust</th></tr>';
          filteredVehicles.forEach(v => {
            html += `<tr><td>${v.id}</td><td>${v.plate_number}</td><td>${v.driver_name}</td><td>${v.load_type}</td><td>${v.load_weight}</td><td>${v.cover_status}</td><td>${v.water_tank_level}</td><td>${v.battery_level}</td><td>${v.dust_emission || 0}</td></tr>`;
          });
          html += '</table>';
          fileContent = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html);
          fileName += '.xls';
        } else {
          // PDF/Text summary report
          let doc = `AEROSHIELD EMISSION COMPLIANCE REPORT\n`;
          doc += `=====================================\n`;
          doc += `Report Period: ${reportType.toUpperCase()}\n`;
          doc += `Report Date: ${startDate}\n`;
          doc += `Vehicle Scope: ${selectedVehicle}\n`;
          doc += `Total Vehicles Audited: ${filteredVehicles.length}\n`;
          doc += `-------------------------------------\n\n`;
          
          filteredVehicles.forEach(v => {
            doc += `Truck Reference: ${v.id} (${v.plate_number})\n`;
            doc += `- Operator: ${v.driver_name}\n`;
            doc += `- Load Specifics: ${v.load_weight} Tons of ${v.load_type} (${v.cover_status})\n`;
            doc += `- AeroShield Status: Water ${v.water_tank_level}% | Battery ${v.battery_level}%\n`;
            doc += `- Recorded Dust: ${v.dust_emission || 0} mg/m3\n\n`;
          });
          
          fileContent = 'data:application/pdf;charset=utf-8,' + encodeURIComponent(doc);
          fileName += '.txt'; // Exporting as readable txt to simulate local PDF generation
        }

        // Trigger browser download
        const link = document.createElement('a');
        link.setAttribute('href', fileContent);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportMessage(`Successfully exported compliance log: ${fileName}`);
      } catch (err) {
        setExportMessage('Failed to compile export report files.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. REPORT CONFIGURATION TOOLBAR */}
      <div className="bg-white dark:bg-industrial-bgLight p-6 rounded-2xl border dark:border-industrial-border border-slate-200">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Sliders size={16} className="text-primary" />
          <span>Report Configuration Filters</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Report Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Interval Scope</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="daily">Daily Compliance Report</option>
              <option value="weekly">Weekly Summary Audits</option>
              <option value="monthly">Monthly Corridor Metrics</option>
            </select>
          </div>

          {/* Vehicle Select */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Fleet Filter</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All Corridor Trucks</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.id} - {v.plate_number}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Audit Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          {/* File Format */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-750 border-slate-200 text-xs rounded-lg dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="csv">Comma-Separated Value (CSV)</option>
              <option value="excel">Microsoft Excel Layout (XLS)</option>
              <option value="pdf">Document Summary Layout (TXT)</option>
            </select>
          </div>
        </div>

        {exportMessage && (
          <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-semibold flex items-center gap-2">
            <CheckCircle size={14} />
            <span>{exportMessage}</span>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 border-t dark:border-slate-800 border-slate-100 pt-6 flex justify-end">
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>COMPILING REPORT...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>COMPILE & DOWNLOAD REPORT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. PRE-EXPORT COMPLIANCE DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Compliance metrics summary */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col justify-between">
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-secondary" />
              <span>Compliance Standards Summary</span>
            </h5>
            
            <div className="space-y-3 font-medium text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>Fleet Mitigation Standard (85% Target):</span>
                <span className="text-secondary font-bold">COMPLIANT (85.0%)</span>
              </div>
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>Uncovered Cargo Log Violations:</span>
                <span className="text-danger font-bold">2 INCIDENTS RECORDED</span>
              </div>
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>Speeding Alerts in Sensitive Zones:</span>
                <span className="text-danger font-bold">1 ALARM DETECTED</span>
              </div>
              <div className="flex justify-between p-2">
                <span>Average Water Refill Compliance:</span>
                <span className="text-secondary font-bold">94.8% RATIO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental savings calculator widget */}
        <div className="rounded-2xl dark:glass bg-white border border-slate-200 dark:border-industrial-border p-6 flex flex-col justify-between">
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Wind size={16} className="text-primary" />
              <span>Environmental Dust Savings Estimate</span>
            </h5>

            <div className="space-y-3 font-medium text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>Total Dust Emitted (NH-53 corridor):</span>
                <span>462.8 kg</span>
              </div>
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>Estimated Dust Captured via AeroShield:</span>
                <span className="text-secondary font-bold">2,622.5 kg</span>
              </div>
              <div className="flex justify-between p-2 border-b dark:border-slate-800 border-slate-105">
                <span>CO₂ Reduction Equivalency:</span>
                <span className="text-secondary font-bold">~12.4 Metric Tons</span>
              </div>
              <div className="flex justify-between p-2">
                <span>Sensitive Zone Ingress Safety Score:</span>
                <span className="text-secondary font-bold">98.2 / 100</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reports;
