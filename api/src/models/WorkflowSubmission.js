import mongoose from 'mongoose';

const workflowSubmissionSchema = new mongoose.Schema(
  {
    submissionId: { type: String, required: true, unique: true, index: true },
    formId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    applicantName: { type: String, required: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    discordMessageId: { type: String },
  },
  { timestamps: true },
);

export const WorkflowSubmission = mongoose.models.WorkflowSubmission || mongoose.model('WorkflowSubmission', workflowSubmissionSchema);
