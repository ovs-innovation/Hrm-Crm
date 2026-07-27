import React, { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import { FiDownload, FiCheckCircle, FiCpu, FiTrendingUp, FiShoppingBag, FiLayers, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MODULES = [
  { id: 'Payroll', name: 'Automated Payroll & Tax', price: '$29/mo', desc: 'Process salaries, automate PF/tax declarations, and email digital payslips automatically.', icon: FiDollarSign },
  { id: 'Inventory', name: 'Smart Inventory & POS', price: '$49/mo', desc: 'Sync multi-warehouse stocks, record barcode scans, and compile visual sales charts.', icon: FiLayers },
  { id: 'Helpdesk', name: 'Customer Support Helpdesk', price: '$19/mo', desc: 'Manage inbound support tickets, establish escalation SLA timers, and auto-route issues.', icon: FiCpu },
  { id: 'Assets', name: 'IT Assets & Hardware Logs', price: '$12/mo', desc: 'Monitor corporate devices allocation history, check warranties, and schedule maintenance.', icon: FiTrendingUp },
  { id: 'Training', name: 'LMS & Employee Training Hub', price: '$15/mo', desc: 'Create course models, assign quizzes, track candidate certifications, and log test scores.', icon: FiCheckCircle }
];

const Marketplace = () => {
  const [activePlugins, setActivePlugins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        setActivePlugins(res.data.tenant?.activePlugins || ['Payroll']);
      })
      .catch(() => {
        setActivePlugins(['Payroll']);
      });
  }, []);

  const handleToggleInstall = async (pluginId) => {
    setLoading(true);
    let updated = [];
    if (activePlugins.includes(pluginId)) {
      if (pluginId === 'Payroll') {
        toast.error('The core Payroll plugin is required for employee calculations.');
        setLoading(false);
        return;
      }
      updated = activePlugins.filter(p => p !== pluginId);
    } else {
      updated = [...activePlugins, pluginId];
    }

    try {
      await api.put('/billing/plugins', { plugins: updated });
      setActivePlugins(updated);
      toast.success(`${pluginId} module state updated successfully!`);
    } catch {
      setActivePlugins(updated);
      toast.success(`[Local Mock] Installed/Uninstalled ${pluginId} successfully.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="SaaS App Store Marketplace"
      description="Install enterprise extensions and custom plug-ins instantly"
    >
      <div className="space-y-6 text-ink text-[13px]">
        {/* Marketplace banner */}
        <div className="rounded border border-line bg-surface p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-md font-bold tracking-tight flex items-center gap-1.5 text-ink"><FiShoppingBag className="text-brand" /> Vastora SaaS Marketplace</h3>
            <p className="text-muted leading-relaxed">
              Expand your platform dynamically. Install modules as separate plugins to optimize your subscription usage limits. Click install to activate backend parameters and menu options.
            </p>
          </div>
        </div>

        {/* Grid cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(app => {
            const Icon = app.icon;
            const isInstalled = activePlugins.includes(app.id);

            return (
              <div 
                key={app.id} 
                className={`p-5 rounded border transition-all duration-300 relative flex flex-col justify-between h-64 bg-surface ${
                  isInstalled ? 'border-brand/40 shadow-[0_0_10px_rgba(37,99,235,0.05)]' : 'border-line hover:border-line-hover'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded bg-soft border border-line text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="bg-soft border border-line text-[10px] font-bold text-muted px-2 py-0.5 rounded-full">
                      {app.price}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-ink text-[13px]">{app.name}</h4>
                    <p className="text-muted mt-1.5 leading-relaxed text-[11px] font-medium">{app.desc}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-line pt-4 mt-4">
                  <span className="text-[11px] font-bold text-brand uppercase">
                    {isInstalled ? 'Active Module' : 'Plugin Available'}
                  </span>
                  
                  <button
                    onClick={() => handleToggleInstall(app.id)}
                    disabled={loading}
                    className={`px-4 py-1.5 rounded font-bold transition-all text-[11px] ${
                      isInstalled 
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20' 
                        : 'btn-primary text-white'
                    }`}
                  >
                    {isInstalled ? 'Uninstall' : 'Install Module'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
};

export default Marketplace;
