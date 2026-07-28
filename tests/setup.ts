import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";

// Tests run against a dedicated database on the local MongoDB instance so they
// never touch development data. The whole database is dropped at the end.
const TEST_DB_URL =
  process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27017/BasaiFinder_TEST";

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URL);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
