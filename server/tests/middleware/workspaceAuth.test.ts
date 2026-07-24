import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

import pool from "../../db.js";
import { getUser } from "../../utils/getUser.js";
import { hasRole } from "../../utils/permissions.js";
import { workspaceAuth } from "../../middleware/workspaceAuth.js";

// --------------------
// Mock dependencies
// --------------------

vi.mock("../../db.js", () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock("../../utils/getUser.js", () => ({
  getUser: vi.fn(),
}));

vi.mock("../../utils/permissions.js", () => ({
  hasRole: vi.fn(),
}));

// --------------------
// Mock Express helpers
// --------------------

const createRequest = (workspaceId?: string): Request => {
  return {
    params: {
      workspaceId,
    },
  } as unknown as Request;
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

describe("workspaceAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when workspace ID is missing", async () => {
    const middleware = workspaceAuth();

    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      error: "Workspace ID required",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not a workspace member", async () => {
    vi.mocked(getUser).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
    });

    vi.mocked(pool.query).mockResolvedValue({
      rows: [],
    } as unknown as Awaited<ReturnType<typeof pool.query>>);

    const middleware = workspaceAuth("member");

    const req = createRequest("workspace-123");
    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      error: "Not a workspace member",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user lacks required permissions", async () => {
    vi.mocked(getUser).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
    });

    vi.mocked(pool.query).mockResolvedValue({
      rows: [
        {
          id: "workspace-123",
          role: "viewer",
        },
      ],
    } as unknown as Awaited<ReturnType<typeof pool.query>>);

    vi.mocked(hasRole).mockReturnValue(false);

    const middleware = workspaceAuth("owner");

    const req = createRequest("workspace-123");
    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      error: "Insufficient permissions",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("adds workspace information and calls next()", async () => {
    vi.mocked(getUser).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
    });

    vi.mocked(pool.query).mockResolvedValue({
      rows: [
        {
          id: "workspace-123",
          role: "member",
        },
      ],
    } as unknown as Awaited<ReturnType<typeof pool.query>>);

    vi.mocked(hasRole).mockReturnValue(true);

    const middleware = workspaceAuth("member");

    const req = createRequest("workspace-123");
    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(req.workspaceId).toBe("workspace-123");

    expect(req.memberRole).toBe("member");

    expect(next).toHaveBeenCalledOnce();

    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 500 when an error occurs", async () => {
    vi.mocked(getUser).mockImplementation(() => {
      throw new Error("Unauthorized");
    });

    const middleware = workspaceAuth();

    const req = createRequest("workspace-123");
    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Authorization failed",
    });

    expect(next).not.toHaveBeenCalled();
  });
});
