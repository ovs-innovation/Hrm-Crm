export const mockDepartments = [
  { id: '1', name: 'Engineering', head: 'Sarah Smith', employeeCount: 45, status: 'Active' },
  { id: '2', name: 'Human Resources', head: 'Mike Johnson', employeeCount: 12, status: 'Active' },
  { id: '3', name: 'Marketing', head: 'Emily Davis', employeeCount: 28, status: 'Active' },
  { id: '4', name: 'Finance', head: 'Robert Wilson', employeeCount: 15, status: 'Active' },
];

export const mockDesignations = [
  { id: '1', title: 'Software Engineer', department: 'Engineering', level: 'Mid', status: 'Active' },
  { id: '2', title: 'Senior Software Engineer', department: 'Engineering', level: 'Senior', status: 'Active' },
  { id: '3', title: 'HR Manager', department: 'Human Resources', level: 'Manager', status: 'Active' },
  { id: '4', title: 'Marketing Specialist', department: 'Marketing', level: 'Junior', status: 'Active' },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const orgService = {
  getDepartments: async () => {
    await delay(800); // Simulate network latency
    return [...mockDepartments];
  },
  getDesignations: async () => {
    await delay(800);
    return [...mockDesignations];
  }
};
