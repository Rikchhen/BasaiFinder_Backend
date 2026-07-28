import mongoose from "mongoose";
import connectDB from "../database/db";
import { User } from "../models/User";
import { Listing } from "../models/Listing";
import { Neighborhood } from "../models/Neighborhood";
import { SavedRoom } from "../models/SavedRoom";
import { SavedSearch } from "../models/SavedSearch";
import { BookingRequest } from "../models/BookingRequest";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";

const NEIGHBORHOODS = [
  {
    name: "Baneshwor",
    vibe: "Central Hub",
    description:
      "A busy, connected neighborhood with offices, colleges, cafes, and strong public transport access.",
    image: "/art/nb-baneshwor.jpg",
    rentRange: { singleMin: 10000, singleMax: 16000, flatMin: 22000, flatMax: 38000 },
    features: ["Near Hubs", "Coffee Culture", "Student Friendly"],
    mapPosition: { top: "42%", left: "56%", type: "blue" as const },
  },
  {
    name: "Lalitpur",
    vibe: "Cultural Heart",
    description:
      "Heritage lanes, calm courtyards, creative studios, and reliable rental pockets for working tenants.",
    image: "/art/nb-lalitpur.jpg",
    rentRange: { singleMin: 12000, singleMax: 18000, flatMin: 25000, flatMax: 45000 },
    features: ["Heritage Area", "Local Cafes", "Verified Homes"],
    mapPosition: { top: "66%", left: "39%", type: "green" as const },
  },
  {
    name: "Koteshwor",
    vibe: "Transit Star",
    description:
      "A practical choice for commuters with bus routes, markets, and affordable room options nearby.",
    image: "/art/nb-koteshwor.jpg",
    rentRange: { singleMin: 8000, singleMax: 14000, flatMin: 18000, flatMax: 32000 },
    features: ["Transit Access", "Student Rooms", "Easy Commute"],
    mapPosition: { top: "58%", left: "70%", type: "red" as const },
  },
  {
    name: "Jhamsikhel",
    vibe: "Lifestyle Pocket",
    description:
      "Popular with professionals who want restaurants, quiet streets, and polished studio apartments.",
    image: "/art/nb-jhamsikhel.jpg",
    rentRange: { singleMin: 14000, singleMax: 22000, flatMin: 32000, flatMax: 55000 },
    features: ["Dining Scene", "Safe Streets", "Modern Flats"],
    mapPosition: { top: "70%", left: "28%", type: "green" as const },
  },
  {
    name: "Boudha",
    vibe: "Quiet Retreat",
    description:
      "Peaceful residential pockets with monastery views, local markets, and family-friendly rentals.",
    image: "/art/nb-boudha.jpg",
    rentRange: { singleMin: 9000, singleMax: 15000, flatMin: 20000, flatMax: 35000 },
    features: ["Calm Area", "Family Flats", "Verified Hosts"],
    mapPosition: { top: "26%", left: "72%", type: "blue" as const },
  },
  {
    name: "Maharajgunj",
    vibe: "Residential Prime",
    description:
      "A premium residential zone close to hospitals, embassies, schools, and quieter rental homes.",
    image: "/art/nb-maharajgunj.jpg",
    rentRange: { singleMin: 13000, singleMax: 20000, flatMin: 30000, flatMax: 60000 },
    features: ["School Nearby", "Secure Area", "Premium Flats"],
    mapPosition: { top: "35%", left: "45%", type: "red" as const },
  },
];

async function seed() {
  await connectDB();

  console.warn("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Neighborhood.deleteMany({}),
    SavedRoom.deleteMany({}),
    SavedSearch.deleteMany({}),
    BookingRequest.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const neighborhoods = await Neighborhood.insertMany(NEIGHBORHOODS);
  console.log(`Seeded ${neighborhoods.length} neighborhoods.`);

  const rajesh = await User.create({
    name: "Rajesh Sharma",
    email: "rajesh.sharma@example.com",
    phone: "9841234567",
    passwordHash: "password123",
    role: "landlord",
    verified: true,
    landlordProfile: {
      organizationName: "Kathmandu Rentals Ltd.",
      businessAddress: "New Baneshwor, Kathmandu, Nepal",
      bio: "I manage verified residential rentals across Kathmandu with a focus on safe, clean, and well-documented rooms for students, professionals, and families.",
      businessName: "Kathmandu Rentals Ltd.",
      bankAccountHolder: "Rajesh Sharma",
      bankName: "Nabil Bank",
      taxNumber: "PAN-30012345",
      twoFactorEnabled: true,
      profileCompletion: 80,
      verified: true,
    },
  });

  const bijay = await User.create({
    name: "Bijay Khadka",
    email: "bijay.khadka@example.com",
    phone: "9812345678",
    passwordHash: "password123",
    role: "landlord",
    verified: true,
    landlordProfile: {
      organizationName: "Bijay Properties",
      businessAddress: "Patan, Lalitpur, Nepal",
      bio: "Renting out verified rooms and apartments around Lalitpur and Baneshwor for over five years.",
      businessName: "Bijay Properties",
      bankAccountHolder: "Bijay Khadka",
      bankName: "NIC Asia Bank",
      taxNumber: "PAN-30054321",
      twoFactorEnabled: true,
      profileCompletion: 65,
      verified: true,
    },
  });

  const sanjana = await User.create({
    name: "Sanjana Karki",
    email: "sanjana@example.com",
    phone: "9841111111",
    passwordHash: "password123",
    role: "tenant",
    verified: true,
    address: "Jawalakhel, Lalitpur",
    tenantProfile: { score: 92, documentsReady: true, employmentProofSubmitted: false },
  });

  const siddhartha = await User.create({
    name: "Siddhartha",
    email: "siddhartha@example.com",
    phone: "9847654321",
    passwordHash: "password123",
    role: "tenant",
    verified: true,
    address: "Baneshwor, Kathmandu",
    tenantProfile: { score: 78, documentsReady: false, employmentProofSubmitted: true },
  });

  console.log("Seeded 4 demo users (2 landlords, 2 tenants).");

  const listingDefs = [
    {
      landlord: rajesh.id,
      title: "Sunny 2BHK near Patan Durbar Square",
      description:
        "Bright, secure apartment with morning sun, separate kitchen, steady water access, and easy walking distance to Patan Durbar Square.",
      type: "2BHK" as const,
      price: 22000,
      location: { address: "Mangal Bazaar, Lalitpur", neighborhood: "Lalitpur", district: "Lalitpur", city: "Lalitpur" },
      bedrooms: 2,
      bathrooms: 1,
      areaSqft: 750,
      amenities: ["Attached bathroom", "Solar backup", "Fiber internet", "Bike parking", "Water tank"],
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80",
      ],
      status: "verified" as const,
    },
    {
      landlord: rajesh.id,
      title: "Modern Studio near Patan Dhoka",
      type: "Studio" as const,
      price: 22000,
      location: { address: "Patan Dhoka, Lalitpur", neighborhood: "Lalitpur", district: "Lalitpur", city: "Lalitpur" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 420,
      amenities: ["Fiber internet", "Water tank"],
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85"],
      status: "verified" as const,
    },
    {
      landlord: rajesh.id,
      title: "Sunny 1BHK with Bike Parking",
      type: "1BHK" as const,
      price: 25000,
      location: { address: "New Baneshwor", neighborhood: "Baneshwor", district: "Kathmandu", city: "Kathmandu" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 520,
      amenities: ["Bike parking"],
      images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=85"],
      status: "pending" as const,
      verificationChecklist: { ownershipDocument: true, contactNumberVerified: true, photosComplete: false, houseRulesUpdated: false },
    },
    {
      landlord: bijay.id,
      title: "Premium 1BHK with Morning Sun",
      type: "1BHK" as const,
      price: 25000,
      location: { address: "Jawalakhel, Lalitpur", neighborhood: "Lalitpur", district: "Lalitpur", city: "Lalitpur" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 540,
      amenities: ["High Speed Internet", "Bike Parking"],
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85"],
      status: "verified" as const,
    },
    {
      landlord: bijay.id,
      title: "Cozy Single Room near College",
      type: "Single Room" as const,
      price: 12000,
      location: { address: "Baneshwor", neighborhood: "Baneshwor", district: "Kathmandu", city: "Kathmandu" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 220,
      amenities: ["Fiber Net", "Water Tank"],
      images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=85"],
      status: "verified" as const,
    },
    {
      landlord: bijay.id,
      title: "Quiet Studio with Kitchenette",
      type: "Studio" as const,
      price: 18500,
      location: { address: "Jhamsikhel, Lalitpur", neighborhood: "Jhamsikhel", district: "Lalitpur", city: "Lalitpur" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 480,
      amenities: ["High Speed Internet", "Bike Parking"],
      images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=85"],
      status: "verified" as const,
    },
    {
      landlord: rajesh.id,
      title: "Sunny 1BHK in New Baneshwor",
      type: "1BHK" as const,
      price: 28000,
      location: { address: "New Baneshwor, Kathmandu", neighborhood: "Baneshwor", district: "Kathmandu", city: "Kathmandu" },
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 620,
      amenities: [],
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"],
      status: "verified" as const,
    },
    {
      landlord: bijay.id,
      title: "Family Apartment in Koteshwor",
      type: "Apartment" as const,
      price: 38000,
      location: { address: "Koteshwor, Kathmandu", neighborhood: "Koteshwor", district: "Kathmandu", city: "Kathmandu" },
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 910,
      amenities: [],
      images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"],
      status: "verified" as const,
    },
  ];

  const listings = await Listing.insertMany(listingDefs);
  console.log(`Seeded ${listings.length} listings.`);

  const [sunny2bhk, , , premium1bhk, , cozyStudio] = listings;

  await SavedRoom.create([
    { user: sanjana.id, listing: premium1bhk.id },
    { user: sanjana.id, listing: cozyStudio.id },
    { user: siddhartha.id, listing: sunny2bhk.id },
  ]);

  await SavedSearch.create({
    user: sanjana.id,
    title: "1BHK in Lalitpur under 20k",
    filters: { location: "Lalitpur", roomType: "1BHK", maxPrice: 20000 },
    emailAlertsEnabled: true,
  });

  const documentReviewBooking = await BookingRequest.create({
    tenant: sanjana.id,
    landlord: rajesh.id,
    listing: sunny2bhk.id,
    status: "document_review",
    message: "Interested in visiting this weekend, is Saturday afternoon possible?",
    documentsSubmitted: true,
  });

  await BookingRequest.create({
    tenant: siddhartha.id,
    landlord: bijay.id,
    listing: premium1bhk.id,
    status: "visit_confirmed",
    requestedVisitTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    message: "Looking forward to the visit.",
  });

  console.log("Seeded 2 booking requests.");

  const conversation = await Conversation.create({
    participants: [sanjana.id, rajesh.id],
    listing: sunny2bhk.id,
  });

  await Message.create({
    conversation: conversation.id,
    sender: sanjana.id,
    text: "Hi, is this room still available for viewing this weekend?",
    readBy: [sanjana.id, rajesh.id],
  });

  const secondMessage = await Message.create({
    conversation: conversation.id,
    sender: rajesh.id,
    text: "Yes it is! Can you visit tomorrow after 4 PM? I can show the room and parking area.",
    readBy: [rajesh.id],
  });

  conversation.lastMessage = secondMessage.text;
  conversation.lastMessageAt = secondMessage.get("createdAt");
  await conversation.save();

  console.log("Seeded 1 conversation with 2 messages.");

  await Notification.create([
    {
      user: sanjana.id,
      type: "new_match",
      title: "12 new matches",
      body: "Baneshwor and Patan have fresh verified listings today.",
      link: "/details",
    },
    {
      user: sanjana.id,
      type: "message",
      title: "New message",
      body: "Bijay K. sent you a new message.",
      link: `/conversations/${conversation.id}`,
    },
    {
      user: rajesh.id,
      type: "booking_update",
      title: "New visit request",
      body: `Sanjana Karki requested a visit for "${sunny2bhk.title}".`,
      link: `/bookings/${documentReviewBooking.id}`,
    },
  ]);

  console.log("Seeded notifications.");
  console.log("\nDemo accounts (password: password123):");
  console.log("  Landlord: rajesh.sharma@example.com");
  console.log("  Landlord: bijay.khadka@example.com");
  console.log("  Tenant:   sanjana@example.com");
  console.log("  Tenant:   siddhartha@example.com");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
