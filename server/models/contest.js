import mongoose from "mongoose";
const { Schema } = mongoose;

const contestSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    assignedStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ], // Students allowed to access the contest
    problems: [
      {
        type: Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    start_time: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: Date,
      required: [true, "End time is required"],
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"], // Limit to specific values
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

export default mongoose.model("Contest", contestSchema);
