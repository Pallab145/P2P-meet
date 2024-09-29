import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOption = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "Pallab Mahato" },
                password: { label: "Password", type: "password", placeholder: "123456789" }
            },
            async authorize(credentials: any) {
                try {
                    const existingUser = await prisma.user.findFirst({
                        where: {
                            username: credentials.username
                        }
                    });

                    if (existingUser) {
                        
                        const isValidPassword = await bcrypt.compare(credentials.password, existingUser.password);
                        if (isValidPassword) {
                            return {
                                username: existingUser.username,
                                firstname: existingUser.firstname,
                                lastname: existingUser.lastname
                            };
                        } else {
                            return null; 
                            
                        }
                    } else {
            
                        const hashedPassword = await bcrypt.hash(credentials.password, 10);

                        const newUser = await prisma.user.create({
                            data: {
                                username: credentials.username,
                                password: hashedPassword,
                                firstname: "Random", 
                                lastname: "Random"  
                            }
                        });

                        return {
                            username: newUser.username,
                            firstname: newUser.firstname,
                            lastname: newUser.lastname
                        };
                    }
                } catch (error) {
                    console.error(error);
                    return null;
                }
            }
        })
    ],
    secret: process.env.JWT_SECRET || 'secret',

    callbacks: {
        async session({ token, session }: any) {
            session.user.id = token.sub;
            return session;
        }
    }
};
