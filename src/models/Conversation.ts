import { Schema, model, Document, Model, Types } from "mongoose";

// One side deleting a chat must not destroy the other side's copy, so a delete
// is recorded per user as "cleared at this moment". Messages older than that
// timestamp are hidden from that user, and the thread reappears in their list
// only if the other participant sends something new.
export interface IClearedEntry {
  user: Types.ObjectId;
  at: Date;
}

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  listing?: Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  clearedBy: IClearedEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    clearedBy: {
      type: [
        {
          _id: false,
          user: { type: Schema.Types.ObjectId, ref: "User", required: true },
          at: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> = model<IConversation>(
  "Conversation",
  conversationSchema,
);
