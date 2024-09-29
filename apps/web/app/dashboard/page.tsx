import { AppBar } from "../../components/AppBar";
import { SideBar } from "../../components/SideBar";
import { VideoCall } from "../../components/videoCall/videoCall";


export default function Home(){
    return <div className="bg-black">
        <AppBar />
        {/* <SideBar /> */}
        <VideoCall />
    </div>
}