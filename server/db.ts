import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Announcement,
  Application,
  Document,
  InsertAnnouncement,
  InsertApplication,
  InsertDocument,
  InsertJobPosition,
  InsertMessage,
  InsertNotification,
  InsertUser,
  JobPosition,
  Message,
  Notification,
  User,
  announcements,
  applications,
  documents,
  jobPositions,
  messages,
  notifications,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Job Positions ────────────────────────────────────────────────────────────
export async function getActiveJobPositions(): Promise<JobPosition[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPositions).where(eq(jobPositions.isActive, true)).orderBy(jobPositions.category, jobPositions.title);
}

export async function getAllJobPositions(): Promise<JobPosition[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPositions).orderBy(jobPositions.category, jobPositions.title);
}

export async function getJobPositionById(id: number): Promise<JobPosition | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobPositions).where(eq(jobPositions.id, id)).limit(1);
  return result[0];
}

export async function createJobPosition(data: InsertJobPosition): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(jobPositions).values(data);
}

export async function updateJobPosition(id: number, data: Partial<InsertJobPosition>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobPositions).set(data).where(eq(jobPositions.id, id));
}

export async function deleteJobPosition(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobPositions).set({ isActive: false }).where(eq(jobPositions.id, id));
}

// ─── Applications ─────────────────────────────────────────────────────────────
export async function createApplication(data: InsertApplication): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(applications).values(data);
  return (result[0] as any).insertId;
}

export async function getApplicationById(id: number): Promise<Application | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getApplicationsByUser(userId: number): Promise<Application[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}

export async function getAllApplications(search?: string, status?: string): Promise<Application[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(applications.status, status as any));
  }
  if (search) {
    conditions.push(
      or(
        like(applications.fullName, `%${search}%`),
        like(applications.email, `%${search}%`),
        like(applications.nationality, `%${search}%`)
      )
    );
  }
  return db
    .select()
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.createdAt));
}

export async function updateApplication(id: number, data: Partial<InsertApplication>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getApplicationWithJob(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(applications)
    .leftJoin(jobPositions, eq(applications.jobPositionId, jobPositions.id))
    .where(eq(applications.id, id))
    .limit(1);
  return result[0];
}

export async function getApplicationsWithJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(applications)
    .leftJoin(jobPositions, eq(applications.jobPositionId, jobPositions.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
}

export async function getAllApplicationsWithDetails(search?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(applications.status, status as any));
  }
  if (search) {
    conditions.push(
      or(
        like(applications.fullName, `%${search}%`),
        like(applications.email, `%${search}%`),
        like(applications.nationality, `%${search}%`)
      )
    );
  }
  return db
    .select()
    .from(applications)
    .leftJoin(jobPositions, eq(applications.jobPositionId, jobPositions.id))
    .leftJoin(users, eq(applications.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.createdAt));
}

// ─── Documents ────────────────────────────────────────────────────────────────
export async function createDocument(data: InsertDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(documents).values(data);
  return (result[0] as any).insertId;
}

export async function getDocumentsByApplication(applicationId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.applicationId, applicationId));
}

export async function getDocumentById(id: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function createMessage(data: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  return (result[0] as any).insertId;
}

export async function getMessagesByApplication(applicationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.applicationId, applicationId)).orderBy(messages.createdAt);
}

export async function markMessagesAsRead(applicationId: number, readerRole: "user" | "admin"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const senderRole = readerRole === "user" ? "admin" : "user";
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.applicationId, applicationId), eq(messages.senderRole, senderRole)));
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const userApps = await db.select({ id: applications.id }).from(applications).where(eq(applications.userId, userId));
  if (userApps.length === 0) return 0;
  const appIds = userApps.map((a) => a.id);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        sql`${messages.applicationId} IN (${sql.join(appIds.map((id) => sql`${id}`), sql`, `)})`,
        eq(messages.senderRole, "admin"),
        eq(messages.isRead, false)
      )
    );
  return Number(result[0]?.count ?? 0);
}

export async function getAdminUnreadMessageCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.senderRole, "user"), eq(messages.isRead, false)));
  return Number(result[0]?.count ?? 0);
}

export async function getApplicationsWithUnreadMessages() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(applications)
    .leftJoin(jobPositions, eq(applications.jobPositionId, jobPositions.id))
    .leftJoin(users, eq(applications.userId, users.id))
    .orderBy(desc(applications.updatedAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count ?? 0);
}

// ─── Announcements ────────────────────────────────────────────────────────────
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt)).limit(10);
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(data: InsertAnnouncement): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(announcements).values(data);
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}
