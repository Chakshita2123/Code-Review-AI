import { connectDB } from './db';
import User from '@/models/User';

export async function getOrCreateUser(sessionUser: { email: string; name?: string | null; image?: string | null }) {
  await connectDB();
  
  let user = await User.findOne({ email: sessionUser.email });
  if (!user) {
    user = await User.create({
      name: sessionUser.name || sessionUser.email.split('@')[0] || 'Developer',
      email: sessionUser.email,
      image: sessionUser.image || undefined,
      provider: 'google',
      reviewsCompleted: 0,
    });
  }
  return user;
}
