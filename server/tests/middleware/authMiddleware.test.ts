import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import pool from "../../db.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

// --------------------
// Mock dependencies
// --------------------

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../db.js", () => ({
  default: {
    query: vi.fn(),
  },
}));

// --------------------
// Mock Express helpers
// --------------------

const createRequest = (authorization?: string): Request => {
  return {
    headers: {
      authorization,
    },
  } as Request;
};

const createResponse = (): Response => {
  const res = {} as Response;

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res;
};

const createNext = (): NextFunction => vi.fn();

// --------------------
// Tests
// --------------------

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = "test-secret";
  });

  it("returns 401 when no token is provided", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "No token provided",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer format is invalid", async () => {
    const req = createRequest("abc123");
    const res = createResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token format",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when JWT payload is invalid", async () => {
    vi.mocked(jwt.verify).mockImplementation(() => ({
      test: "invalid JWT payload",
    }));

    const req = createRequest("Bearer token");
    const res = createResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token payload",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when account has been deleted", async () => {
    vi.mocked(jwt.verify).mockImplementation(() => ({
      id: "123",
      email: "test@example.com",
    }));

    vi.mocked(pool.query).mockResolvedValue({
      rows: [],
    } as unknown as Awaited<ReturnType<typeof pool.query>>);

    const req = createRequest("Bearer token");
    const res = createResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Account deleted",
    });

    expect(next).not.toHaveBeenCalled();
  });

  // Testing successful authMiddleware
  it("adds the decoded user to req.user and calls next()", async () => {
    const decoded = {
      id: "123",
      email: "test@example.com",
    };

    vi.mocked(jwt.verify).mockImplementation(() => decoded);

    vi.mocked(pool.query).mockResolvedValue({
      rows: [
        {
          id: "123",
        },
      ],
    } as unknown as Awaited<ReturnType<typeof pool.query>>);

    const req = createRequest("Bearer token");
    const res = createResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(decoded);

    expect(next).toHaveBeenCalledOnce();

    expect(res.status).not.toHaveBeenCalled();
  });
});
