import * as mediasoup from 'mediasoup';
import { Worker,Router, RtpCodecCapability } from "mediasoup/node/lib/types"

export let worker: Worker;
export let router: Router ;

const workerSettings: mediasoup.types.WorkerSettings = {
  logLevel: 'warn',
  rtcMinPort: 10000,
  rtcMaxPort: 10100,
};

const mediaCodecs: RtpCodecCapability[] = [
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

export const createWorker = async (): Promise<{ worker: Worker; router: Router }> => {
  try {
    worker = await mediasoup.createWorker(workerSettings);
    console.log(`Worker PID: ${worker.pid}`);

    worker.on('died', (error : any) => {
      console.error(`Mediasoup worker died: ${error.message}`);
      setTimeout(() => process.exit(1), 2000);
    });

    router = await worker.createRouter({ mediaCodecs });
    console.log("Router created");

    return { worker, router };
  } catch (error) {
    console.error('Error creating Mediasoup worker:', error);
    throw error;
  }
};

// export function getRouter(): Router {
//   if (!router) throw new Error("Router not initialized");
//   return router;
// }
