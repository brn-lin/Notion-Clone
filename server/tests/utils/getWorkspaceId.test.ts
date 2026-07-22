import { describe, it, expect } from "vitest";
import type { Request } from "express";

import { getWorkspaceId } from "../../utils/getWorkspaceId.js";

// ------------------
// Mock Express Request helper
// ------------------

const createRequest = (workspaceId?: string): Request => {
  return {
    workspaceId,
  } as Request;
};

// ------------------
// Tests
// ------------------

describe("getWorkspaceId", () => {
  it("returns workspace ID when it exists", () => {
    const req = createRequest("workspace-123");

    expect(getWorkspaceId(req)).toBe("workspace-123");
  });

  it("throws Workspace ID missing when workspace ID does not exist", () => {
    const req = createRequest();

    expect(() => getWorkspaceId(req)).toThrow("Workspace ID missing");
  });
});
