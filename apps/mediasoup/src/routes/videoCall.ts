import { Router } from 'express';
import { createWebRtcTransport } from '../controller/videoCallController';

const router = Router();

router.post('/create-transport', createWebRtcTransport);

export default router;