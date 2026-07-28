import { Schema, model, Document, Model, Types } from "mongoose";

export type BookingStatus =
  | "pending"
  | "document_review"
  | "visit_requested"
  | "visit_confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

export interface IBookingRequest extends Document {
  tenant: Types.ObjectId;
  landlord: Types.ObjectId;
  listing: Types.ObjectId;
  status: BookingStatus;
  requestedVisitTime?: Date;
  message?: string;
  documentsSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingRequestSchema = new Schema<IBookingRequest>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    landlord: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "document_review",
        "visit_requested",
        "visit_confirmed",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },
    requestedVisitTime: { type: Date },
    message: { type: String, trim: true },
    documentsSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingRequestSchema.index({ tenant: 1, createdAt: -1 });
bookingRequestSchema.index({ landlord: 1, createdAt: -1 });

export const BookingRequest: Model<IBookingRequest> = model<IBookingRequest>(
  "BookingRequest",
  bookingRequestSchema,
);
