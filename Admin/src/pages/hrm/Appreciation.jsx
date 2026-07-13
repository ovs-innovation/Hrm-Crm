import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiStar, 
  FiAward, 
  FiHeart, 
  FiThumbsUp, 
  FiPlus, 
  FiGift,
  FiX
} from 'react-icons/fi';

const mockAwards = [
  { 
    id: 1, 
    type: 'Employee of the Month', 
    recipient: 'Sarah Smith', 
    department: 'Design', 
    giver: 'Admin User', 
    date: 'June 2026', 
    message: 'For outstanding creativity and dedication to the new UI redesign project.',
    icon: FiStar,
    color: 'amber'
  },
  { 
    id: 2, 
    type: 'Team Player Award', 
    recipient: 'Mike Johnson', 
    department: 'Engineering', 
    giver: 'Sarah Smith', 
    date: 'July 2026', 
    message: 'Always stepping up to help unblock the team on critical bugs. A true lifesaver!',
    icon: FiThumbsUp,
    color: 'blue'
  },
  { 
    id: 3, 
    type: 'Customer Hero', 
    recipient: 'Emily Davis', 
    department: 'Support', 
    giver: 'Admin User', 
    date: 'July 2026', 
    message: 'Resolved a critical client escalation over the weekend with grace and professionalism.',
    icon: FiHeart,
    color: 'rose'
  },
];

const AppreciationCard = ({ award, index }) => {
  const Icon = award.icon;
  
  const colorMap = {
    amber: 'bg-amber-500 text-amber-500 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10',
    blue: 'bg-blue-500 text-blue-500 border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10',
    rose: 'bg-rose-500 text-rose-500 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10',
    purple: 'bg-purple-500 text-purple-500 border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10'
  };

  const currentTheme = colorMap[award.color] || colorMap.blue;
  // Splitting theme for different parts
  const bgBadgeColor = currentTheme.split(' ')[0]; // bg-color-500
  const textColor = currentTheme.split(' ')[1]; // text-color-500
  const borderAndBg = currentTheme.split(' ').slice(2).join(' '); // border and bg opacity

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
    >
      <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ${bgBadgeColor}`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgBadgeColor} bg-opacity-20 dark:bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">{award.type}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{award.date}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-6">
        <p className="text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">
          "{award.message}"
        </p>
      </div>

      <div className={`mt-auto pt-4 border-t relative z-10 flex items-center justify-between border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
            {award.recipient.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{award.recipient}</p>
            <p className="text-xs font-medium text-slate-500">{award.department}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-slate-400">Awarded by</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{award.giver}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Appreciation = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <FiAward className="text-amber-500 w-6 h-6" />
              </div>
              Kudos & Appreciation
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Celebrate wins and recognize outstanding teamwork.</p>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
          >
            <FiPlus />
            Give Kudos
          </motion.button>
        </div>

        {/* Top Highlight Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 md:p-10 overflow-hidden shadow-lg shadow-amber-500/20"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FiAward className="w-48 h-48 transform rotate-12" />
          </div>
          <div className="relative z-10 max-w-xl text-white">
            <h3 className="text-2xl font-black mb-3">Employee of the Month</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 backdrop-blur-sm flex items-center justify-center text-xl font-black shadow-inner">
                SS
              </div>
              <div>
                <p className="text-xl font-bold">Sarah Smith</p>
                <p className="text-white/80 font-medium">Design Department</p>
              </div>
            </div>
            <p className="text-white/90 leading-relaxed font-medium">
              "Sarah completely transformed our frontend UI design this month, going above and beyond to ensure the best possible user experience. Thank you, Sarah!"
            </p>
          </div>
        </motion.div>

        {/* Awards Wall Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FiStar className="text-amber-500" />
              Recent Recognitions
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAwards.map((award, index) => (
              <AppreciationCard key={award.id} award={award} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Give Kudos Modal Placeholder */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiGift className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Send Appreciation
                </h3>
                <p className="text-slate-500 font-medium mt-2">
                  Recognize a colleague for their hard work.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Who are you recognizing?</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option>Select an employee</option>
                    <option>Sarah Smith</option>
                    <option>Mike Johnson</option>
                    <option>Emily Davis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Award Type</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option>Team Player</option>
                    <option>Customer Hero</option>
                    <option>Innovator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                  <textarea 
                    rows="3" 
                    placeholder="Write a nice message..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      alert('Kudos sent!');
                      setIsModalOpen(false);
                    }}
                    className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                  >
                    Send Kudos
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Appreciation;
