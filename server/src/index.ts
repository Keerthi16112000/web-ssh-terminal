import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import serverRoutes from './routes/server.routes';
import sessionRoutes from './routes/session.routes';
import { initializeWebSocketGateway } from './websocket/WebSocketGateway';

// Load env vars
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.VITE_API_URL ? new URL(process.env.VITE_API_URL).origin : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/sessions', sessionRoutes);

// Basic healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Initialize WebSockets
initializeWebSocketGateway(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { server };
