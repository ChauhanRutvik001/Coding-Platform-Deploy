import mongoose from 'mongoose';
import { STATUS } from '../utils/constants.js';  // Ensure this path is correct
const { Schema } = mongoose;


const testCaseResultSchema = new Schema({
  input: { type: String, required: true }, // Single input string
  output: { type: String, required: true }, // Single output string
  expectedOutput: { type: String, required: true }, // Expected outputs for the test case
  passed: { type: Boolean, required: true }, // Pass or fail status
  time: { type: Number, required: true }, // Execution time (in seconds or another unit)
  memory: { type: Number, required: true }, // Memory usage (in KB or another unit)
  is_hidden : { type: Boolean, required: true }, // Memory usage (in KB or another unit)
});

const submissionSchema = new Schema({  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  problem_id: {
    type: Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, 'Problem ID is required'],
  },
  batch_id: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: false,
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PENDING,
    required: [true, 'Status is required'],
  },
  execution_time: {
    type: Number, // Execution time in miliseconds
    required: [true, 'Execution time is required'],
  },
  memory_usage: {
    type: Number, // Memory usage in MB
    required: [true, 'Memory usage is required'],
  },
  numberOfTestCase: {
    type: Number,
    required: [true, 'Number of test cases is required'],
  },
  numberOfTestCasePass: {
    type: Number,
    required: [true, 'Number of test cases passed is required'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: 0,
  },
  testCaseResults: [testCaseResultSchema], // Array to store multiple test case results
}, {
  timestamps: true,
});

export default mongoose.model('Submission', submissionSchema);
