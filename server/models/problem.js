import mongoose from "mongoose";
import { DIFFICULTY } from "../utils/constants.js"; // Ensure this path is correct

const { Schema } = mongoose;

// Sample input/output schema for your sequence strings
const sampleSchema = new Schema({
  input: { type: String, required: [true, "Sample input is required"] }, // Input as a string
  output: { type: String, required: [true, "Sample output is required"] }, // Output as a string
});

// Schema for test cases
const testCaseSchema = new Schema({
  inputs: { type: String, required: true }, // Single input string
  outputs: { type: String, required: true }, // Single output string
  marks: {
    type: Number,
    required: [true, "Marks for the test case are required"],
    min: 0,
  },
  cpu_time_limit: {
    type: Number,
    required: [true, "CPU time limit is required"],
    min: 1, // Minimum 1 seconds
    max: 15, // Maximum 15 seconds
  },
  memory_limit: {
    type: Number,
    required: [true, "Memory limit is required"],
    min: 1, // Minimum 1 MB
    max: 256, // Maximum 256 MB
  },
  is_hidden: {
    type: Boolean,
    default: false, // False means test case is visible
  },
});

// Main problem schema with test cases
const problemSchema = new Schema(
  {
    title: { type: String, required: [true, "Title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: Object.values(DIFFICULTY),
      default: DIFFICULTY.EASY,
    },
    inputFormat: { type: String, required: [true, "Input format is required"] },
    outputFormat: {
      type: String,
      required: [true, "Output format is required"],
    },
    sampleIO: [sampleSchema], // Sample input/output pairs
    testCases: [testCaseSchema], // Test cases for evaluation
    constraints: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks are required"],
      min: 0,
    },
    tags: [{ type: String, default: [] }], // Tags for the problem
    assignedBatches: [
      { type: Schema.Types.ObjectId, ref: "Batch", default: [] },
    ], // Batches assigned to the problem
    batchDueDates: [
      {
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        dueDate: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Problem", problemSchema);
