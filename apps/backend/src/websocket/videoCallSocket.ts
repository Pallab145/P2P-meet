import { Server } from 'socket.io';
import { webRtcTransport } from '../controller/videoCallController';
import { mediaCodecs, worker } from '../configure/mediasoup-config';

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  let router: any;
  const rooms: Record<any, { producerTransports: Record<string, any>, consumerTransports: Record<string, any>, producer: any, consumers: Record<string, any> }> = {};

  async function initializeRouter() {
    if (!router) {
      router = await worker.createRouter({ mediaCodecs });
      console.log('Router created');
    }
  }

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.emit('connection-success', { socketId: socket.id });

    await initializeRouter();

    socket.on('create-room', (callback) => {
      const roomID = Math.floor(Math.random() * 900000) + 100000;
      rooms[roomID] = { producerTransports: {}, consumerTransports: {}, producer: null, consumers: {} };
      console.log(`Room created with ID: ${roomID}`);
      callback(roomID);
    });

    socket.on('join-room', async (roomID, callback) => {
      if (!rooms[roomID]) {
        return callback({ error: "Room does not exist" });
      }
      socket.join(roomID);
      rooms[roomID].producerTransports[socket.id] = null;
      rooms[roomID].consumerTransports[socket.id] = null;
      callback({ success: true });
      socket.to(roomID).emit('user-joined', { userId: socket.id });
    });

    socket.on('getRtpCapabilities', async (callback) => {
      try {
        if (!router) throw new Error("Router not initialized");
        const rtpCapabilities = router.rtpCapabilities;
        console.log("Router RTP Capabilities:", rtpCapabilities);
        callback({ rtpCapabilities });
      } catch (error) {
        console.error('Error fetching RTP capabilities:', error);
        callback({ error });
      }
    });

    socket.on('createWebRtcTransport', async (data, callback) => {
      try {
        const roomID = data.roomID;
        if (!roomID) {
          console.log(`Room ID is not working properly: ${roomID}`);
          throw new Error("Room ID not found");
        }
        if (!rooms[roomID]) {
          throw new Error("Room does not exist");
        }
    
        const transport = await webRtcTransport(router, callback);
        console.log("Created transport:", transport);
    
        if (data.sender) {
          rooms[roomID].producerTransports[socket.id] = transport;
        } else {
          rooms[roomID].consumerTransports[socket.id] = transport;
        }
        callback({
          transportParams: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            sctpParameters: transport.sctpParameters,
          }
        });
      } catch (error) {
        console.error('Error creating WebRTC transport:', error);
        callback({ error });
      }
    });
    
    

    socket.on('transport-connect', async ({ dtlsParameters }) => {
      try {
        const roomID = Object.keys(rooms).find(roomID => rooms[roomID].producerTransports[socket.id]);
        if (!roomID) {
          throw new Error("Room ID not found");
        }
        const transport = rooms[roomID].producerTransports[socket.id];
        if (!transport) throw new Error("Transport not initialized");
        console.log('Connecting transport with DTLS parameters:', dtlsParameters);
        await transport.connect({ dtlsParameters });
      } catch (error) {
        console.error('Error connecting transport:', error);
      }
    });

    socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
      try {
        const roomID = Object.keys(rooms).find(roomID => rooms[roomID].producerTransports[socket.id]);
        if (!roomID) {
          throw new Error("Room ID not found");
        }
        const transport = rooms[roomID].producerTransports[socket.id];
        if (!transport) throw new Error("Producer transport not initialized");
        const producer = await transport.produce({ kind, rtpParameters });
        rooms[roomID].producer = producer;
        console.log(`producer is ${ producer }`)
        callback({ id: producer.id });
        console.log(`Producer created with ID: ${producer.id}`);
      } catch (error) {
        console.error('Error in transport produce:', error);
        callback({ error: (error as Error).message });
      }
    });

    socket.on('transport-recv-connect', async ({ dtlsParameters, roomID }) => {
      try {
        if (!rooms[roomID]) {
          throw new Error("Room ID not found");
        }
        const transport = rooms[roomID].consumerTransports[socket.id];
        if (!transport) throw new Error("Consumer transport not initialized");
        console.log('Receiving transport connection with DTLS parameters:', dtlsParameters);
        await transport.connect({ dtlsParameters });
      } catch (error) {
        console.error('Error in transport receive connect:', error);
      }
    });
    

    socket.on('get-producer', (data, callback) => {
      const room = rooms[data.roomId];
      if (!room) {
        return callback({ error: "Room does not exist" });
      }
      if (!room.producer) {
        return callback({ error: "Producer not available" });
      }
      callback({ producerId: room.producer.id });
    });

    socket.on('consume', async ({ rtpCapabilities, roomID }, callback) => {
      try {
        if (!rooms[roomID]) {
          throw new Error("Room ID not found");
        }
        const producer = rooms[roomID].producer;
        const transport = rooms[roomID].consumerTransports[socket.id];
        if (!producer) throw new Error("Producer not initialized");
        if (!transport) throw new Error("Consumer transport not initialized");
        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) throw new Error("Cannot consume");
    
        const consumer = await transport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: true,
        });
    
        consumer.on('transportclose', () => {
          console.log('Consumer transport closed');
        });
    
        consumer.on('producerclose', () => {
          console.log('Producer closed for consumer');
        });
    
        rooms[roomID].consumers[socket.id] = consumer;
    
        const params = {
          id: consumer.id,
          producerId: producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        };
    
        callback({ params });
        console.log(`Consumer created with ID: ${consumer.id}`);
      } catch (error) {
        console.error('Error in consume:', error);
        callback({ error });
      }
    });
    

    socket.on('consumer-resume', async () => {
      console.log("Consumer resume");
      const roomID = Object.keys(rooms).find(roomID => rooms[roomID].consumers[socket.id]);
      if (roomID) {
        const consumer = rooms[roomID].consumers[socket.id];
        if (consumer) {
          await consumer.resume();
        }
      }
    });

    socket.on('end-videoCall', (roomId, callback) => {
      const room = rooms[roomId];
      if (!room) {
        console.error(`Room ID not found: ${roomId}`);
        if (callback) callback({ error: "Room not found" });
        return;
      }
    
      for (const producerTransport of Object.values(room.producerTransports)) {
        if (producerTransport) {
          try {
            producerTransport.close();
          } catch (error) {
            console.error("Error closing producer transport:", error);
          }
        }
      }
    
      for (const consumerTransport of Object.values(room.consumerTransports)) {
        if (consumerTransport) {
          try {
            consumerTransport.close();
          } catch (error) {
            console.error("Error closing consumer transport:", error);
          }
        }
      }
    
      for (const consumer of Object.values(room.consumers)) {
        if (consumer) {
          try {
            consumer.close();
          } catch (error) {
            console.error("Error closing consumer:", error);
          }
        }
      }
    
      if (room.producer) {
        try {
          room.producer.close();
        } catch (error) {
          console.error("Error closing producer:", error);
        }
      }
    
      delete rooms[roomId];
    
      console.log(`Room ${roomId} and associated resources are cleaned up.`);
      if (callback) callback({ success: true });
    
    });
    
        
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const roomID = Object.keys(rooms).find(roomID => rooms[roomID].producerTransports[socket.id] || rooms[roomID].consumerTransports[socket.id]);
      if (roomID) {
        const producerTransport = rooms[roomID].producerTransports[socket.id];
        if (producerTransport) producerTransport.close();
        const consumerTransport = rooms[roomID].consumerTransports[socket.id];
        if (consumerTransport) consumerTransport.close();
        const consumer = rooms[roomID].consumers[socket.id];
        if (consumer) consumer.close();
      }
    });
  });
}
