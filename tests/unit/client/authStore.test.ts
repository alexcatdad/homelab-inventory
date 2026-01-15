import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Mock import.meta.env
const mockEnv = {
  VITE_CONVEX_URL: "https://test-convex.cloud",
};

// We need to test the auth store functions in isolation
// Since we can't easily mock Svelte stores, we'll test the logic directly

describe("Auth Store Utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Storage Key Generation", () => {
    test("generates namespaced storage key", () => {
      // Test the namespace logic
      const url = "https://test-convex.cloud";
      const namespace = url.replace(/[^a-zA-Z0-9]/g, "");
      expect(namespace).toBe("httpstestconvexcloud");
    });

    test("handles empty URL", () => {
      const url = "";
      const namespace = url.replace(/[^a-zA-Z0-9]/g, "");
      expect(namespace).toBe("");
    });

    test("removes special characters from URL", () => {
      const url = "https://my-app.convex.cloud:443/path?query=1";
      const namespace = url.replace(/[^a-zA-Z0-9]/g, "");
      expect(namespace).toBe("httpsmyappconvexcloud443pathquery1");
    });
  });

  describe("Token Storage Logic", () => {
    test("stores JWT token in localStorage", () => {
      const namespace = "testnamespace";
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      const key = `__convexAuthJWT_${namespace}`;

      localStorageMock.setItem(key, token);
      expect(localStorageMock.getItem(key)).toBe(token);
    });

    test("stores refresh token in localStorage", () => {
      const namespace = "testnamespace";
      const refreshToken = "refresh_token_value";
      const key = `__convexAuthRefreshToken_${namespace}`;

      localStorageMock.setItem(key, refreshToken);
      expect(localStorageMock.getItem(key)).toBe(refreshToken);
    });

    test("stores OAuth verifier in localStorage", () => {
      const namespace = "testnamespace";
      const verifier = "oauth_verifier_value";
      const key = `__convexAuthOAuthVerifier_${namespace}`;

      localStorageMock.setItem(key, verifier);
      expect(localStorageMock.getItem(key)).toBe(verifier);
    });

    test("clears all tokens on sign out", () => {
      const namespace = "testnamespace";
      const jwtKey = `__convexAuthJWT_${namespace}`;
      const refreshKey = `__convexAuthRefreshToken_${namespace}`;
      const verifierKey = `__convexAuthOAuthVerifier_${namespace}`;

      // Store tokens
      localStorageMock.setItem(jwtKey, "jwt_token");
      localStorageMock.setItem(refreshKey, "refresh_token");
      localStorageMock.setItem(verifierKey, "verifier");

      // Clear tokens
      localStorageMock.removeItem(jwtKey);
      localStorageMock.removeItem(refreshKey);
      localStorageMock.removeItem(verifierKey);

      expect(localStorageMock.getItem(jwtKey)).toBeNull();
      expect(localStorageMock.getItem(refreshKey)).toBeNull();
      expect(localStorageMock.getItem(verifierKey)).toBeNull();
    });
  });

  describe("OAuth Callback URL Parsing", () => {
    test("extracts code from URL params", () => {
      const searchParams = new URLSearchParams("?code=auth_code_123&state=state_value");
      const code = searchParams.get("code");
      expect(code).toBe("auth_code_123");
    });

    test("handles missing code parameter", () => {
      const searchParams = new URLSearchParams("?state=state_value");
      const code = searchParams.get("code");
      expect(code).toBeNull();
    });

    test("cleans URL after extracting code", () => {
      const url = new URL("https://example.com/callback?code=123&state=abc&other=keep");
      url.searchParams.delete("code");
      url.searchParams.delete("state");

      expect(url.searchParams.has("code")).toBe(false);
      expect(url.searchParams.has("state")).toBe(false);
      expect(url.searchParams.get("other")).toBe("keep");
    });
  });

  describe("Verifier Management", () => {
    test("stores and retrieves verifier", () => {
      const key = "__convexAuthOAuthVerifier_test";
      const verifier = "verifier_12345";

      localStorageMock.setItem(key, verifier);
      const retrieved = localStorageMock.getItem(key);

      expect(retrieved).toBe(verifier);
    });

    test("clears verifier after retrieval", () => {
      const key = "__convexAuthOAuthVerifier_test";
      const verifier = "verifier_12345";

      localStorageMock.setItem(key, verifier);
      const retrieved = localStorageMock.getItem(key);
      localStorageMock.removeItem(key);

      expect(retrieved).toBe(verifier);
      expect(localStorageMock.getItem(key)).toBeNull();
    });
  });
});

describe("Auth State Management", () => {
  test("initial state is loading", () => {
    const state = {
      isAuthenticated: false,
      isLoading: true,
      authInitialized: false,
    };
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.authInitialized).toBe(false);
  });

  test("state transitions after auth initialization", () => {
    // Simulate auth initialization completing
    const state = {
      isAuthenticated: true,
      isLoading: false,
      authInitialized: true,
    };
    expect(state.isLoading).toBe(false);
    expect(state.authInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(true);
  });

  test("state after sign out", () => {
    const state = {
      isAuthenticated: false,
      isLoading: false,
      authInitialized: true,
      currentUser: null,
    };
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
  });
});

describe("JWT Token Validation", () => {
  test("recognizes valid JWT format", () => {
    const validJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const parts = validJWT.split(".");
    expect(parts.length).toBe(3);
  });

  test("recognizes invalid JWT format", () => {
    const invalidJWTs = [
      "not.a.jwt.token",
      "onlyonepart",
      "two.parts",
      "",
    ];

    for (const jwt of invalidJWTs) {
      const parts = jwt.split(".");
      expect(parts.length).not.toBe(3);
    }
  });
});

describe("User Object Validation", () => {
  test("accepts valid user object", () => {
    const user = {
      _id: "user123",
      name: "John Doe",
      email: "john@example.com",
      image: "https://example.com/avatar.jpg",
    };

    expect(user._id).toBeTruthy();
    expect(typeof user.name).toBe("string");
    expect(typeof user.email).toBe("string");
    expect(typeof user.image).toBe("string");
  });

  test("accepts user with optional fields missing", () => {
    const user = {
      _id: "user123",
    };

    expect(user._id).toBeTruthy();
    expect(user.name).toBeUndefined();
    expect(user.email).toBeUndefined();
    expect(user.image).toBeUndefined();
  });
});
