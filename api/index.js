import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// routes
import authRoutes from "../routes/authRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import messageRoutes from "../routes/messageRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import returnRoutes from "../routes/returnRoutes.js";

dotenv.config();

const app = express();

// 🔥 مهم: cache connection عشان Vercel
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        isConnected = conn.connections[0].readyState;
        console.log("MongoDB connected");
    } catch (err) {
        console.error(err);
    }
};

// middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://zentro-store.vercel.app', 'https://zentro-store-5000.vercel.app'],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cors());

app.use(express.json());

// connect DB لكل request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/returns", returnRoutes);

// test
app.get("/", (req, res) => {
    res.send("Vercel Backend Running 🚀");
});

export default app;