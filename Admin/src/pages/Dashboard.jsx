import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiUserCheck, 
  FiBriefcase, 
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity
} from 'react-icons/fi';
import { useSelector } from 'react-redux';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, colorClass, delay }) => (
  <div 
    className="bg-navy rounded-3xl p-6 border border-line shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${colorClass}`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-semibold text-muted text-muted mb-1">{label}</p>
        <h3 className="text-4xl font-black text-white">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div className="mt-6 flex items-center gap-2 text-sm relative z-10">
      <span className={`font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
        trend === 'up' ? 'bg-brand/10 text-brand' : 'bg-rose-50 text-brand'
      }`}>
        {trend === 'up' ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
        {trendValue}
      </span>
      <span className="text-muted font-medium">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const adminName = adminInfo.name ? adminInfo.name.split(' ')[0] : 'Admin';
  
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-line pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {greeting}, {adminName}
          </h2>
          <p className="text-muted font-medium">Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          icon={FiUsers} 
          label="Total Staff" 
          value="124" 
          trend="up" 
          trendValue="+12%" 
          colorClass="bg-brand" 
          delay={0.1} 
        />
        <StatCard 
          icon={FiUserCheck} 
          label="Present Today" 
          value="112" 
          trend="up" 
          trendValue="+5%" 
          colorClass="bg-brand" 
          delay={0.2} 
        />
        <StatCard 
          icon={FiBriefcase} 
          label="On Leave" 
          value="12" 
          trend="down" 
          trendValue="-2%" 
          colorClass="bg-brand" 
          delay={0.3} 
        />
        <StatCard 
          icon={FiActivity} 
          label="Open Jobs" 
          value="5" 
          trend="up" 
          trendValue="+1" 
          colorClass="bg-brand" 
          delay={0.4} 
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div 
          className="lg:col-span-2 bg-navy rounded-3xl p-6 md:p-8 border border-line shadow-sm"
        >
          <div className="flex justify-between items-center mb-8 border-b border-line border-line pb-4">
            <h3 className="text-xl font-black text-white">Attendance Overview</h3>
            <select className="bg-surface/50 border border-line text-sm font-semibold text-ink text-muted rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          {/* Custom CSS Bar Chart Mockup (Refined) */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6">
            {[40, 70, 45, 90, 65, 85, 30].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-4 group h-full justify-end">
                <div className="relative w-full bg-surface rounded-xl flex-1 overflow-hidden flex flex-col justify-end">
                  <div 
                    style={{ height: `${height}%` }}
                    className="w-full bg-brand rounded-xl relative group-hover:bg-brand transition-colors shadow-inner"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div 
          className="bg-navy rounded-3xl p-6 md:p-8 border border-line shadow-sm"
        >
          <div className="flex justify-between items-center mb-8 border-b border-line pb-4">
            <h3 className="text-xl font-black text-white">Live Activity</h3>
            <span className="flex h-3 w-3 relative">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
            </span>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-700 before:to-transparent">
            {[
              { title: "Sarah Smith joined", time: "Just now", desc: "Engineering Team", color: "bg-brand" },
              { title: "Leave request approved", time: "2h ago", desc: "Mike Johnson - 3 days", color: "bg-brand" },
              { title: "Project milestone met", time: "5h ago", desc: "Alpha Redesign phase 1", color: "bg-brand" },
              { title: "System update", time: "1d ago", desc: "HRM Core updated to v2.4", color: "bg-slate-400" },
            ].map((item, i) => (
              <div 
                key={i} 
                className="relative flex items-start gap-4 group"
              >
                <div className={`w-10 h-10 rounded-full ${item.color} flex-shrink-0 flex items-center justify-center border-4 border-white border-line z-10 shadow-sm group-hover:scale-110 transition-transform`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="bg-white hover:bg-surface/40 hover:bg-surface border border-line border-line rounded-2xl p-4 flex-1 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-xs font-semibold text-muted">{item.time}</p>
                  </div>
                  <p className="text-xs font-medium text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
