import { describe, it, expect } from "vitest";
import { hasRole, isRole, isMemberRole } from "../../utils/permissions.js";

describe("hasRole", () => {
  it("allows owners to access owner permissions", () => {
    expect(hasRole("owner", "owner")).toBe(true);
  });

  it("allows owners to access member permissions", () => {
    expect(hasRole("owner", "member")).toBe(true);
  });

  it("allows owners to access viewer permissions", () => {
    expect(hasRole("owner", "viewer")).toBe(true);
  });

  it("prevents members from accessing owner permissions", () => {
    expect(hasRole("member", "owner")).toBe(false);
  });

  it("allows members to access member permissions", () => {
    expect(hasRole("member", "member")).toBe(true);
  });

  it("allows members to access viewer permissions", () => {
    expect(hasRole("member", "viewer")).toBe(true);
  });

  it("prevents viewers from accessing owner permissions", () => {
    expect(hasRole("viewer", "owner")).toBe(false);
  });

  it("prevents viewers from accessing member permissions", () => {
    expect(hasRole("viewer", "member")).toBe(false);
  });

  it("allows viewers to access viewer permissions", () => {
    expect(hasRole("viewer", "viewer")).toBe(true);
  });
});

describe("isRole", () => {
  it("returns true for owner role", () => {
    expect(isRole("owner")).toBe(true);
  });

  it("returns true for member role", () => {
    expect(isRole("member")).toBe(true);
  });

  it("returns true for viewer role", () => {
    expect(isRole("viewer")).toBe(true);
  });

  it("returns false for invalid role", () => {
    expect(isRole("admin")).toBe(false);
  });
});

describe("isMemberRole", () => {
  it("returns true for member role", () => {
    expect(isMemberRole("member")).toBe(true);
  });

  it("returns true for viewer role", () => {
    expect(isMemberRole("viewer")).toBe(true);
  });

  it("returns false for owner role", () => {
    expect(isMemberRole("owner")).toBe(false);
  });

  it("returns false for invalid role", () => {
    expect(isMemberRole("admin")).toBe(false);
  });
});
