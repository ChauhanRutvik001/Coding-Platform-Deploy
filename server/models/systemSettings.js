import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
  settingName: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
