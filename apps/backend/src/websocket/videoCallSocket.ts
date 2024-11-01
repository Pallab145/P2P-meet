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

  let producerTransport: any;
  let consumerTransport: any;
  let producer: any;
  let consumer: any;
  let router: any;

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

    socket.on('getRtpCapabilities', async (callback) => {
      try {
        if (!router) throw new Error("Router not initialized");
        const rtpCapabilities = router.rtpCapabilities;
        console.log("Router RTP Capabilities:", rtpCapabilities);
        if (callback) {
          callback({ rtpCapabilities });
        }
      } catch (error) {
        console.error('Error fetching RTP capabilities:', error);
        if (callback) {
          callback({ error });
        }
      }
    });
    

    socket.on('createWebRtcTransport', async (data, callback) => {
      try {
        const transport = await webRtcTransport(router, callback);
        console.log("transport is");
        console.log(transport);
        if (data.sender) {
          producerTransport = transport;
        } else {
          consumerTransport = transport;
        }
        // We already do this inside the webRtcTransport function. No need to call callback again.
        // callback({ transport });
      } catch (error) {
        console.error('Error creating WebRTC transport:', error);
        callback({ error: (error as Error).message });
      }
    });
    
    

    socket.on('transport-connect', async ({ dtlsParameters }) => {
      try {
        if (!producerTransport) throw new Error("Producer transport not initialized");
        
        console.log('Connecting transport with DTLS parameters:', dtlsParameters);
        await producerTransport.connect({ dtlsParameters });
      } catch (error) {
        console.error('Error connecting transport:', error);
      }
    });
    

    socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
      try {
        if (!producerTransport) {
          throw new Error("Producer transport not initialized");
        }
    
        producer = await producerTransport.produce({ kind, rtpParameters });
        callback({ id: producer.id });
    
        socket.emit('producer-ready', { producerId: producer.id });
        console.log(`Producer created with ID: ${producer.id}`);
      } catch (error) {
        console.error('Error in transport produce:', error);
        callback({ error: (error as Error).message });
      }
    });

    socket.on('transport-recv-connect', async ({ dtlsParameters }) => {
      try {
        if (!consumerTransport) {
          throw new Error("Consumer transport not initialized");
        }

        console.log('Receiving transport connection with DTLS parameters:', dtlsParameters);
        await consumerTransport.connect({ dtlsParameters });
      } catch (error) {
        console.error('Error in transport receive connect:', error);
      }
    });

    socket.on('consume', async ({ rtpCapabilities }, callback) => {
      try {
        if (!producer) {
          throw new Error("Producer not initialized");
        }
        if (!consumerTransport) {
          throw new Error("Consumer transport not initialized");
        }
    
        // Check if we can consume the producer
        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
          throw new Error("Cannot consume");
        }
    
        // Consume the producer
        consumer = await consumerTransport.consume({
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
        
      }
    });
    
    
    socket.on('consumer-resume',async () => {
      console.log("consumer resume");
      await consumer.resume();
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
  
      if (producerTransport) {
        producerTransport.close();
      }
      if (consumerTransport) {
        consumerTransport.close();
      }
    });
  });
}
