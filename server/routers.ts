import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAnnouncement,
  createApplication,
  createDocument,
  createMessage,
  createNotification,
  deleteJobPosition,
  getActiveAnnouncements,
  getActiveJobPositions,
  getAdminUnreadMessageCount,
  getAllAnnouncements,
  getAllApplicationsWithDetails,
  getAllJobPositions,
  getApplicationById,
  getApplicationsByUser,
  getApplicationsWithJobs,
  getApplicationsWithUnreadMessages,
  getDocumentById,
  getDocumentsByApplication,
  getJobPositionById,
  getMessagesByApplication,
  getNotificationsByUser,
  getUnreadMessageCount,
  getUnreadNotificationCount,
  getUserById,
  markAllNotificationsRead,
  markMessagesAsRead,
  markNotificationRead,
  updateAnnouncement,
  updateApplication,
  updateJobPosition,
  createJobPosition,
} from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildStatusChangeEmail, buildNewMessageEmail } from "./email";

// ─── Admin guard middleware ───────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  jobs: router({
    list: publicProcedure.query(() => getActiveJobPositions()),
    listAll: adminProcedure.query(() => getAllJobPositions()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) =>
      getJobPositionById(input.id)
    ),
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          category: z.string().min(1),
          description: z.string().optional(),
          requirements: z.string().optional(),
          location: z.string().optional(),
          employmentType: z.enum(["full-time", "part-time", "contract", "seasonal"]).optional(),
        })
      )
      .mutation(({ input }) => createJobPosition(input)),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          category: z.string().min(1).optional(),
          description: z.string().optional(),
          requirements: z.string().optional(),
          location: z.string().optional(),
          employmentType: z.enum(["full-time", "part-time", "contract", "seasonal"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateJobPosition(id, data);
      }),
    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteJobPosition(input.id)),
  }),

  // ─── Applications ──────────────────────────────────────────────────────────
  applications: router({
    myApplications: protectedProcedure.query(({ ctx }) =>
      getApplicationsWithJobs(ctx.user.id)
    ),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && app.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return app;
      }),
    create: protectedProcedure
      .input(
        z.object({
          jobPositionId: z.number(),
          fullName: z.string().min(1),
          gender: z.string().optional(),
          dateOfBirth: z.string().optional(),
          nationality: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          countryOfResidence: z.string().optional(),
          educationLevel: z.string().optional(),
          yearsOfExperience: z.string().optional(),
          coverLetter: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createApplication({
          ...input,
          userId: ctx.user.id,
          status: "draft",
        });
        return { id };
      }),
    submit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (app.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateApplication(input.id, { status: "submitted", submittedAt: new Date() });
        // Notification
        await createNotification({
          userId: ctx.user.id,
          type: "application_submitted",
          title: "Application Submitted",
          content: "Your application has been successfully submitted. We will review it shortly.",
          applicationId: input.id,
        });
        // Notify admin
        await notifyOwner({
          title: "New Application Submitted",
          content: `${app.fullName} has submitted an application for job ID ${app.jobPositionId}.`,
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          fullName: z.string().min(1).optional(),
          gender: z.string().optional(),
          dateOfBirth: z.string().optional(),
          nationality: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          countryOfResidence: z.string().optional(),
          educationLevel: z.string().optional(),
          yearsOfExperience: z.string().optional(),
          coverLetter: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const app = await getApplicationById(id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (app.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateApplication(id, data);
        return { success: true };
      }),

    // Admin
    listAll: adminProcedure
      .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
      .query(({ input }) => getAllApplicationsWithDetails(input.search, input.status)),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["draft", "submitted", "under_review", "interview_scheduled", "accepted", "rejected"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        await updateApplication(input.id, { status: input.status, adminNotes: input.adminNotes });
        // Notify applicant
        const statusLabels: Record<string, string> = {
          submitted: "Submitted",
          under_review: "Under Review",
          interview_scheduled: "Interview Scheduled",
          accepted: "Accepted",
          rejected: "Rejected",
        };
        await createNotification({
          userId: app.userId,
          type: "status_change",
          title: `Application Status Updated: ${statusLabels[input.status] ?? input.status}`,
          content: `Your application status has been updated to "${statusLabels[input.status] ?? input.status}".${input.adminNotes ? ` Note: ${input.adminNotes}` : ""}`,
          applicationId: input.id,
        });
        // Send email notification to applicant if email is available
        const applicant = await getUserById(app.userId);
        if (applicant?.email) {
          const emailPayload = buildStatusChangeEmail({
            applicantName: app.fullName ?? applicant.name ?? "Applicant",
            applicantEmail: applicant.email,
            status: input.status,
            adminNotes: input.adminNotes,
            applicationId: input.id,
          });
          await sendEmail(emailPayload).catch((err) =>
            console.warn("[Email] Failed to send status change email:", err)
          );
        }
        return { success: true };
      }),
    getWithDetails: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        const [job, docs] = await Promise.all([
          getJobPositionById(app.jobPositionId),
          getDocumentsByApplication(input.id),
        ]);
        const applicant = await getUserById(app.userId);
        return { application: app, job, documents: docs, applicant };
      }),
  }),

  // ─── Documents ─────────────────────────────────────────────────────────────
  documents: router({
    upload: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          type: z.enum(["cv", "photo", "id_passport", "certificate", "other"]),
          fileName: z.string(),
          fileData: z.string(), // base64
          mimeType: z.string(),
          fileSize: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (app.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const buffer = Buffer.from(input.fileData, "base64");
        const key = `applications/${input.applicationId}/${input.type}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        const docId = await createDocument({
          applicationId: input.applicationId,
          userId: ctx.user.id,
          type: input.type,
          fileName: input.fileName,
          fileKey: key,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        });
        return { id: docId, url };
      }),
    listByApplication: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && app.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return getDocumentsByApplication(input.applicationId);
      }),
    getDownloadUrl: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId);
        if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return { url: doc.fileUrl, fileName: doc.fileName };
      }),
  }),

  // ─── Messages ──────────────────────────────────────────────────────────────
  messages: router({
    getByApplication: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && app.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await markMessagesAsRead(input.applicationId, ctx.user.role as "user" | "admin");
        return getMessagesByApplication(input.applicationId);
      }),
    send: protectedProcedure
      .input(z.object({ applicationId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && app.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const msgId = await createMessage({
          applicationId: input.applicationId,
          senderId: ctx.user.id,
          senderRole: ctx.user.role as "user" | "admin",
          content: input.content,
        });
        // Notify the other party
        if (ctx.user.role === "admin") {
          await createNotification({
            userId: app.userId,
            type: "new_message",
            title: "New Message from Recruitment Team",
            content: input.content.substring(0, 200),
            applicationId: input.applicationId,
          });
          // Send email notification to applicant
          const applicant = await getUserById(app.userId);
          if (applicant?.email) {
            const emailPayload = buildNewMessageEmail({
              applicantName: app.fullName ?? applicant.name ?? "Applicant",
              applicantEmail: applicant.email,
              messagePreview: input.content,
              applicationId: input.applicationId,
            });
            await sendEmail(emailPayload).catch((err) =>
              console.warn("[Email] Failed to send new message email:", err)
            );
          }
        }
        return { id: msgId };
      }),
    unreadCount: protectedProcedure.query(({ ctx }) =>
      getUnreadMessageCount(ctx.user.id)
    ),
    adminUnreadCount: adminProcedure.query(() => getAdminUnreadMessageCount()),
    adminAllConversations: adminProcedure.query(() => getApplicationsWithUnreadMessages()),
  }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => getNotificationsByUser(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) =>
      getUnreadNotificationCount(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markNotificationRead(input.id)),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      markAllNotificationsRead(ctx.user.id)
    ),
  }),

  // ─── Announcements ─────────────────────────────────────────────────────────
  announcements: router({
    list: publicProcedure.query(() => getActiveAnnouncements()),
    listAll: adminProcedure.query(() => getAllAnnouncements()),
    create: adminProcedure
      .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
      .mutation(({ input }) => createAnnouncement(input)),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateAnnouncement(id, data);
      }),
  }),
});

export type AppRouter = typeof appRouter;
