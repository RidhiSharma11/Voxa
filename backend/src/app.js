import express from "express";
import { createServer } from "node:http";
import "dotenv/config";
import { Server } from "socket.io";
import mongoose from "mongoose";

import { connectToServer } from "./controllers/socketManager.js";
import meetingRoutes from "./routes/meeting.routes.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js"


const app = express();
const server = createServer(app);
const io = connectToServer(server);

app.set("port",(process.env.PORT || 8000))
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true }));
app.use("/api/v1/users",userRoutes);
app.use("/api/v1/meeting", meetingRoutes);

const start=async()=>{
    const connectionDb = await mongoose.connect(process.env.MONGO_URI)
    console.log(`Mongoose connected DB Host:${connectionDb.connection.host}`)
    server.listen(app.get("port"),()=>{
        console.log("Port is working")
    })
}

start();