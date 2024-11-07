import { getServerSession } from "next-auth";
import { authOption } from "./lib/auth";
import { redirect } from "next/navigation";


export default async function Home() {
    const session = await getServerSession(authOption);
    if (session?.user) {
        redirect('/dashboard');
    } else {
        redirect('/dashboard');
    }

}
