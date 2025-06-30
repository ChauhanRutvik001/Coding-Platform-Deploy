import mongoose, { mongo } from "mongoose";
import { ROLES, SEM, BRANCH } from "../utils/constants.js";
import bcrypt from "bcrypt";
const { Schema } = mongoose;
import { v4 as uuidv4 } from "uuid";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
    },
    id: {
      type: String,
      unique: true,
      default: function () {
        return uuidv4();
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: function () {
        return this.role === ROLES.FACULTY;
      },
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    mobileNo: {
      type: String,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },
    branch: {
      type: String,
      enum: Object.values(BRANCH),
      default: BRANCH.CSPIT_IT,
    },
    semester: {
      type: String,
      enum: Object.values(SEM),
      default: SEM.ONE,
    },
    batch: {
      type: String,
      lowercase: true,
      default: "a1",
    },
    subject: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    firstTimeLogin: {
      type: Boolean,
      default: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    profile: {
      name: {
        type: String,
      },
      bio: {
        type: String,
      },
      avatar: {
        type: String,
      },
      github: {
        type: String,
      },
      linkedIn: {
        type: String,
      },
      birthday: {
        type: String,
      },
      gender: {
        type: String,
      },
      skills: {
        type: String,
      },
      education: {
        type: String,
      },
      location: {
        type: String,
      },
    },    submissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],    apiKeys: [      {
        key: {
          type: String,
          required: true, // This stores the actual API key for Judge0 API calls
        },
        name: {
          type: String,
          required: true,
        },
        dailyUsage: {
          type: Number,
          default: 0,
        },
        dailyLimit: {
          type: Number,
          default: 50,
        },
        lastResetDate: {
          type: Date,
          default: Date.now,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    sessionId: {
      type: String,
      default: null,
    },
    lastLoginTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { email: 1, role: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password, DBpassword) {
  console.log(password, DBpassword);
  const isMatch = await bcrypt.compare(password, DBpassword);
  return isMatch;
};

export default mongoose.model("User", userSchema);
