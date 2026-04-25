import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";

// Ensure env vars are present before any module that reads them is imported.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Subreddit from "../../src/models/Subreddit.js";
import Thread from "../../src/models/Thread.js";

let mongoServer;

const makeToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

const createUser = async (overrides = {}) =>
  User.create({
    name: overrides.name || "Test User",
    email:
      overrides.email ||
      `user_${new mongoose.Types.ObjectId().toString()}@example.com`,
    password: overrides.password || "hashed-password",
  });

const createSubreddit = async (authorId, overrides = {}) =>
  Subreddit.create({
    name: overrides.name || `sub_${new mongoose.Types.ObjectId().toString()}`,
    description: overrides.description || "A test subreddit",
    author: authorId,
  });

const createThread = async (authorId, subredditId, overrides = {}) =>
  Thread.create({
    title: overrides.title || "Default title",
    content: overrides.content || "Default content",
    author: authorId,
    subreddit: subredditId,
  });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Subreddit.deleteMany({}),
    Thread.deleteMany({}),
  ]);
});

describe("Auth guard on /api/threads", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/api/threads");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Authorization header missing",
    });
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/api/threads")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid token",
    });
  });

  it("returns 404 when token references a non-existent user", async () => {
    const token = makeToken(new mongoose.Types.ObjectId());
    const res = await request(app)
      .get("/api/threads")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "User not found",
    });
  });
});

describe("GET /api/threads", () => {
  it("returns 404 when there are no threads", async () => {
    const user = await createUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get("/api/threads")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "No threads found",
    });
  });

  it("returns all threads sorted by createdAt descending with populated refs", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const older = await createThread(user._id, sub._id, { title: "Older" });
    // Force a later createdAt for the second thread.
    const newer = await createThread(user._id, sub._id, { title: "Newer" });
    await Thread.findByIdAndUpdate(older._id, {
      createdAt: new Date(Date.now() - 60_000),
    });

    const token = makeToken(user._id);
    const res = await request(app)
      .get("/api/threads")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Threads fetched successfully");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]._id).toBe(newer._id.toString());
    expect(res.body.data[1]._id).toBe(older._id.toString());
    // Populated author/subreddit (not just an ObjectId string).
    expect(res.body.data[0].author).toMatchObject({ _id: user._id.toString() });
    expect(res.body.data[0].subreddit).toMatchObject({
      _id: sub._id.toString(),
    });
  });
});

describe("GET /api/threads/:id", () => {
  it("returns the thread when it exists", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const thread = await createThread(user._id, sub._id, {
      title: "Specific thread",
    });

    const token = makeToken(user._id);
    const res = await request(app)
      .get(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Thread fetched successfully",
    });
    expect(res.body.data._id).toBe(thread._id.toString());
    expect(res.body.data.title).toBe("Specific thread");
  });

  it("returns 404 when the thread does not exist", async () => {
    const user = await createUser();
    const token = makeToken(user._id);
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/threads/${missingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Thread not found",
    });
  });

  it("returns 500 for a malformed ObjectId (Mongoose CastError)", async () => {
    const user = await createUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get("/api/threads/not-an-object-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/threads", () => {
  it("creates a thread and returns 201 with populated data", async () => {
    const user = await createUser({ name: "Author One" });
    const sub = await createSubreddit(user._id, { description: "desc" });
    const token = makeToken(user._id);

    const payload = {
      title: "Hello world",
      content: "Some interesting content",
      subreddit: sub._id.toString(),
    };

    const res = await request(app)
      .post("/api/threads")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: "Thread created successfully",
    });
    expect(res.body.data).toMatchObject({
      title: payload.title,
      content: payload.content,
    });
    expect(res.body.data.author).toMatchObject({ name: "Author One" });
    expect(res.body.data.subreddit).toMatchObject({
      name: sub.name,
      description: "desc",
    });

    const stored = await Thread.findById(res.body.data._id);
    expect(stored).not.toBeNull();
    expect(stored.author.toString()).toBe(user._id.toString());
  });

  it.each([
    ["title", { content: "c", subreddit: "placeholder" }],
    ["content", { title: "t", subreddit: "placeholder" }],
    ["subreddit", { title: "t", content: "c" }],
  ])("returns 400 when %s is missing", async (_field, body) => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const token = makeToken(user._id);

    if (body.subreddit === "placeholder") {
      body.subreddit = sub._id.toString();
    }

    const res = await request(app)
      .post("/api/threads")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Title, content, and subreddit are required.",
    });
    expect(await Thread.countDocuments()).toBe(0);
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await request(app).post("/api/threads").send({
      title: "t",
      content: "c",
      subreddit: new mongoose.Types.ObjectId().toString(),
    });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/threads/:id", () => {
  it("updates allowed fields when called by the author", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const thread = await createThread(user._id, sub._id, {
      title: "Original",
      content: "Original content",
    });
    const token = makeToken(user._id);

    const res = await request(app)
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated", content: "Updated content" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Thread updated successfully",
    });
    expect(res.body.data).toMatchObject({
      title: "Updated",
      content: "Updated content",
    });

    const stored = await Thread.findById(thread._id);
    expect(stored.title).toBe("Updated");
    expect(stored.content).toBe("Updated content");
  });

  it("coerces non-string allowed fields to strings", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const thread = await createThread(user._id, sub._id);
    const token = makeToken(user._id);

    const res = await request(app)
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: 12345 });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("12345");
  });

  it("returns 400 when disallowed fields are sent", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const thread = await createThread(user._id, sub._id);
    const token = makeToken(user._id);

    const res = await request(app)
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "ok", upvotes: 9999, author: "hacker" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Only the following fields/);
    expect(res.body.message).toMatch(/upvotes/);
    expect(res.body.message).toMatch(/author/);

    const stored = await Thread.findById(thread._id);
    expect(stored.upvotes).toBe(0);
  });

  it("returns 404 when the thread does not exist", async () => {
    const user = await createUser();
    const token = makeToken(user._id);
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/api/threads/${missingId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "x" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Thread not found",
    });
  });

  it("returns 403 when the requester is not the author", async () => {
    const author = await createUser({ email: "author@example.com" });
    const stranger = await createUser({ email: "stranger@example.com" });
    const sub = await createSubreddit(author._id);
    const thread = await createThread(author._id, sub._id);
    const token = makeToken(stranger._id);

    const res = await request(app)
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "hijack" });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: "You are not allowed to update this thread",
    });

    const stored = await Thread.findById(thread._id);
    expect(stored.title).not.toBe("hijack");
  });
});

describe("DELETE /api/threads/:id", () => {
  it("deletes the thread when called by the author", async () => {
    const user = await createUser();
    const sub = await createSubreddit(user._id);
    const thread = await createThread(user._id, sub._id);
    const token = makeToken(user._id);

    const res = await request(app)
      .delete(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Thread deleted successfully",
    });
    expect(res.body.data._id).toBe(thread._id.toString());

    expect(await Thread.findById(thread._id)).toBeNull();
  });

  it("returns 404 when the thread does not exist", async () => {
    const user = await createUser();
    const token = makeToken(user._id);
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/threads/${missingId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Thread not found",
    });
  });

  it("returns 403 when the requester is not the author", async () => {
    const author = await createUser({ email: "owner@example.com" });
    const stranger = await createUser({ email: "intruder@example.com" });
    const sub = await createSubreddit(author._id);
    const thread = await createThread(author._id, sub._id);
    const token = makeToken(stranger._id);

    const res = await request(app)
      .delete(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: "You are not allowed to delete this thread",
    });
    expect(await Thread.findById(thread._id)).not.toBeNull();
  });
});
