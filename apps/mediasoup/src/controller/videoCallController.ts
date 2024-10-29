
import { router } from "../configure/mediasoup-config";


export const webRtcTransport = async (callback : any) => {
  try {
    const webRtcTransportOptions = {
      listenIps: [{ ip: '127.0.0.1' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };

    const transport = await router.createWebRtcTransport(webRtcTransportOptions);
    console.log(`Transport created with ID: ${transport.id}`);

    transport.on('dtlsstatechange', (dtlsState : any) => {
      if (dtlsState === 'closed') {
        transport.close();
        console.log('Transport closed due to dtlsstatechange');
      }
    });

    // transport.on('close', () => {
    //   console.log('Transport closed');
    // });

    
    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });

  } catch (error) {
    console.error('Error creating WebRTC transport:', error);
    callback({ error });
  }
};
