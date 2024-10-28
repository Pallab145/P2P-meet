// import { getServerSession } from "next-auth";
// import { authOption } from "./lib/auth";
// import { redirect } from "next/navigation";

import { VideoCall } from "../components/videoCall/VideoCall";

export default async function Home() {
    // const session = await getServerSession(authOption);
    // if (session?.user) {
    //     redirect('/dashboard');
    // } else {
    //     redirect('/dashboard');
    // }

    // return null; 

    return <div>
        <div>hi there</div>
        <VideoCall />
    </div>
    
}
