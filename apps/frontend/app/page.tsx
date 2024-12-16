"use client"

// import { getServerSession } from "next-auth";
// import { authOption } from "./lib/auth";
import { useRouter } from "next/navigation";


export default async function Home() {
    const router = useRouter();

    return router.push('/dashboard');

}
