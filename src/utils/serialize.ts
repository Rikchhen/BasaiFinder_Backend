import { HydratedDocument } from "mongoose";
import { IUser } from "../models/User";

export function toUserResponse(user: HydratedDocument<IUser>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    address: user.address,
    verified: user.verified,
    tenantProfile: user.tenantProfile,
    landlordProfile: user.landlordProfile,
    createdAt: user.createdAt,
  };
}
