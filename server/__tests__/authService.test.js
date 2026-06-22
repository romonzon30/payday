// Set the audience the service will check before config/env is required.
process.env.GOOGLE_CLIENT_ID = "test-client";

const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

const jwt = require("jsonwebtoken");
const { connect, disconnect, clearDb } = require("./setup");
const authService = require("../services/authService");
const User = require("../models/User");

beforeAll(connect);
afterAll(disconnect);
beforeEach(async () => {
  await clearDb();
  mockVerifyIdToken.mockReset();
  global.fetch = jest.fn();
});

const okJson = (body) => ({ ok: true, json: async () => body });

describe("loginWithGoogleCredential", () => {
  test("creates a user from the ID token and returns a token + sanitized user", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-1", email: "ada@test.com", name: "Ada", picture: "p.png" }),
    });

    const { token, user } = await authService.loginWithGoogleCredential("id-token");

    expect(typeof token).toBe("string");
    expect(user.email).toBe("ada@test.com");
    expect(user).not.toHaveProperty("googleUid");
    expect(await User.countDocuments({ googleUid: "google-1" })).toBe(1);
  });

  test("reuses an existing user instead of duplicating", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-2", email: "b@test.com", name: "B" }),
    });
    await authService.loginWithGoogleCredential("id-token");
    await authService.loginWithGoogleCredential("id-token");
    expect(await User.countDocuments({ googleUid: "google-2" })).toBe(1);
  });
});

describe("register", () => {
  test("completes the profile for the user identified by the JWT", async () => {
    const user = await User.create({
      googleUid: "google-3",
      email: "c@test.com",
      emailNotificaciones: "c@test.com",
      nombreCompleto: "C",
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const res = await authService.register({ token, nombreCompleto: "C Updated", dni: "30111222" });

    expect(res.user.nombreCompleto).toBe("C Updated");
    expect(res.user).not.toHaveProperty("googleUid");
    const fresh = await User.findById(user._id);
    expect(fresh.dni).toBe("30111222");
  });
});

describe("loginWithGoogleAccess", () => {
  test("rejects a token whose audience is not this app", async () => {
    global.fetch.mockResolvedValueOnce(okJson({ aud: "some-other-client" }));
    await expect(authService.loginWithGoogleAccess({ accessToken: "x" })).rejects.toMatchObject({ status: 401 });
  });

  test("accepts a token with the right audience and creates the user", async () => {
    global.fetch
      .mockResolvedValueOnce(okJson({ aud: "test-client" })) // tokeninfo
      .mockResolvedValueOnce(okJson({ sub: "google-4", email: "d@test.com", name: "D" })); // userinfo

    const { token, user } = await authService.loginWithGoogleAccess({ accessToken: "x" });

    expect(typeof token).toBe("string");
    expect(user.email).toBe("d@test.com");
    expect(await User.countDocuments({ googleUid: "google-4" })).toBe(1);
  });
});
