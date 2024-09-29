import { Request, Response } from 'express';
import { router } from '../configure/mediasoup-config';

export const createWebRtcTransport = async (req: Request, res: Response): Promise<void> => {
  try {
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: 'your-public-ip' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
    res.status(200).json({ transport });
  } catch (error) {
    console.error('Error creating WebRTC transport:', error);
    res.status(500).send('Server error');
  }
};
