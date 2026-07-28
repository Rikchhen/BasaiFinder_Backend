import { Schema, model, Document, Model, Types } from "mongoose";

export interface ISavedSearchFilters {
  location?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

export interface ISavedSearch extends Document {
  user: Types.ObjectId;
  title: string;
  filters: ISavedSearchFilters;
  emailAlertsEnabled: boolean;
  lastCheckedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedSearchSchema = new Schema<ISavedSearch>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    filters: {
      location: { type: String, trim: true },
      roomType: { type: String, trim: true },
      minPrice: { type: Number },
      maxPrice: { type: Number },
      amenities: { type: [String], default: [] },
    },
    emailAlertsEnabled: { type: Boolean, default: true },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const SavedSearch: Model<ISavedSearch> = model<ISavedSearch>(
  "SavedSearch",
  savedSearchSchema,
);
