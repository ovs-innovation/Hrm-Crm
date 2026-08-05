import mongoose from 'mongoose';
import { tenantScoped } from '../plugins/tenantScope.plugin.js';

const simulationDraftSchema = new mongoose.Schema(
  {
    scenarioName: { type: String, required: true },
    virtualPositions: [
      {
        designation: { type: String, required: true },
        department: { type: String },
        count: { type: Number, default: 1 },
        salary: { type: Number, default: 0 },
        location: { type: String, default: 'Remote' }
      }
    ],
    totalCostImpact: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
  },
  { timestamps: true }
);

tenantScoped(simulationDraftSchema);

const SimulationDraft = mongoose.model('SimulationDraft', simulationDraftSchema);
export default SimulationDraft;
