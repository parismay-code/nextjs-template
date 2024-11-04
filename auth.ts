import { User } from "@/app/lib/definitions";
import { authConfig } from "@/auth.config";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const AuthSchema = z.object({
		email: z.string().email(),
		password: z.string().min(6),
});

async function getUser(email: string): Promise<User | undefined> {
		try {
				const user = await sql<User>`SELECT *
                                     FROM users
                                     WHERE email = ${ email }`;

				return user.rows[0];
		} catch (error) {
				console.error('Failed to fetch user:', error);
				throw new Error('Failed to fetch user.');
		}
}

export const { auth, signIn, signOut } = NextAuth({
		...authConfig, providers: [Credentials({
				async authorize(credentials) {
						const { success, data } = AuthSchema.safeParse(credentials);

						if (success) {
								const { email, password } = data;
								const user = await getUser(email);
								if (!user) {
										return null;
								}
								const passwordsMatch = await bcrypt.compare(password, user.password);

								if (passwordsMatch) {
										return user;
								}
						}

						console.log('Invalid credentials');
						return null;
				},
		})],
});