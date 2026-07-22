import { describe, it, expect } from "vitest";
import type { Request } from "express";

import { getUser } from "../../utils/getUser.js";
import type { AuthTokenPayload } from "../../middleware/authMiddleware.js";

// ------------------
// Mock Express Request helper
// ------------------

const createRequest = (user?: AuthTokenPayload): Request => {
  return {
    user,
  } as Request;
};

// ------------------
// Tests
// ------------------

describe("getUser", () => {
  it("returns the authenticated user from the request", () => {
    const user: AuthTokenPayload = {
      id: "user-123",
      email: "test@example.com",
    };

    const req = createRequest(user);

    expect(getUser(req)).toEqual(user);
  });

  it("throws Unauthorized when user is missing", () => {
    const req = createRequest();

    expect(() => getUser(req)).toThrow("Unauthorized");
  });
});
