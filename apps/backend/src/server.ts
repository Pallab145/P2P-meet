import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createWorker } from './configure/mediasoup-config';
import { setupWebSocket } from './websocket/videoCallSocket';


const app = express();
app.use(cors({
  origin: 'https://p2-p-meet-frontend.vercel.app',
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

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
