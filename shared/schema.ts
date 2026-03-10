import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  role: text("role").default("user"),
  subscriptionStatus: text("subscription_status").default("free"),
  premiumOverride: boolean("premium_override").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  examType: text("exam_type"),
  currentLevel: text("current_level"),
  targetScore: text("target_score"),
  examDate: text("exam_date"),
  weakSkill: text("weak_skill"),
  dailyStudyTime: text("daily_study_time"),
  streak: integer("streak").default(0),
  totalStudyMinutes: integer("total_study_minutes").default(0),
  predictedScore: real("predicted_score"),
  confidence: text("confidence"),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  score: real("score"),
  referenceId: varchar("reference_id"),
});

export const readingPassages = pgTable("reading_passages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category"),
  examType: text("exam_type"),
  timeLimit: integer("time_limit").default(20),
});

export const readingQuestions = pgTable("reading_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  passageId: varchar("passage_id").notNull().references(() => readingPassages.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").default(0),
});

export const listeningPassages = pgTable("listening_passages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  transcript: text("transcript").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category"),
  examType: text("exam_type"),
  duration: integer("duration"),
});

export const listeningQuestions = pgTable("listening_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  passageId: varchar("passage_id").notNull().references(() => listeningPassages.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").default(0),
});

export const writingPrompts = pgTable("writing_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  promptText: text("prompt_text").notNull(),
  taskType: text("task_type").notNull(),
  difficulty: text("difficulty").notNull(),
  examType: text("exam_type"),
  minWords: integer("min_words").default(150),
  maxWords: integer("max_words").default(300),
  timeLimit: integer("time_limit").default(40),
});

export const writingSubmissions = pgTable("writing_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: varchar("prompt_id").notNull().references(() => writingPrompts.id),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  score: real("score"),
  feedback: jsonb("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const speakingPrompts = pgTable("speaking_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  promptText: text("prompt_text").notNull(),
  taskType: text("task_type").notNull(),
  difficulty: text("difficulty").notNull(),
  examType: text("exam_type"),
  preparationTime: integer("preparation_time").default(30),
  responseTime: integer("response_time").default(60),
});

export const speakingSubmissions = pgTable("speaking_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: varchar("prompt_id").notNull().references(() => speakingPrompts.id),
  transcript: text("transcript"),
  score: real("score"),
  feedback: jsonb("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  skill: text("skill").notNull(),
  score: real("score").notNull(),
  date: text("date").notNull(),
});

export const practiceAttempts = pgTable("practice_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: varchar("question_id").notNull(),
  moduleType: text("module_type").notNull(),
  score: real("score"),
  correct: boolean("correct").default(false),
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer"),
  questionText: text("question_text"),
  explanation: text("explanation"),
  aiFeedback: jsonb("ai_feedback"),
  difficulty: text("difficulty"),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const dailyUsage = pgTable("daily_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  listeningCount: integer("listening_count").default(0),
  readingCount: integer("reading_count").default(0),
  writingCount: integer("writing_count").default(0),
  speakingCount: integer("speaking_count").default(0),
});

export const vocabularyItems = pgTable("vocabulary_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull(),
  definition: text("definition").notNull(),
  example: text("example"),
  pronunciation: text("pronunciation"),
  partOfSpeech: text("part_of_speech"),
  difficulty: text("difficulty"),
  category: text("category"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
});

export const insertReadingPassageSchema = createInsertSchema(readingPassages).omit({
  id: true,
});

export const insertReadingQuestionSchema = createInsertSchema(readingQuestions).omit({
  id: true,
});

export const insertListeningPassageSchema = createInsertSchema(listeningPassages).omit({
  id: true,
});

export const insertListeningQuestionSchema = createInsertSchema(listeningQuestions).omit({
  id: true,
});

export const insertWritingPromptSchema = createInsertSchema(writingPrompts).omit({
  id: true,
});

export const insertWritingSubmissionSchema = createInsertSchema(writingSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertSpeakingPromptSchema = createInsertSchema(speakingPrompts).omit({
  id: true,
});

export const insertSpeakingSubmissionSchema = createInsertSchema(speakingSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export const insertVocabularyItemSchema = createInsertSchema(vocabularyItems).omit({
  id: true,
});

export const insertPracticeAttemptSchema = createInsertSchema(practiceAttempts).omit({
  id: true,
  attemptedAt: true,
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type ReadingPassage = typeof readingPassages.$inferSelect;
export type ReadingQuestion = typeof readingQuestions.$inferSelect;
export type ListeningPassage = typeof listeningPassages.$inferSelect;
export type ListeningQuestion = typeof listeningQuestions.$inferSelect;
export type WritingPrompt = typeof writingPrompts.$inferSelect;
export type WritingSubmission = typeof writingSubmissions.$inferSelect;
export type SpeakingPrompt = typeof speakingPrompts.$inferSelect;
export type SpeakingSubmission = typeof speakingSubmissions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type VocabularyItem = typeof vocabularyItems.$inferSelect;
export type PracticeAttempt = typeof practiceAttempts.$inferSelect;
export type DailyUsage = typeof dailyUsage.$inferSelect;
