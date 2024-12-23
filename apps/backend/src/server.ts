import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWorker } from './configure/mediasoup-config';
import { setupWebSocket } from './websocket/videoCallSocket';

const app = express();

// CORS middleware setup
app.use(cors({
  origin: 'https://p2-p-meet-frontend.vercel.app',
  // origin:"http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

// JSON parsing middleware
app.use(express.json());

// Root route handler to avoid 404 for GET requests to '/'
app.get('/', (req, res) => {
  res.send('Welcome to the Mediasoup Video Call Server!');
});

const server = createServer(app);

async function startServer() {
  await createWorker();  
  setupWebSocket(server);  

  server.listen(5000, () => {
    console.log('Server is listening on http://localhost:5000');
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});
