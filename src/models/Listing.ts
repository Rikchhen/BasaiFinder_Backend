import { Schema, model, Document, Model, Types } from "mongoose";

export type ListingType = "Single Room" | "Studio" | "1BHK" | "2BHK" | "Apartment";
export type ListingStatus = "draft" | "pending" | "verified" | "rejected";

export interface IListingLocation {
  address: string;
  neighborhood: string;
  district: string;
  city: string;
  coordinates?: { lat: number; lng: number };
}

export interface IVerificationChecklist {
  ownershipDocument: boolean;
  contactNumberVerified: boolean;
  photosComplete: boolean;
  houseRulesUpdated: boolean;
}

export interface IListing extends Document {
  landlord: Types.ObjectId;
  title: string;
  description?: string;
  type: ListingType;
  price: number;
  location: IListingLocation;
  bedrooms: number;
  bathrooms: number;
  areaSqft?: number;
  amenities: string[];
  images: string[];
  status: ListingStatus;
  verificationChecklist: IVerificationChecklist;
  leadsCount: number;
  viewsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<IListingLocation>(
  {
    address: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, default: "Kathmandu", trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false },
);

const verificationChecklistSchema = new Schema<IVerificationChecklist>(
  {
    ownershipDocument: { type: Boolean, default: false },
    contactNumberVerified: { type: Boolean, default: false },
    photosComplete: { type: Boolean, default: false },
    houseRulesUpdated: { type: Boolean, default: false },
  },
  { _id: false },
);

const listingSchema = new Schema<IListing>(
  {
    landlord: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["Single Room", "Studio", "1BHK", "2BHK", "Apartment"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    location: { type: locationSchema, required: true },
    bedrooms: { type: Number, default: 1, min: 0 },
    bathrooms: { type: Number, default: 1, min: 0 },
    areaSqft: { type: Number, min: 0 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "pending", "verified", "rejected"],
      default: "pending",
    },
    verificationChecklist: { type: verificationChecklistSchema, default: () => ({}) },
    leadsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

listingSchema.index({ title: "text", description: "text" });
listingSchema.index({ "location.district": 1, type: 1, price: 1 });

export const Listing: Model<IListing> = model<IListing>("Listing", listingSchema);
