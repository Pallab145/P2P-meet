import { Server,Socket } from "socket.io";
import { router } from "../configure/mediasoup-config";


export const videoCallSocket = (io : Server) => {
    io.on('connection', (socket : Socket) => {
        console.log("connection is on ");

        socket.on('join-room',async ({ room_id } : {room_id : string}) => {
            console.log(`user join with room id ${ room_id }`);

            const transport = await router.createWebRtcTransport({
                listenIps: [{ ip: '0.0.0.0', announcedIp: 'your-public-ip' }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true,
            });

            socket.emit('transportedCreated' ,{ transport });
        });

        socket.on('disconnect',() => {
            console.log("user disconnected ", socket.id);
        });
    });
};