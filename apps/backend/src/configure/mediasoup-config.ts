
import * as mediasoup from 'mediasoup';
import { Worker,RtpCodecCapability } from 'mediasoup/node/lib/types';

export let worker : any;

const workerSettings: mediasoup.types.WorkerSettings = {
  logLevel: 'warn',
  rtcMinPort: 10000,
  rtcMaxPort: 10100,
};

export const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/vp8',
    clockRate: 90000,
  },
];


export const createWorker = async (): Promise<{ worker: Worker }> => {
  try {
    worker = await mediasoup.createWorker(workerSettings);
    console.log(`Worker PID: ${worker.pid}`);

    worker.on('died', (error: any) => {
      console.error(`Mediasoup worker died: ${error.message}`);
      setTimeout(() => process.exit(1), 2000);
    });
    return { worker };
  } catch (error) {
    console.error('Error creating Mediasoup worker:', error);
    throw error;
  }
};
