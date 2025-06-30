import mongoose from "mongoose";
const { Schema } = mongoose;

const batchSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Faculty is required"],
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],      subject: {
      type: String,
      required: false,
    },
    assignedProblems: [
      {
        type: Schema.Types.ObjectId,
        ref: "Problem",
        default: [],
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Batch", batchSchema);
