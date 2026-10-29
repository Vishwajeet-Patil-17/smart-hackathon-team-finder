import mongoose from 'mongoose';
const { Schema } = mongoose;

export const UserSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@walchandsangli\.ac\.in$/, 'Must be a valid Walchand email (name.surname@walchandsangli.ac.in)'],
  },
  passwordHash: { type: String, required: true },
  department: { type: String, required: true },
  academicYear: {
    type: String,
    required: true,
    enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
  },
  skills: [{
    name: { type: String, required: true, trim: true },
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
  }],
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate',
  },
  interests: [{ type: String, trim: true }],
  preferredRoles: [{ type: String, trim: true }],
  availability: { type: String, default: '15-20 hrs/week' },
  bio: { type: String, default: '' },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
  relevantExperience: { type: String },
  idCard: {
    assetId: { type: String },
    resourceType: { type: String, default: 'image' },
    format: { type: String },
    secureUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    isRestricted: { type: Boolean, default: true },
    storageProvider: { type: String, default: 'cloudinary' },
  },
}, { timestamps: true });

export const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  idea: { type: String, required: true },
  description: { type: String, required: true },
  problemStatement: { type: String, required: true },
  domain: { type: String, required: true },
  technicalApproach: { type: String, required: true },
  requiredSkills: [{
    skill: { type: String, required: true, trim: true },
    minProficiency: { type: String },
    isMandatory: { type: Boolean, default: true },
  }],
  requiredRoles: [{ type: String, required: true, trim: true }],
  totalTeamSize: { type: Number, required: true, min: 2, max: 10, default: 4 },
  preferredExperienceLevel: { type: String, default: 'Intermediate' },
  memberResponsibilities: { type: String, default: '' },
  timeline: { type: String, default: '4 Weeks' },
  expectedAvailability: { type: String, default: '15-20 hrs/week' },
  recruitmentStatus: {
    type: String,
    enum: ['Open', 'Closed', 'Completed', 'Cancelled'],
    default: 'Open',
  },
  leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export const InvitationSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposedRole: { type: String, required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
}, { timestamps: true });
InvitationSchema.index({ projectId: 1, candidateId: 1, status: 1 });

export const TaskSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
  deadline: { type: Date, required: true },
  completedAt: { type: Date },
}, { timestamps: true });

export const LeaderEvaluationSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  evaluationPeriod: { type: String, default: 'Final Sprint' },
  ratings: {
    taskContribution: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    teamwork: { type: Number, min: 1, max: 5, required: true },
    responsibility: { type: Number, min: 1, max: 5, required: true },
    technicalContribution: { type: Number, min: 1, max: 5, required: true },
  },
  averageRating: { type: Number, required: true },
  comment: { type: String, default: '' },
}, { timestamps: true });

export const PeerEvaluationSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  evaluatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatedMemberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  evaluationPeriod: { type: String, default: 'Final Sprint' },
  ratings: {
    taskContribution: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    teamwork: { type: Number, min: 1, max: 5, required: true },
    responsibility: { type: Number, min: 1, max: 5, required: true },
    technicalContribution: { type: Number, min: 1, max: 5, required: true },
  },
  averageRating: { type: Number, required: true },
  comment: { type: String, default: '' },
  isConfidential: { type: Boolean, default: true },
}, { timestamps: true });

export const TeamMessageSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'Team Member' },
  content: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const InvitationModel = mongoose.models.Invitation || mongoose.model('Invitation', InvitationSchema);
export const TaskModel = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const LeaderEvalModel = mongoose.models.LeaderEvaluation || mongoose.model('LeaderEvaluation', LeaderEvaluationSchema);
export const PeerEvalModel = mongoose.models.PeerEvaluation || mongoose.model('PeerEvaluation', PeerEvaluationSchema);
export const TeamMessageModel = mongoose.models.TeamMessage || mongoose.model('TeamMessage', TeamMessageSchema);
