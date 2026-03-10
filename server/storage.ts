import { db } from "./db";
import { eq, and, desc, sql, inArray, notInArray } from "drizzle-orm";
import {
  users, userProfiles, dailyTasks, readingPassages, readingQuestions,
  listeningPassages, listeningQuestions, writingPrompts, writingSubmissions,
  speakingPrompts, speakingSubmissions, userProgress, vocabularyItems,
  practiceAttempts, dailyUsage,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type DailyTask, type ReadingPassage, type ReadingQuestion,
  type ListeningPassage, type ListeningQuestion, type WritingPrompt,
  type WritingSubmission, type SpeakingPrompt, type SpeakingSubmission,
  type UserProgress, type VocabularyItem, type PracticeAttempt, type DailyUsage,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: Omit<InsertUserProfile, "userId"> & { userId: string }): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | undefined>;

  getDailyTasks(userId: string, date: string): Promise<DailyTask[]>;
  createDailyTask(task: any): Promise<DailyTask>;
  completeDailyTask(taskId: string): Promise<DailyTask | undefined>;

  getReadingPassages(): Promise<ReadingPassage[]>;
  getReadingPassage(id: string): Promise<ReadingPassage | undefined>;
  getReadingQuestions(passageId: string): Promise<ReadingQuestion[]>;
  getAllReadingQuestions(): Promise<ReadingQuestion[]>;
  createReadingPassage(passage: any): Promise<ReadingPassage>;
  updateReadingPassage(id: string, data: Partial<ReadingPassage>): Promise<ReadingPassage | undefined>;
  deleteReadingPassage(id: string): Promise<void>;
  createReadingQuestion(question: any): Promise<ReadingQuestion>;
  updateReadingQuestion(id: string, data: Partial<ReadingQuestion>): Promise<ReadingQuestion | undefined>;
  deleteReadingQuestion(id: string): Promise<void>;

  getListeningPassages(): Promise<ListeningPassage[]>;
  getListeningPassage(id: string): Promise<ListeningPassage | undefined>;
  getListeningQuestions(passageId: string): Promise<ListeningQuestion[]>;
  getAllListeningQuestions(): Promise<ListeningQuestion[]>;
  createListeningPassage(passage: any): Promise<ListeningPassage>;
  updateListeningPassage(id: string, data: Partial<ListeningPassage>): Promise<ListeningPassage | undefined>;
  deleteListeningPassage(id: string): Promise<void>;
  createListeningQuestion(question: any): Promise<ListeningQuestion>;
  updateListeningQuestion(id: string, data: Partial<ListeningQuestion>): Promise<ListeningQuestion | undefined>;
  deleteListeningQuestion(id: string): Promise<void>;

  getWritingPrompts(): Promise<WritingPrompt[]>;
  getWritingPrompt(id: string): Promise<WritingPrompt | undefined>;
  createWritingPrompt(prompt: any): Promise<WritingPrompt>;
  updateWritingPrompt(id: string, data: Partial<WritingPrompt>): Promise<WritingPrompt | undefined>;
  deleteWritingPrompt(id: string): Promise<void>;
  createWritingSubmission(submission: any): Promise<WritingSubmission>;

  getSpeakingPrompts(): Promise<SpeakingPrompt[]>;
  getSpeakingPrompt(id: string): Promise<SpeakingPrompt | undefined>;
  createSpeakingPrompt(prompt: any): Promise<SpeakingPrompt>;
  updateSpeakingPrompt(id: string, data: Partial<SpeakingPrompt>): Promise<SpeakingPrompt | undefined>;
  deleteSpeakingPrompt(id: string): Promise<void>;
  createSpeakingSubmission(submission: any): Promise<SpeakingSubmission>;

  getUserProgress(userId: string): Promise<UserProgress[]>;
  createUserProgress(progress: any): Promise<UserProgress>;

  getSkillScores(userId: string): Promise<{ listening: number; reading: number; writing: number; speaking: number }>;

  createPracticeAttempt(attempt: any): Promise<PracticeAttempt>;
  getPracticeAttempts(userId: string): Promise<PracticeAttempt[]>;
  getPracticeAttemptsByModule(userId: string, moduleType: string): Promise<PracticeAttempt[]>;
  getIncorrectAttempts(userId: string, moduleType?: string): Promise<PracticeAttempt[]>;

  getDailyUsage(userId: string, date: string): Promise<DailyUsage | undefined>;
  createOrUpdateDailyUsage(userId: string, date: string, moduleType: string): Promise<DailyUsage>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: any): Promise<UserProfile> {
    const [result] = await db.insert(userProfiles).values(profile).returning();
    return result;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const [result] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
    return result;
  }

  async getDailyTasks(userId: string, date: string): Promise<DailyTask[]> {
    return db.select().from(dailyTasks).where(and(eq(dailyTasks.userId, userId), eq(dailyTasks.date, date)));
  }

  async createDailyTask(task: any): Promise<DailyTask> {
    const [result] = await db.insert(dailyTasks).values(task).returning();
    return result;
  }

  async completeDailyTask(taskId: string): Promise<DailyTask | undefined> {
    const [result] = await db.update(dailyTasks).set({ completed: true }).where(eq(dailyTasks.id, taskId)).returning();
    return result;
  }

  async getReadingPassages(): Promise<ReadingPassage[]> {
    return db.select().from(readingPassages);
  }

  async getReadingPassage(id: string): Promise<ReadingPassage | undefined> {
    const [result] = await db.select().from(readingPassages).where(eq(readingPassages.id, id));
    return result;
  }

  async getReadingQuestions(passageId: string): Promise<ReadingQuestion[]> {
    return db.select().from(readingQuestions).where(eq(readingQuestions.passageId, passageId));
  }

  async getAllReadingQuestions(): Promise<ReadingQuestion[]> {
    return db.select().from(readingQuestions);
  }

  async createReadingPassage(passage: any): Promise<ReadingPassage> {
    const [result] = await db.insert(readingPassages).values(passage).returning();
    return result;
  }

  async updateReadingPassage(id: string, data: Partial<ReadingPassage>): Promise<ReadingPassage | undefined> {
    const [result] = await db.update(readingPassages).set(data).where(eq(readingPassages.id, id)).returning();
    return result;
  }

  async deleteReadingPassage(id: string): Promise<void> {
    await db.delete(readingQuestions).where(eq(readingQuestions.passageId, id));
    await db.delete(readingPassages).where(eq(readingPassages.id, id));
  }

  async createReadingQuestion(question: any): Promise<ReadingQuestion> {
    const [result] = await db.insert(readingQuestions).values(question).returning();
    return result;
  }

  async updateReadingQuestion(id: string, data: Partial<ReadingQuestion>): Promise<ReadingQuestion | undefined> {
    const [result] = await db.update(readingQuestions).set(data).where(eq(readingQuestions.id, id)).returning();
    return result;
  }

  async deleteReadingQuestion(id: string): Promise<void> {
    await db.delete(readingQuestions).where(eq(readingQuestions.id, id));
  }

  async getListeningPassages(): Promise<ListeningPassage[]> {
    return db.select().from(listeningPassages);
  }

  async getListeningPassage(id: string): Promise<ListeningPassage | undefined> {
    const [result] = await db.select().from(listeningPassages).where(eq(listeningPassages.id, id));
    return result;
  }

  async getListeningQuestions(passageId: string): Promise<ListeningQuestion[]> {
    return db.select().from(listeningQuestions).where(eq(listeningQuestions.passageId, passageId));
  }

  async getAllListeningQuestions(): Promise<ListeningQuestion[]> {
    return db.select().from(listeningQuestions);
  }

  async createListeningPassage(passage: any): Promise<ListeningPassage> {
    const [result] = await db.insert(listeningPassages).values(passage).returning();
    return result;
  }

  async updateListeningPassage(id: string, data: Partial<ListeningPassage>): Promise<ListeningPassage | undefined> {
    const [result] = await db.update(listeningPassages).set(data).where(eq(listeningPassages.id, id)).returning();
    return result;
  }

  async deleteListeningPassage(id: string): Promise<void> {
    await db.delete(listeningQuestions).where(eq(listeningQuestions.passageId, id));
    await db.delete(listeningPassages).where(eq(listeningPassages.id, id));
  }

  async createListeningQuestion(question: any): Promise<ListeningQuestion> {
    const [result] = await db.insert(listeningQuestions).values(question).returning();
    return result;
  }

  async updateListeningQuestion(id: string, data: Partial<ListeningQuestion>): Promise<ListeningQuestion | undefined> {
    const [result] = await db.update(listeningQuestions).set(data).where(eq(listeningQuestions.id, id)).returning();
    return result;
  }

  async deleteListeningQuestion(id: string): Promise<void> {
    await db.delete(listeningQuestions).where(eq(listeningQuestions.id, id));
  }

  async getWritingPrompts(): Promise<WritingPrompt[]> {
    return db.select().from(writingPrompts);
  }

  async getWritingPrompt(id: string): Promise<WritingPrompt | undefined> {
    const [result] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, id));
    return result;
  }

  async createWritingPrompt(prompt: any): Promise<WritingPrompt> {
    const [result] = await db.insert(writingPrompts).values(prompt).returning();
    return result;
  }

  async updateWritingPrompt(id: string, data: Partial<WritingPrompt>): Promise<WritingPrompt | undefined> {
    const [result] = await db.update(writingPrompts).set(data).where(eq(writingPrompts.id, id)).returning();
    return result;
  }

  async deleteWritingPrompt(id: string): Promise<void> {
    await db.delete(writingPrompts).where(eq(writingPrompts.id, id));
  }

  async createWritingSubmission(submission: any): Promise<WritingSubmission> {
    const [result] = await db.insert(writingSubmissions).values(submission).returning();
    return result;
  }

  async getSpeakingPrompts(): Promise<SpeakingPrompt[]> {
    return db.select().from(speakingPrompts);
  }

  async getSpeakingPrompt(id: string): Promise<SpeakingPrompt | undefined> {
    const [result] = await db.select().from(speakingPrompts).where(eq(speakingPrompts.id, id));
    return result;
  }

  async createSpeakingPrompt(prompt: any): Promise<SpeakingPrompt> {
    const [result] = await db.insert(speakingPrompts).values(prompt).returning();
    return result;
  }

  async updateSpeakingPrompt(id: string, data: Partial<SpeakingPrompt>): Promise<SpeakingPrompt | undefined> {
    const [result] = await db.update(speakingPrompts).set(data).where(eq(speakingPrompts.id, id)).returning();
    return result;
  }

  async deleteSpeakingPrompt(id: string): Promise<void> {
    await db.delete(speakingPrompts).where(eq(speakingPrompts.id, id));
  }

  async createSpeakingSubmission(submission: any): Promise<SpeakingSubmission> {
    const [result] = await db.insert(speakingSubmissions).values(submission).returning();
    return result;
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId)).orderBy(desc(userProgress.date));
  }

  async createUserProgress(progress: any): Promise<UserProgress> {
    const [result] = await db.insert(userProgress).values(progress).returning();
    return result;
  }

  async getSkillScores(userId: string): Promise<{ listening: number; reading: number; writing: number; speaking: number }> {
    const allProgress = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

    const getLatest = (skill: string) => {
      const skillEntries = allProgress.filter(p => p.skill === skill).sort((a, b) => b.date.localeCompare(a.date));
      if (skillEntries.length === 0) return 0;
      const recent = skillEntries.slice(0, 5);
      return Math.round(recent.reduce((sum, e) => sum + e.score, 0) / recent.length);
    };

    return {
      listening: getLatest("listening"),
      reading: getLatest("reading"),
      writing: getLatest("writing"),
      speaking: getLatest("speaking"),
    };
  }

  async createPracticeAttempt(attempt: any): Promise<PracticeAttempt> {
    const [result] = await db.insert(practiceAttempts).values(attempt).returning();
    return result;
  }

  async getPracticeAttempts(userId: string): Promise<PracticeAttempt[]> {
    return db.select().from(practiceAttempts).where(eq(practiceAttempts.userId, userId)).orderBy(desc(practiceAttempts.attemptedAt));
  }

  async getPracticeAttemptsByModule(userId: string, moduleType: string): Promise<PracticeAttempt[]> {
    return db.select().from(practiceAttempts)
      .where(and(eq(practiceAttempts.userId, userId), eq(practiceAttempts.moduleType, moduleType)))
      .orderBy(desc(practiceAttempts.attemptedAt));
  }

  async getIncorrectAttempts(userId: string, moduleType?: string): Promise<PracticeAttempt[]> {
    const conditions = [eq(practiceAttempts.userId, userId), eq(practiceAttempts.correct, false)];
    if (moduleType) conditions.push(eq(practiceAttempts.moduleType, moduleType));
    return db.select().from(practiceAttempts).where(and(...conditions)).orderBy(desc(practiceAttempts.attemptedAt));
  }

  async getDailyUsage(userId: string, date: string): Promise<DailyUsage | undefined> {
    const [result] = await db.select().from(dailyUsage).where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)));
    return result;
  }

  async createOrUpdateDailyUsage(userId: string, date: string, moduleType: string): Promise<DailyUsage> {
    let usage = await this.getDailyUsage(userId, date);
    if (!usage) {
      const [created] = await db.insert(dailyUsage).values({ userId, date, listeningCount: 0, readingCount: 0, writingCount: 0, speakingCount: 0 }).returning();
      usage = created;
    }

    const columnMap: Record<string, any> = {
      listening: dailyUsage.listeningCount,
      reading: dailyUsage.readingCount,
      writing: dailyUsage.writingCount,
      speaking: dailyUsage.speakingCount,
    };

    const col = columnMap[moduleType];
    if (col) {
      const [updated] = await db.update(dailyUsage).set({
        [moduleType + "Count"]: sql`${col} + 1`,
      }).where(eq(dailyUsage.id, usage.id)).returning();
      return updated;
    }
    return usage;
  }
}

export const storage = new DatabaseStorage();
