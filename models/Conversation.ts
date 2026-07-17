import mongoose, { Schema, Document, Types, model, models } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  userId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 100 },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation =
  (models.Conversation as mongoose.Model<IConversation>) ||
  model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
