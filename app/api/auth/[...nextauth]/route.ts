import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      await connectToDatabase();

      // Upsert user in MongoDB on each sign-in
      await User.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            name: user.name,
            image: user.image ?? "",
            provider: account.provider,
            providerId: account.providerAccountId
          }
        },
        { upsert: true, new: true }
      );

      return true;
    },

    async session({ session }) {
      // Attach MongoDB _id to the session
      if (session.user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: session.user.email }).lean();
        if (dbUser) {
          (session.user as any).id = String(dbUser._id);
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
