import { Schema, model, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "tenant" | "landlord" | "admin";

export interface ITenantProfile {
  score: number;
  documentsReady: boolean;
  employmentProofSubmitted: boolean;
}

export interface ILandlordProfile {
  organizationName?: string;
  businessAddress?: string;
  bio?: string;
  businessName?: string;
  bankAccountHolder?: string;
  bankName?: string;
  taxNumber?: string;
  twoFactorEnabled: boolean;
  profileCompletion: number;
  verified: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  verified: boolean;
  tenantProfile: ITenantProfile;
  landlordProfile: ILandlordProfile;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const tenantProfileSchema = new Schema<ITenantProfile>(
  {
    score: { type: Number, default: 70, min: 0, max: 100 },
    documentsReady: { type: Boolean, default: false },
    employmentProofSubmitted: { type: Boolean, default: false },
  },
  { _id: false },
);

const landlordProfileSchema = new Schema<ILandlordProfile>(
  {
    organizationName: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    businessName: { type: String, trim: true },
    bankAccountHolder: { type: String, trim: true },
    bankName: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    twoFactorEnabled: { type: Boolean, default: true },
    profileCompletion: { type: Number, default: 20, min: 0, max: 100 },
    verified: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["tenant", "landlord", "admin"], default: "tenant" },
    avatarUrl: { type: String },
    address: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    tenantProfile: { type: tenantProfileSchema, default: () => ({}) },
    landlordProfile: { type: landlordProfileSchema, default: () => ({}) },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> = model<IUser>("User", userSchema);
