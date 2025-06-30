import "express-async-errors";
import { config } from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import http from "http";
import notFoundHandler from "./controllers/not-found.js";
import errorHandler from "./controllers/error.js";
import authRoutes from "./routes/auth.js";
import contestRoutes from "./routes/contests.js";
import problemRoutes from "./routes/problem.router.js"; // Problem routes
import user from "./routes/user.router.js";
import cors from "cors";
import compileRoutes from "./routes/compileRoutes.js"; // Import the compile routes
import submissionRoutes from "./routes/submission.router.js"; // Import the submission routes
import adminFacultyRouter from "./routes/admin.faculty.router.js";
import adminBatchRouter from "./routes/admin.batch.router.js";
import facultyRouter from "./routes/faculty.router.js";
import compiler from "./routes/compiler.js";
import adminRouter from "./routes/admin.router.js"; // Import the admin router
import notificationRouter from "./routes/notification.router.js"; // Import the notification router
import { initSocketServer, initNotificationService } from "./utils/socket.js";

config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());

const corsOptions = {
  origin: process.env.BACKEND_ORIGIN || "http://localhost:5173",
  credentials: true,
};
// const corsOptions = {
//   origin: "http://192.168.24.235:5173",
//   credentials: true,
// };
app.use(cors(corsOptions));
app.use(express.static("public"));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contests", contestRoutes); // Use contest routes
app.use("/api/v1/problems", problemRoutes); // Use problem routes
app.use("/api/v1/user", user);
app.use("/api/v1/compile", compileRoutes);
app.use("/api/v1/submissions", submissionRoutes); // Use submission routes
app.use("/api/v1/admin/faculty", adminFacultyRouter); // admin faculty management
app.use("/api/v1/admin/batch", adminBatchRouter); // admin batch management
app.use("/api/v1/faculty", facultyRouter);
app.use("/api/v1/compiler", compiler);
app.use("/api/v1/admin", adminRouter); // admin dashboard
app.use("/api/v1/notifications", notificationRouter); // notifications

app.all("*", notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3100;
mongoose.set("strictQuery", true);

// Create an HTTP server instance
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const { io, connectedUsers } = initSocketServer(server);

// Initialize the notification service
const notificationService = initNotificationService(io, connectedUsers);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // console.log("DB Connected");
    server.listen(PORT, process.env.ALL_IP, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Socket.IO running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

export { mongoose, notificationService };
