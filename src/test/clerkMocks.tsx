import { vi } from "vitest";
import React from "react";

// Must be hoisted so the mock is in place before any component imports clerk
const { useAuthMock, useClerkMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useClerkMock: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: useAuthMock,
  useClerk: useClerkMock,
  ClerkProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  SignedIn: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  SignedOut: ({ children }: { children: React.ReactNode }) => null,
  UserButton: () => null,
  RedirectToSignIn: () => null,
}));

export function mockClerkAuth(overrides: Record<string, unknown> = {}) {
  useAuthMock.mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue("test-token"),
    userId: "test-user-id",
    ...overrides,
  });
}

export function mockClerkSignedOut() {
  useAuthMock.mockReturnValue({
    isLoaded: true,
    isSignedIn: false,
    getToken: vi.fn(),
    userId: null,
  });
}

export { useAuthMock, useClerkMock };
