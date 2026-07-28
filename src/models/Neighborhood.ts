import { Schema, model, Document, Model } from "mongoose";

export interface IRentRange {
  singleMin: number;
  singleMax: number;
  flatMin: number;
  flatMax: number;
}

export interface IMapPosition {
  top: string;
  left: string;
  type: "blue" | "green" | "red";
}

export interface INeighborhood extends Document {
  name: string;
  vibe: string;
  description: string;
  image: string;
  rentRange: IRentRange;
  features: string[];
  mapPosition: IMapPosition;
  createdAt: Date;
  updatedAt: Date;
}

const neighborhoodSchema = new Schema<INeighborhood>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    vibe: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    rentRange: {
      singleMin: { type: Number, required: true },
      singleMax: { type: Number, required: true },
      flatMin: { type: Number, required: true },
      flatMax: { type: Number, required: true },
    },
    features: { type: [String], default: [] },
    mapPosition: {
      top: { type: String, required: true },
      left: { type: String, required: true },
      type: { type: String, enum: ["blue", "green", "red"], default: "blue" },
    },
  },
  { timestamps: true },
);

export const Neighborhood: Model<INeighborhood> = model<INeighborhood>(
  "Neighborhood",
  neighborhoodSchema,
);
