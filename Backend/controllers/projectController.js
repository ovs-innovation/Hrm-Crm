import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Employee from '../models/Employee.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    
    // For each project, fetch its assigned team members via Tasks
    const enrichedProjects = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectName: project.name });
      const employeeIds = [...new Set(tasks.map(t => t.assignedTo))];
      
      const team = await Employee.find({ 
        $or: [
          { employeeId: { $in: employeeIds } },
          { _id: { $in: employeeIds.filter(id => id.length === 24) } } // Only valid ObjectIds
        ]
      }).select('name profilePicture designation');
      
      return { ...project, team };
    }));
    
    res.json(enrichedProjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, client, technologies, projectType, priority, budget, status, startDate, endDate, createdBy } = req.body;
    
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return res.status(400).json({ message: 'Project with this name already exists' });
    }

    const newProject = new Project({
      name,
      description,
      client,
      technologies,
      projectType,
      priority: priority || 'Medium',
      budget,
      status: status || 'Active',
      startDate,
      endDate,
      createdBy
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};
