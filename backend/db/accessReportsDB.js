import { ObjectId } from "mongodb";
import { getDb } from "./connection.js";
import { escapeRegex } from "./pagination.js";

const COLLECTION = "access_reports";

function reports() {
  return getDb().collection(COLLECTION);
}

export async function createIndexes() {
  await reports().createIndexes([
    { key: { location: 1, status: 1 } },
    { key: { category: 1 } },
    { key: { status: 1, createdAt: -1 } },
  ]);
}

function buildFilter({ location, category, status, severity, q }) {
  const filter = {};
  if (location) filter.location = location;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }
  return filter;
}

export async function listReports(query, { skip, limit }) {
  const filter = buildFilter(query);
  const [items, total] = await Promise.all([
    reports()
      .find(filter)
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    reports().countDocuments(filter),
  ]);
  return { items, total };
}

export async function getReport(id) {
  return reports().findOne({ _id: new ObjectId(id) });
}

export async function createReport(data) {
  const now = new Date();
  const doc = {
    ...data,
    createdAt: now,
    updatedAt: now,
    resolvedAt: data.status === "resolved" ? now : null,
  };
  const result = await reports().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

export async function updateReport(id, data) {
  const now = new Date();
  const existing = await getReport(id);
  if (!existing) return null;

  let resolvedAt = existing.resolvedAt ?? null;
  if (data.status === "resolved" && existing.status !== "resolved") {
    resolvedAt = now;
  } else if (data.status === "open") {
    resolvedAt = null;
  }

  return reports().findOneAndUpdate(
    { _id: existing._id },
    { $set: { ...data, resolvedAt, updatedAt: now } },
    { returnDocument: "after" },
  );
}

export async function deleteReport(id) {
  const result = await reports().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function insertManyReports(docs) {
  await reports().deleteMany({});
  return reports().insertMany(docs);
}
