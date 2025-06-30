import mongoose from "mongoose";

const CodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  codeByLanguage: {
    java: {
      type: String,
      default: '',
      maxlength: 100000, // Limit code length to prevent abuse
    },
    python: {
      type: String,
      default: '',
      maxlength: 100000,
    },
    cpp: {
      type: String,
      default: '',
      maxlength: 100000,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // Add indexes for better query performance
  indexes: [
    { userId: 1, problemId: 1 }, // Compound index for frequent queries
    { updatedAt: -1 }, // Index for sorting by last updated
  ]
});

// Create compound unique index to prevent duplicate records
CodeSchema.index({ userId: 1, problemId: 1 }, { unique: true });

// Automatically update the 'updatedAt' field on document update
CodeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-hook for findOneAndUpdate to update the updatedAt field
CodeSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Instance method to check if code has content
CodeSchema.methods.hasContent = function() {
  return Object.values(this.codeByLanguage).some(code => code && code.trim().length > 0);
};

// Static method to get code with fallback
CodeSchema.statics.getCodeWithFallback = async function(userId, problemId) {
  try {
    const code = await this.findOne({ userId, problemId });
    if (code) {
      return code.codeByLanguage;
    }
    // Return default empty code structure
    return {
      java: '',
      python: '',
      cpp: ''
    };
  } catch (error) {
    console.error('Error fetching code:', error);
    throw error;
  }
};

const Code = mongoose.model("Code", CodeSchema);

export default Code;
