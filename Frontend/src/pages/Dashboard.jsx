import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components';
import { FiClock, FiCalendar, FiCheckCircle, FiLogOut, FiAlertCircle, FiBriefcase, FiHome, FiMapPin, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const user = useSelector((state) => state.auth.user || { name: 'Employee' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 5000);
  };

  // --- GEOFENCING CONFIGURATION ---
  const OFFICE_LAT = 28.582078;
  const OFFICE_LON = 77.365970;
  const ALLOWED_RADIUS_METERS = 50;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && (user._id || user.employeeId)) {
          const userId = user._id || user.employeeId;
          const res = await api.get(`/attendance?employeeId=${userId}`);
          const fetchedRecords = res.data;

          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

          const pendingStr = localStorage.getItem('pendingCheckIn');
          if (pendingStr) {
            const pending = JSON.parse(pendingStr);
            if (pending.date === today) {
              setIsCheckedIn(true);
              setRecords([pending, ...fetchedRecords]);
              return;
            } else {
              localStorage.removeItem('pendingCheckIn');
            }
          }

          setRecords(fetchedRecords);
          const latestRecord = fetchedRecords[0];
          if (latestRecord && latestRecord.date === today && !latestRecord.checkOut) {
            setIsCheckedIn(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch attendance', err);
      }

      try {
        const holidayRes = await api.get('/holidays');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureHolidays = holidayRes.data.filter(h => new Date(h.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);

        setUpcomingHolidays(futureHolidays);
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      }

      try {
        const annRes = await api.get('/announcements');
        setAnnouncements(annRes.data.slice(0, 3)); // show top 3 latest
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateString);
    const diffTime = Math.abs(holidayDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const formatHolidayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    setIsModeModalOpen(false);
    setLocationError('');

    if (mode === 'Home') {
      performCheckIn('Home');
      return;
    }

    // Both Office and Field need Geolocation
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    const handleLocationSuccess = (position) => {
      setIsLocating(false);
      const empLat = position.coords.latitude;
      const empLon = position.coords.longitude;

      if (mode === 'Office') {
        const distance = calculateDistance(OFFICE_LAT, OFFICE_LON, empLat, empLon);
        if (distance <= ALLOWED_RADIUS_METERS) {
          performCheckIn('Office', { lat: empLat, lon: empLon });
        } else {
          setLocationError(`You are ${Math.round(distance)}m away from the office. Please check in from the office, or select a different mode.`);
        }
      } else if (mode === 'Field') {
        performCheckIn('Field', { lat: empLat, lon: empLon });
      }
    };

    const handleLocationError = (error, retry = true) => {
      if (retry && (error.code === 3 || error.code === 2)) {
        // Timeout or Position Unavailable: retry without high accuracy
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          (err) => handleLocationError(err, false),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
        return;
      }

      setIsLocating(false);
      let errMsg = 'Unable to retrieve location.';
      if (error.code === 1) errMsg = 'Location permission denied. Please allow location access in your browser settings.';
      else if (error.code === 2) errMsg = 'Location unavailable. Ensure your GPS/location services are turned on.';
      else if (error.code === 3) errMsg = 'Location request timed out. Please try again or check your network.';

      setLocationError(errMsg);
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      (error) => handleLocationError(error, true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const performCheckIn = async (mode, locationData = null) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const isLate = hours > 10 || (hours === 10 && minutes > 0);
      const status = isLate ? 'Late (Active)' : 'Present (Active)';

      const pendingRecord = {
        id: 'pending-' + Date.now(),
        date: today,
        checkIn: timeStr,
        status: status,
        workMode: mode
      };
      localStorage.setItem('pendingCheckIn', JSON.stringify(pendingRecord));

      if (isLate) {
        showToast(`You are late! Check-in recorded at ${timeStr}. Official shift starts at 10:00 AM.`, 'warning');
      } else {
        showToast(`Checked in from ${mode} successfully! Have a great day.`, 'success');
      }

      setRecords([pendingRecord, ...records]);
      setIsCheckedIn(true);
    } catch (error) {
      console.error('Check-in error', error);
      showToast('Failed to check in locally', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!user || !(user._id || user.employeeId)) return;
      const userId = user._id || user.employeeId;

      const today = new Date().toISOString().split('T')[0];
      const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hours = currentTime.getHours();
      const isEarly = hours < 18;

      const pendingStr = localStorage.getItem('pendingCheckIn');
      if (!pendingStr) {
        showToast('No active check-in found.', 'error');
        return;
      }
      const pendingRecord = JSON.parse(pendingStr);

      let finalStatus = isEarly ? 'Early Leave' : 'Completed';
      if (pendingRecord.status.includes('Late')) {
        finalStatus = isEarly ? 'Late & Early Leave' : 'Late (Completed)';
      }

      const res = await api.post('/attendance/checkin', {
        employeeId: userId,
        date: today,
        checkIn: pendingRecord.checkIn,
        checkOut: timeStr,
        status: finalStatus,
        workMode: pendingRecord.workMode
      });

      localStorage.removeItem('pendingCheckIn');

      if (isEarly) {
        showToast(`You checked out early at ${timeStr}. Shift ends at 6:00 PM.`, 'warning');
      } else {
        showToast('Shift Completed! Have a great evening.', 'success');
      }

      const updatedRecords = records.map(record =>
        record.date === today ? res.data : record
      );

      setRecords(updatedRecords);
      setIsCheckedIn(false);
    } catch (error) {
      console.error('Check-out error', error);
      showToast('Failed to save attendance record', 'error');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = `${getGreeting()}, ${user.name}! 👋`;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div
        className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800"
      >
        <div className="relative z-10">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
          >
            {greeting}
          </h2>
          <p
            className="text-slate-400 mb-8 max-w-lg text-sm md:text-base leading-relaxed"
          >
            You have 1 pending task and an upcoming team meeting at 2:00 PM. Have a great day at work!
          </p>

          <div
            className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 bg-slate-800/50 w-full sm:w-max px-6 py-4 rounded-2xl backdrop-blur-md border border-slate-700/50"
          >
            <div className="text-center sm:pr-6 border-b sm:border-b-0 sm:border-r border-slate-700/50 pb-4 sm:pb-0 w-full sm:w-auto">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Current Time</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-white">{formatTime(currentTime)}</p>
            </div>
            <div className="flex flex-col items-center sm:items-start relative w-full sm:w-auto">
              {!isCheckedIn ? (
                <button
                  disabled={isLocating}
                  className={`flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 ${isLocating
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-offset-slate-900'
                    }`}
                  onClick={() => setIsModeModalOpen(true)}
                >
                  <FiClock className={`mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Verifying Location...' : 'Check In Now'}
                </button>
              ) : (
                <button
                  className="flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:scale-105 hover:shadow-lg"
                  onClick={handleCheckOut}
                >
                  <FiLogOut className="mr-2" />
                  Check Out
                </button>
              )}
              {locationError && (
                <div className="absolute top-full mt-3 left-0 min-w-max p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl shadow-lg backdrop-blur-md z-50">
                  {locationError}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Leaves */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: 'Present', value: `${records.filter(r => r.status.includes('Present') || r.status === 'Completed').length} Days`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Absent', value: '0 Days', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'Leaves', value: '12 Left', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Late', value: `${records.filter(r => r.status.includes('Late')).length}`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
            ].map((stat, i) => (
              <div key={i} className="p-5 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 mx-auto rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                  <FiCalendar className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h4>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          <div>
            <Card title="Recent Attendance" className="border border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Check In</th>
                      <th className="py-4 px-6 font-semibold">Check Out</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                    {records.slice(0, 4).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">{row.date}</td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col">
                            <span>{row.checkIn || '--:--'}</span>
                            {row.workMode && (
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                                {row.workMode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{row.checkOut || '--:--'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border
                            ${row.status.includes('Present') || row.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                              row.status.includes('Late') ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Upcoming Holidays & Announcements */}
        <div className="space-y-6">
          <div>
            <Card title="Upcoming Holidays" className="border border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 rounded-2xl">
              <div className="space-y-5 p-2">
                {upcomingHolidays.length > 0 ? upcomingHolidays.map((holiday, i) => {
                  const formattedDate = formatHolidayDate(holiday.date);
                  return (
                    <div key={holiday._id || i} className="flex items-center gap-4 group">
                      <div className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl p-3 text-center min-w-[4rem] border border-slate-100 dark:border-slate-700 group-hover:border-blue-500/30 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors flex-shrink-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider">{formattedDate.split(' ')[0]}</span>
                        <span className="block text-lg font-black leading-none mt-1">{formattedDate.split(' ')[1].replace(',', '')}</span>
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{holiday.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700">{holiday.type}</span>
                          <span className="text-xs text-blue-500 font-semibold">{getDaysUntil(holiday.date)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center text-slate-500 py-4 text-sm">No upcoming holidays scheduled.</div>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card title="Announcements" className="border border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900 rounded-2xl relative overflow-hidden">
              <div className="space-y-4 p-2">
                {announcements.length > 0 ? announcements.map((ann, i) => {
                  let colorClass = 'border-blue-500 bg-blue-500';
                  if (ann.type === 'Urgent') colorClass = 'border-rose-500 bg-rose-500';
                  if (ann.type === 'Event') colorClass = 'border-emerald-500 bg-emerald-500';
                  return (
                    <div key={ann._id || i} className={`border-l-2 pl-4 py-1 relative ${colorClass.split(' ')[0]}`}>
                      <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-2 ${colorClass.split(' ')[1]}`}></div>
                      <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{ann.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ann.description}</p>
                    </div>
                  );
                }) : (
                  <div className="text-center text-slate-500 py-4 text-sm">No new announcements.</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mode Selection Modal */}
      {isModeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsModeModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
          >
            <button
              onClick={() => setIsModeModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Where are you working from?</h3>
              <p className="text-slate-500 font-medium mt-2">Select your work mode for today's check-in.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleModeSelection('Office')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiBriefcase className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Office</span>
                <span className="text-[10px] text-slate-500 text-center mt-1">Requires GPS Verification</span>
              </button>

              <button
                onClick={() => handleModeSelection('Home')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiHome className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Home</span>
                <span className="text-[10px] text-slate-500 text-center mt-1">Instant Check-in</span>
              </button>

              <button
                onClick={() => handleModeSelection('Field')}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FiMapPin className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Field Work</span>
                <span className="text-[10px] text-slate-500 text-center mt-1">Logs GPS Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-20 right-8 z-50 px-5 py-3.5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transform transition-all duration-300 flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'warning'
          ? 'bg-slate-900/95 border-blue-500/30 text-slate-100'
          : 'bg-slate-900/95 border-emerald-500/30 text-slate-100'
          }`}>
          <div className={`p-2 rounded-xl ${toast.type === 'warning' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {toast.type === 'warning' ? <FiAlertCircle className="w-5 h-5" /> : <FiCheckCircle className="w-5 h-5" />}
          </div>
          <span className="font-medium text-sm tracking-wide text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
