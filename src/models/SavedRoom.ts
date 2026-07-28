import { Schema, model, Document, Model, Types } from "mongoose";

export interface ISavedRoom extends Document {
  user: Types.ObjectId;
  listing: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const savedRoomSchema = new Schema<ISavedRoom>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: true },
);

savedRoomSchema.index({ user: 1, listing: 1 }, { unique: true });

export const SavedRoom: Model<ISavedRoom> = model<ISavedRoom>("SavedRoom", savedRoomSchema);
