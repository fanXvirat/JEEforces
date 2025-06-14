import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  type: 'Feedback' | 'Report';
  description: string;
  reportedUserId?: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  status: 'Open' | 'Closed';
}

const ReportSchema: Schema<IReport> = new Schema({
  type: {
    type: String,
    enum: ['Feedback', 'Report'],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  // The user who is being reported (optional, for general feedback)
  reportedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  // The user who submitted the report
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
}, { timestamps: true });

const ReportModel = (mongoose.models.Report as mongoose.Model<IReport>) || mongoose.model<IReport>('Report', ReportSchema);

export default ReportModel;