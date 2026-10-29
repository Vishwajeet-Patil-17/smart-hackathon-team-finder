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
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Must be a valid email address'],
  },
  passwordHash: { type: String, required: true },
  department: { type: String, required: true },
  academicYear: {
    type: String,
    required: true,
    default: 'Third Year',
  },
  skills: [{
    name: { type: String, required: true, trim: true },
    proficiency: { type: String, default: 'Intermediate' },
  }],
  experienceLevel: {
    type: String,
    default: 'Intermediate',
  },
  interests: [{ type: String, trim: true }],
  preferredRoles: [{ type: String, trim: true }],
  availability: { type: String, default: '15-20 hrs/week' },
  bio: { type: String, default: 'Walchand College engineering student and active hackathon participant.' },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
  relevantExperience: { type: String },
  idCard: {
    assetId: { type: String },
    resourceType: { type: String, default: 'image' },
    format: { type: String },
    secureUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    isRestricted: { type: Boolean, default: false },
    storageProvider: { type: String, default: 'secure-vault' },
  },
}, { timestamps: true, strict: false });

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
  leaderId: { type: Schema.Types.Mixed, required: true },
  leaderName: { type: String },
  leaderEmail: { type: String },
  teamMembers: [{
    userId: { type: Schema.Types.Mixed, required: true },
    fullName: { type: String },
    name: { type: String },
    email: { type: String },
    role: { type: String, required: true },
    department: { type: String },
    academicYear: { type: String },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true, strict: false });

export const InvitationSchema = new Schema({
  projectId: { type: Schema.Types.Mixed, required: true },
  projectName: { type: String },
  projectDomain: { type: String },
  candidateId: { type: Schema.Types.Mixed, required: true },
  candidateName: { type: String },
  candidateEmail: { type: String },
  candidateDepartment: { type: String },
  candidateAcademicYear: { type: String },
  leaderId: { type: Schema.Types.Mixed, required: true },
  leaderName: { type: String },
  leaderEmail: { type: String },
  proposedRole: { type: String, required: true },
  message: { type: String, default: '' },
  type: {
    type: String,
    enum: ['invitation', 'join_request'],
    default: 'invitation',
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
}, { timestamps: true, strict: false });
InvitationSchema.index({ projectId: 1, candidateId: 1, status: 1 });

export const TaskSchema = new Schema({
  projectId: { type: Schema.Types.Mixed, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: Schema.Types.Mixed, required: true },
  createdBy: { type: Schema.Types.Mixed, required: true },
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
  completedOnTime: { type: Boolean },
  isOverdue: { type: Boolean, default: false },
}, { timestamps: true });

export const LeaderEvaluationSchema = new Schema({
  projectId: { type: Schema.Types.Mixed, required: true },
  leaderId: { type: Schema.Types.Mixed, required: true },
  memberId: { type: Schema.Types.Mixed, required: true },
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
  projectId: { type: Schema.Types.Mixed, required: true },
  evaluatorId: { type: Schema.Types.Mixed, required: true },
  evaluatedMemberId: { type: Schema.Types.Mixed, required: true },
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
  projectId: { type: Schema.Types.Mixed, required: true },
  authorId: { type: Schema.Types.Mixed, required: true },
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
