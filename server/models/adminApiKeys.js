import mongoose from "mongoose";

const adminApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },  key: {
    type: String,
    required: true,
    unique: true  // This stores the actual API key for Judge0 API calls
  },
  dailyUsage: {
    type: Number,
    default: 0
  },dailyLimit: {
    type: Number,
    default: 5000  // Higher limit for admin keys
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
adminApiKeySchema.index({ isActive: 1, dailyUsage: 1 });
adminApiKeySchema.index({ lastResetDate: 1 });

const AdminApiKey = mongoose.model("AdminApiKey", adminApiKeySchema);

export default AdminApiKey;
