import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getActiveJobPositions: vi.fn().mockResolvedValue([
    { id: 1, title: "Chef", category: "Kitchen & Culinary", location: "Copenhagen, Denmark", employmentType: "full-time", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getAllJobPositions: vi.fn().mockResolvedValue([]),
  getJobPositionById: vi.fn().mockResolvedValue({ id: 1, title: "Chef", category: "Kitchen & Culinary", location: "Copenhagen, Denmark", employmentType: "full-time", isActive: true, createdAt: new Date(), updatedAt: new Date() }),
  createJobPosition: vi.fn().mockResolvedValue(1),
  updateJobPosition: vi.fn().mockResolvedValue(undefined),
  deleteJobPosition: vi.fn().mockResolvedValue(undefined),
  createApplication: vi.fn().mockResolvedValue(42),
  getApplicationById: vi.fn().mockResolvedValue({
    id: 42, userId: 1, jobPositionId: 1, fullName: "John Doe", status: "draft",
    createdAt: new Date(), updatedAt: new Date(), submittedAt: null, adminNotes: null,
  }),
  getApplicationsByUser: vi.fn().mockResolvedValue([]),
  getApplicationsWithJobs: vi.fn().mockResolvedValue([]),
  getAllApplicationsWithDetails: vi.fn().mockResolvedValue([]),
  updateApplication: vi.fn().mockResolvedValue(undefined),
  createDocument: vi.fn().mockResolvedValue(10),
  getDocumentsByApplication: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue({ id: 10, userId: 1, applicationId: 42, fileUrl: "/manus-storage/test", fileName: "cv.pdf", fileKey: "test", type: "cv", mimeType: "application/pdf", fileSize: 1024, createdAt: new Date() }),
  createMessage: vi.fn().mockResolvedValue(5),
  getMessagesByApplication: vi.fn().mockResolvedValue([]),
  markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadMessageCount: vi.fn().mockResolvedValue(0),
  getAdminUnreadMessageCount: vi.fn().mockResolvedValue(0),
  getApplicationsWithUnreadMessages: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUser: vi.fn().mockResolvedValue([]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getActiveAnnouncements: vi.fn().mockResolvedValue([]),
  getAllAnnouncements: vi.fn().mockResolvedValue([]),
  createAnnouncement: vi.fn().mockResolvedValue(1),
  updateAnnouncement: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "John Doe", email: "john@example.com", role: "user", openId: "user-1", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), loginMethod: "manus" }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makeCtx(role: "user" | "admin" = "user", userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `open-${userId}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null user for unauthenticated request", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated request", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const user = await caller.auth.me();
    expect(user?.role).toBe("user");
    expect(user?.id).toBe(1);
  });

  it("clears session cookie on logout", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect((ctx.res.clearCookie as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});

describe("jobs", () => {
  it("lists active jobs publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const jobs = await caller.jobs.list();
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs[0].title).toBe("Chef");
  });

  it("gets a job by id publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const job = await caller.jobs.getById({ id: 1 });
    expect(job?.title).toBe("Chef");
  });

  it("blocks non-admin from creating jobs", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.jobs.create({ title: "New Job", category: "Test" })).rejects.toThrow();
  });

  it("allows admin to create jobs", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.jobs.create({ title: "New Job", category: "Test" });
    expect(result).toBe(1);
  });
});

describe("applications", () => {
  it("creates an application for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.applications.create({
      jobPositionId: 1,
      fullName: "John Doe",
    });
    expect(result.id).toBe(42);
  });

  it("blocks unauthenticated application creation", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.applications.create({ jobPositionId: 1, fullName: "John" })
    ).rejects.toThrow();
  });

  it("submits an application and creates notification", async () => {
    const { createNotification } = await import("./db");
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.applications.submit({ id: 42 });
    expect(result.success).toBe(true);
    expect(vi.mocked(createNotification)).toHaveBeenCalled();
  });

  it("blocks non-owner from submitting another user's application", async () => {
    const caller = appRouter.createCaller(makeCtx("user", 99)); // different user
    await expect(caller.applications.submit({ id: 42 })).rejects.toThrow();
  });

  it("allows admin to update application status", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.applications.updateStatus({ id: 42, status: "under_review" });
    expect(result.success).toBe(true);
  });

  it("sends notification when admin updates status", async () => {
    const { createNotification } = await import("./db");
    vi.mocked(createNotification).mockClear();
    const caller = appRouter.createCaller(makeCtx("admin"));
    await caller.applications.updateStatus({ id: 42, status: "accepted" });
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ type: "status_change" })
    );
  });
});

describe("documents", () => {
  it("blocks unauthenticated document upload", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.documents.upload({
        applicationId: 42,
        type: "cv",
        fileName: "cv.pdf",
        fileData: "base64data",
        mimeType: "application/pdf",
      })
    ).rejects.toThrow();
  });

  it("allows owner to upload document", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.documents.upload({
      applicationId: 42,
      type: "cv",
      fileName: "cv.pdf",
      fileData: "dGVzdA==",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.id).toBe(10);
    expect(result.url).toContain("/manus-storage/");
  });

  it("returns secure download URL for document owner", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.documents.getDownloadUrl({ documentId: 10 });
    expect(result.url).toBeDefined();
    expect(result.fileName).toBe("cv.pdf");
  });

  it("blocks non-owner from downloading document", async () => {
    const caller = appRouter.createCaller(makeCtx("user", 99));
    await expect(caller.documents.getDownloadUrl({ documentId: 10 })).rejects.toThrow();
  });

  it("allows admin to download any document", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.documents.getDownloadUrl({ documentId: 10 });
    expect(result.url).toBeDefined();
  });
});

describe("messages", () => {
  it("blocks unauthenticated messaging", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.messages.send({ applicationId: 42, content: "Hello" })
    ).rejects.toThrow();
  });

  it("allows owner to send message", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.messages.send({ applicationId: 42, content: "Hello" });
    expect(result.id).toBe(5);
  });

  it("sends notification to applicant when admin sends message", async () => {
    const { createNotification } = await import("./db");
    vi.mocked(createNotification).mockClear();
    const caller = appRouter.createCaller(makeCtx("admin"));
    await caller.messages.send({ applicationId: 42, content: "Interview scheduled!" });
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({ type: "new_message" })
    );
  });
});

describe("notifications", () => {
  it("requires authentication to list notifications", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.notifications.list()).rejects.toThrow();
  });

  it("returns notifications for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("marks a notification as read", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.notifications.markRead({ id: 1 })).resolves.not.toThrow();
  });
});

describe("announcements", () => {
  it("lists active announcements publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.announcements.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin from creating announcements", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.announcements.create({ title: "Test", content: "Test content" })
    ).rejects.toThrow();
  });

  it("allows admin to create announcements", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.announcements.create({ title: "Test", content: "Test content" });
    expect(result).toBe(1);
  });
});
