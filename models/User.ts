import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  provider: string;
  reviewsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    provider: { type: String, default: 'google' },
    reviewsCompleted: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const User = (models.User as mongoose.Model<IUser>) || model<IUser>('User', UserSchema);

export default User;
