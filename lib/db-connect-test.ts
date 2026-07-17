import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function testDBConnection() {
  await connectDB();
  const userCount = await User.countDocuments();
  return { success: true, userCount, message: 'Database connected successfully' };
}
