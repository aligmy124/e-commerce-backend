import mongoose from "mongoose";
import { beforeAll, beforeEach, afterAll } from "vitest";

import { env } from "../config/env";
import { User } from "../models/users/models/user.model";
import { Order } from "../models/orders/models/order.model";

beforeAll(async () => {
  await mongoose.connect(env.MONGODB_TEST_URI);
  await User.init();
  await Order.init();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
