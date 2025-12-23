import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load .env early so process.env values are available
dotenv.config();

// Optional: avoid strictQuery deprecation warnings
mongoose.set('strictQuery', false);

const metricSchema = new mongoose.Schema({
    jid: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    rtt: { type: Number, required: true },
    state: { type: String, enum: ['Online', 'Standby', 'Offline'], required: true }
});

export const Metric = mongoose.model('Metric', metricSchema);

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-tracker';
        console.log('[MongoDB] Connecting to', uri);
        await mongoose.connect(uri);
        console.log('[MongoDB] Connected');
    } catch (err) {
        console.error('[MongoDB] Connection Error:', err);
        // Keep process running to allow dev inspection; rethrow so callers can decide
        throw err;
    }
};
