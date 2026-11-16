import { describe, expect, it } from "vitest";
import { getMongoDuplicateKey } from "./mongo-errors";

describe("getMongoDuplicateKey", () => {
  it("reads keyPattern from a MongoServerError-shaped object", () => {
    const result = getMongoDuplicateKey({
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: "a@b.com" },
      message: "E11000 duplicate key error collection: users index: email_1",
    });
    expect(result?.fields).toEqual(expect.arrayContaining(["email"]));
  });

  it("reads nested errorResponse", () => {
    const result = getMongoDuplicateKey({
      message: "wrapper",
      errorResponse: {
        code: 11000,
        keyPattern: { username: 1 },
      },
    });
    expect(result?.fields).toContain("username");
  });

  it("returns null for unrelated errors", () => {
    expect(getMongoDuplicateKey(new Error("boom"))).toBeNull();
  });
});
