import mongoose from "mongoose";
const { Types } = mongoose;

const u1 = new Types.ObjectId();
const u2 = new Types.ObjectId();
const u3 = new Types.ObjectId();

const t1 = new Types.ObjectId(); // Thread: "How do I learn Node.js?"
const t2 = new Types.ObjectId(); // Thread: "Best way to manage state in React?"
const t3 = new Types.ObjectId(); // Thread: "Modern CSS frameworks"

export const users = [
  {
    _id: u1,
    name: "Alice",
    email: "alice@example.com",
    password: "password123",
  },
  { _id: u2, name: "Bob", email: "bob@example.com", password: "password123" },
  {
    _id: u3,
    name: "Charlie",
    email: "charlie@example.com",
    password: "password123",
  },
];

export const threads = [
  {
    _id: t1,
    title: "How do I learn Node.js?",
    content:
      "I am new to backend and want to learn Node.js. Any good resources?",
    subredditName: "node",
    author: u1,
    upvotedBy: [u2, u3], // Bob and Charlie liked it
    downvotedBy: [], // No one disliked it
  },
  {
    _id: t2,
    title: "Best way to manage state in React?",
    content:
      "What is the best way to manage state in larger React applications?",
    subredditName: "javascript",
    author: u2,
    upvotedBy: [u1], // Alice liked it
    downvotedBy: [u3], // Charlie disliked it
  },
  {
    _id: t3,
    title: "Modern CSS frameworks",
    content: "Which CSS frameworks are popular in 2025?",
    subredditName: "webdev",
    author: u3,
    upvotedBy: [], // No upvotes
    downvotedBy: [u1, u2], // Alice and Bob disliked it
  },
];

export const subreddits = [
  {
    name: "javascript",
    description: "All about JavaScript programming",
    author: u1,
  },
  {
    name: "node",
    description: "Node.js news and discussions",
    author: u2,
  },
  {
    name: "webdev",
    description: "General web development topics",
    author: u3,
  },
];

export const comments = [
  {
    thread: t1,
    user: u2,
    content: "Check out the Node.js docs, they’re really helpful!",
    upvotedBy: [u1],
    downvotedBy: [],
  },
  {
    thread: t2,
    user: u3,
    content: "I personally like Zustand for state management in React.",
    upvotedBy: [u1, u2],
    downvotedBy: [],
  },
  {
    thread: t3,
    user: u1,
    content: "Tailwind CSS is super popular right now.",
    upvotedBy: [u2],
    downvotedBy: [u3],
  },
  {
    thread: t1,
    user: u2,
    content: "You could also look into Express.js tutorials on YouTube.",
    upvotedBy: [],
    downvotedBy: [u3],
  },
];
