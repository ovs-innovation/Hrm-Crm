import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** Denormalized client label (legacy + display) */
    client: {
      type: String,
      trim: true,
      default: '',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    technologies: {
      type: String,
      trim: true,
      default: '',
    },
    projectType: {
      type: String,
      trim: true,
      default: 'New Development',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
    },
    /**
     * Stored as Number for new writes. Mixed so legacy string budgets (e.g. demo seed) still load.
     * Controller always coerces/validates to a finite number on create/update.
     */
    budget: {
      type: mongoose.Schema.Types.Mixed,
      default: 0,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Planning',
    },
    startDate: {
      type: Date,
      default: null,
    },
    /** Deadline */
    endDate: {
      type: Date,
      default: null,
    },
    /** Employee codes / ids assigned to the project */
    team: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

tenantScoped(projectSchema);
projectSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export { STATUSES as PROJECT_STATUSES, PRIORITIES as PROJECT_PRIORITIES };
const Project = mongoose.model('Project', projectSchema);

export default Project;
