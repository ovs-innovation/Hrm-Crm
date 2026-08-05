import React, { useState } from 'react';
import { FiPlus, FiTrash, FiTrendingUp, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const CostSimulator = () => {
  const [name, setName] = useState('New Expansion Team');
  const [positions, setPositions] = useState([
    { designation: 'Senior Software Engineer', department: 'Engineering', count: 5, salary: 120000, location: 'Remote' }
  ]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const addPositionRow = () => {
    setPositions([
      ...positions,
      { designation: 'Sales Representative', department: 'Sales', count: 2, salary: 45000, location: 'Remote' }
    ]);
  };

  const removePositionRow = (index) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...positions];
    updated[index][field] = value;
    setPositions(updated);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/executive/simulate-cost', {
        scenarioName: name,
        virtualPositions: positions
      });
      if (data.success) {
        setResults(data);
        toast.success('Simulation projection generated!');
      }
    } catch (err) {
      toast.error('Simulation failed. Check parameters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Simulation Inputs */}
      <div className="lg:col-span-2 border border-line rounded bg-surface p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-ink">Workforce Cost Simulator</h3>
          <p className="text-xs text-muted">Simulate incremental payroll impacts and financial overheads</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-ink">Scenario Name</label>
          <input 
            type="text"
            className="w-full rounded border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Dynamic Rows */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Virtual Positions</h4>
            <button 
              onClick={addPositionRow}
              className="flex items-center gap-1 text-xs text-brand font-semibold hover:underline"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add Position
            </button>
          </div>

          <div className="space-y-3">
            {positions.map((pos, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-b border-line pb-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-muted font-medium">Designation</label>
                  <input 
                    type="text" 
                    className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand"
                    value={pos.designation}
                    onChange={(e) => handleFieldChange(idx, 'designation', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-medium">Monthly Salary (₹)</label>
                  <input 
                    type="number" 
                    className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand"
                    value={pos.salary}
                    onChange={(e) => handleFieldChange(idx, 'salary', Number(e.target.value))}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-muted font-medium">Count</label>
                    <input 
                      type="number" 
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand"
                      value={pos.count}
                      onChange={(e) => handleFieldChange(idx, 'count', Number(e.target.value))}
                    />
                  </div>
                  <button 
                    onClick={() => removePositionRow(idx)}
                    className="text-muted hover:text-red-500 rounded p-1 mb-0.5"
                  >
                    <FiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={runSimulation}
          disabled={loading}
          className="w-full rounded bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {loading ? 'Simulating Runway Impact...' : 'Generate 12-Month Projection'}
        </button>
      </div>

      {/* Simulation Results Display */}
      <div className="border border-line rounded bg-surface p-6 space-y-6">
        <h3 className="text-sm font-bold text-ink border-b border-line pb-2">Projections & Burn</h3>

        {results ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-soft rounded p-3 text-center">
                <FiDollarSign className="h-5 w-5 text-brand mx-auto mb-1" />
                <p className="text-[10px] text-muted uppercase font-medium">Simulated Monthly Cost</p>
                <p className="text-sm font-extrabold text-ink">₹{Number(results.monthlySimulation).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-soft rounded p-3 text-center">
                <FiTrendingUp className="h-5 w-5 text-brand mx-auto mb-1" />
                <p className="text-[10px] text-muted uppercase font-medium">Total 12-Mo Impact</p>
                <p className="text-sm font-extrabold text-ink">₹{Number(results.totalCostImpact).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">12-Month Projections</h4>
              <div className="divide-y divide-line max-h-[220px] overflow-y-auto pr-1">
                {results.projections.map((proj, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-xs text-ink">
                    <span className="font-medium text-muted">{proj.month}</span>
                    <div className="text-right">
                      <p className="font-bold">₹{Number(proj.simulatedCost).toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-emerald-600 font-semibold">+₹{Number(proj.incrementalCost).toLocaleString('en-IN')} overhead</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <FiBriefcase className="h-8 w-8 opacity-45 mb-2" />
            <p className="text-xs">Configure positions and run simulation to view cost projections.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostSimulator;
