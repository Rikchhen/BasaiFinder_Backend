import { Schema, model, Document, Model, Types } from "mongoose";

export type NotificationType =
  | "new_match"
  | "visit_reminder"
  | "message"
  | "booking_update"
  | "verification"
  | "system";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_match", "visit_reminder", "message", "booking_update", "verification", "system"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification: Model<INotification> = model<INotification>(
  "Notification",
  notificationSchema,
);
