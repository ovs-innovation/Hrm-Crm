import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiDownload, FiMoreVertical, FiEdit2, FiEye, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { Button, Card, Input, Skeleton } from '../components';
import Modal from '../components/Modal';
import AddEmployeeForm from '../features/employees/components/AddEmployeeForm';

import api from '../services/api';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Action states
  const [viewEmployee, setViewEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);

  // Handle auto-hiding toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      // Normalize _id or employeeId to 'id' for the UI component if needed, or keep as is.
      const normalizedEmployees = response.data.map(emp => ({
        ...emp,
        id: emp.employeeId || emp._id
      }));
      setEmployees(normalizedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setToastMessage('Failed to fetch employees from server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = (newEmployee) => {
    setEmployees([newEmployee, ...employees]);
    setIsAddModalOpen(false);
    setToastMessage(`Employee added! Invitation email sent to ${newEmployee.email} with the setup link.`);
  };

  const handleDelete = () => {
    if (deleteEmployee) {
      setEmployees(employees.filter(e => e.id !== deleteEmployee.id));
      setToastMessage(`Employee ${deleteEmployee.name} removed successfully.`);
      setDeleteEmployee(null);
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Manage Staff</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">View and manage all employees</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="border border-slate-200 dark:border-slate-700">
            <FiFilter className="mr-2" /> Filter
          </Button>
          <Button variant="ghost" className="border border-slate-200 dark:border-slate-700">
            <FiDownload className="mr-2" /> Export
          </Button>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <FiPlus className="mr-2" /> Add Staff
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="w-full max-w-sm">
            <input 
              type="text" 
              placeholder="Search by ID, Name or Email..." 
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {employees.length} entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold whitespace-nowrap">Employee ID</th>
                <th className="p-4 font-semibold whitespace-nowrap">Name</th>
                <th className="p-4 font-semibold whitespace-nowrap">Email</th>
                <th className="p-4 font-semibold whitespace-nowrap">Branch</th>
                <th className="p-4 font-semibold whitespace-nowrap">Department</th>
                <th className="p-4 font-semibold whitespace-nowrap">Designation</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date of Join</th>
                <th className="p-4 font-semibold whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={`sk-emp-${i}`}>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">
                    No employees found.
                  </td>
                </tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {emp.id}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        {emp.name.charAt(0)}
                      </div>
                      {emp.name}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{emp.email}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{emp.branch}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{emp.department}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{emp.designation}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{emp.joinDate}</td>
                  <td className="p-4 text-right relative whitespace-nowrap">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      <FiMoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === emp.id && (
                      <div className="absolute right-8 top-10 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-10 py-1 overflow-hidden animate-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => { setViewEmployee(emp); setActiveMenu(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <FiEye className="w-4 h-4" /> View
                        </button>
                        <button 
                          onClick={() => { setActiveMenu(null); setToastMessage('Edit functionality coming soon'); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <FiEdit2 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={() => { setDeleteEmployee(emp); setActiveMenu(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="text-sm text-slate-500 dark:text-slate-400">Page 1 of 1</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled>Previous</Button>
            <Button variant="secondary" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Staff"
        size="xl"
      >
        <AddEmployeeForm 
          onCancel={() => setIsAddModalOpen(false)}
          onSuccess={handleAddEmployee}
        />
      </Modal>

      {/* View Employee Modal */}
      <Modal
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title="Employee Details"
        size="md"
      >
        {viewEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                {viewEmployee.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewEmployee.name}</h3>
                <p className="text-slate-500">{viewEmployee.designation}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  {viewEmployee.id}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Email</p>
                <p className="text-slate-700 font-medium">{viewEmployee.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Department</p>
                <p className="text-slate-700 font-medium">{viewEmployee.department}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Branch</p>
                <p className="text-slate-700 font-medium">{viewEmployee.branch}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Join Date</p>
                <p className="text-slate-700 font-medium">{viewEmployee.joinDate}</p>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setViewEmployee(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        title="Remove Employee"
        size="sm"
      >
        {deleteEmployee && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <FiTrash2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Are you absolutely sure?</h3>
            <p className="text-slate-500 text-sm">
              This will permanently remove <strong>{deleteEmployee.name}</strong> from the system. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="secondary" onClick={() => setDeleteEmployee(null)}>Cancel</Button>
              <button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Simulated Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <FiCheckCircle className="text-emerald-400 w-6 h-6" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
