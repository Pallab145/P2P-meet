import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createWorker } from './configure/mediasoup-config';
import { videoCallSocket } from './websocket/videoCallSocket';
import router from './routes/videoCall';

const app = express();
const server = createServer(app);
const io = new Server(server);
const SERVER_PORT = 3000 ;




createWorker().then(() => {
    console.log('Mediasoup worker created');
});


videoCallSocket(io);

app.use('/api/video-call',router);


server.listen(3000, () => {
    console.log(`Listining at port ${ SERVER_PORT } `)
})