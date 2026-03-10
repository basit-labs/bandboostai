import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, hashPassword } from "./auth";
import { seedDatabase } from "./seed";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function hasPremiumAccess(user: any): boolean {
  if (user.role === "owner" || user.role === "admin") return true;
  if (user.premiumOverride) return true;
  if (user.subscriptionStatus === "active") return true;
  return false;
}

const FREE_DAILY_LIMIT = 3;

function analyzeWriting(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const vocabDiversity = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 0;

  const grammarScore = Math.min(9, Math.max(3, 5 + (avgSentenceLength > 8 && avgSentenceLength < 25 ? 2 : 0) + (wordCount > 150 ? 1 : 0)));
  const vocabScore = Math.min(9, Math.max(3, Math.round(vocabDiversity / 10) + 3));
  const coherenceScore = Math.min(9, Math.max(3, 4 + (sentences.length > 3 ? 1 : 0) + (wordCount > 200 ? 1 : 0) + (content.includes('\n') ? 1 : 0)));
  const taskScore = Math.min(9, Math.max(3, wordCount >= 150 ? 6 : wordCount >= 100 ? 5 : 4));

  const overall = Math.round(((grammarScore + vocabScore + coherenceScore + taskScore) / 4) * 10) / 10;

  const suggestions: string[] = [];
  if (wordCount < 150) suggestions.push("Try to write at least 150 words to fully develop your argument.");
  if (avgSentenceLength > 25) suggestions.push("Some sentences are quite long. Try breaking them into shorter, clearer sentences.");
  if (avgSentenceLength < 8) suggestions.push("Your sentences are quite short. Try combining ideas using linking words.");
  if (vocabDiversity < 40) suggestions.push("Try to use a wider range of vocabulary to improve your lexical resource score.");
  if (sentences.length < 4) suggestions.push("Structure your response with more sentences to improve coherence.");

  return {
    score: overall,
    breakdown: {
      grammar: grammarScore,
      vocabulary: vocabScore,
      coherence: coherenceScore,
      task_completion: taskScore,
    },
    suggestions,
  };
}

function analyzeSpeaking(transcript: string) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const fluencyScore = Math.min(9, Math.max(3, wordCount > 50 ? 6 : wordCount > 30 ? 5 : 4));
  const vocabScore = Math.min(9, Math.max(3, Math.round((uniqueWords / Math.max(wordCount, 1)) * 10) + 2));
  const grammarScore = Math.min(9, Math.max(3, sentences.length > 2 ? 6 : 5));
  const pronunciationScore = Math.min(9, Math.max(3, 5 + (wordCount > 40 ? 1 : 0)));

  const overall = Math.round(((fluencyScore + vocabScore + grammarScore + pronunciationScore) / 4) * 10) / 10;

  const suggestions: string[] = [];
  if (wordCount < 30) suggestions.push("Try to speak more. Aim for longer responses with more detail.");
  if (sentences.length < 3) suggestions.push("Structure your response with clear sentences for better coherence.");
  suggestions.push("Practice speaking at a steady pace without long pauses.");

  return {
    score: overall,
    breakdown: {
      fluency: fluencyScore,
      vocabulary: vocabScore,
      grammar: grammarScore,
      pronunciation: pronunciationScore,
    },
    suggestions,
  };
}

async function generateDailyTasks(userId: string, date: string) {
  const existing = await storage.getDailyTasks(userId, date);
  if (existing.length > 0) return existing;

  const taskTemplates = [
    { taskType: "listening", title: "Daily Listening Practice", description: "Complete a listening passage with comprehension questions" },
    { taskType: "reading", title: "Daily Reading Practice", description: "Read a passage and answer questions within the time limit" },
    { taskType: "writing", title: "Daily Writing Task", description: "Write an essay response to a given prompt" },
    { taskType: "speaking", title: "Daily Speaking Practice", description: "Record a response to a speaking prompt" },
  ];

  const tasks = [];
  for (const template of taskTemplates) {
    const task = await storage.createDailyTask({
      userId,
      date,
      ...template,
      completed: false,
    });
    tasks.push(task);
  }
  return tasks;
}

async function createOwnerAccount() {
  const existing = await storage.getUserByUsername("owner@bandboost.ai");
  if (existing) return;

  await storage.createUser({
    username: "owner@bandboost.ai",
    password: hashPassword("securepassword"),
    displayName: "BandBoost Owner",
    email: "owner@bandboost.ai",
  });

  const owner = await storage.getUserByUsername("owner@bandboost.ai");
  if (owner) {
    await storage.updateUser(owner.id, {
      role: "owner",
      subscriptionStatus: "active",
      premiumOverride: true,
      onboardingComplete: true,
    });

    await storage.createUserProfile({
      userId: owner.id,
      examType: "ielts",
      currentLevel: "advanced",
      targetScore: "9.0",
      weakSkill: "none",
      dailyStudyTime: "60",
      streak: 0,
      totalStudyMinutes: 0,
      predictedScore: 9.0,
      confidence: "Owner",
    });
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  await seedDatabase();
  await createOwnerAccount();

  app.get("/api/user/profile", requireAuth, async (req, res) => {
    const user = req.user as any;
    const profile = await storage.getUserProfile(user.id);
    if (!profile) return res.json(null);
    res.json(profile);
  });

  app.post("/api/user/profile", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { examType, currentLevel, targetScore, examDate, weakSkill, dailyStudyTime } = req.body;

    let profile = await storage.getUserProfile(user.id);
    if (profile) {
      profile = await storage.updateUserProfile(user.id, {
        examType, currentLevel, targetScore, examDate, weakSkill, dailyStudyTime,
        predictedScore: 5.5,
        confidence: "Building data...",
      });
    } else {
      profile = await storage.createUserProfile({
        userId: user.id,
        examType, currentLevel, targetScore, examDate, weakSkill, dailyStudyTime,
        streak: 0,
        totalStudyMinutes: 0,
        predictedScore: 5.5,
        confidence: "Building data...",
      });
    }

    await storage.updateUser(user.id, { onboardingComplete: true });
    res.json(profile);
  });

  app.get("/api/user/skills", requireAuth, async (req, res) => {
    const user = req.user as any;
    const skills = await storage.getSkillScores(user.id);
    res.json(skills);
  });

  app.get("/api/user/progress", requireAuth, async (req, res) => {
    const user = req.user as any;
    const progress = await storage.getUserProgress(user.id);
    res.json(progress);
  });

  app.get("/api/tasks/today", requireAuth, async (req, res) => {
    const user = req.user as any;
    const tasks = await generateDailyTasks(user.id, getToday());
    res.json(tasks);
  });

  app.post("/api/tasks/:taskId/complete", requireAuth, async (req, res) => {
    const user = req.user as any;
    const today = getToday();
    const tasks = await storage.getDailyTasks(user.id, today);
    const task = tasks.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const completed = await storage.completeDailyTask(req.params.taskId);
    const profile = await storage.getUserProfile(user.id);
    if (profile) {
      await storage.updateUserProfile(user.id, {
        totalStudyMinutes: (profile.totalStudyMinutes || 0) + 15,
      });
    }

    res.json(completed);
  });

  app.post("/api/tasks/complete-by-type", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { taskType } = req.body;
    const today = getToday();
    const tasks = await storage.getDailyTasks(user.id, today);
    const task = tasks.find(t => t.taskType === taskType && !t.completed);
    if (task) {
      await storage.completeDailyTask(task.id);
    }
    res.json({ success: true });
  });

  app.get("/api/practice/session/:module", requireAuth, async (req, res) => {
    const user = req.user as any;
    const moduleType = req.params.module;
    const isPremium = hasPremiumAccess(user);
    const today = getToday();

    const usage = await storage.getDailyUsage(user.id, today);
    const countKey = moduleType + "Count" as keyof typeof usage;
    const currentCount = usage ? (usage as any)[countKey] || 0 : 0;

    if (!isPremium && currentCount >= FREE_DAILY_LIMIT) {
      return res.status(403).json({
        message: "Daily free limit reached. Upgrade to premium for unlimited practice.",
        limitReached: true,
        currentCount,
        limit: FREE_DAILY_LIMIT,
      });
    }

    let allQuestions: any[] = [];
    const sessionSize = (moduleType === "writing" || moduleType === "speaking") ? 5 : 10;

    if (moduleType === "reading") {
      allQuestions = await storage.getAllReadingQuestions();
    } else if (moduleType === "listening") {
      allQuestions = await storage.getAllListeningQuestions();
    } else if (moduleType === "writing") {
      allQuestions = (await storage.getWritingPrompts()).map(p => ({ ...p, questionId: p.id }));
    } else if (moduleType === "speaking") {
      allQuestions = (await storage.getSpeakingPrompts()).map(p => ({ ...p, questionId: p.id }));
    }

    if (!isPremium) {
      allQuestions = allQuestions.slice(0, 10);
    }

    const difficulty = await getAdaptiveDifficulty(user.id, moduleType);
    if (difficulty && allQuestions.some(q => q.difficulty)) {
      const difficultyMatches = allQuestions.filter(q =>
        q.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
      if (difficultyMatches.length >= sessionSize) {
        allQuestions = difficultyMatches;
      }
    }

    const attempts = await storage.getPracticeAttemptsByModule(user.id, moduleType);
    const attemptedIds = new Set(attempts.map(a => a.questionId));
    const incorrectIds = new Set(attempts.filter(a => !a.correct).map(a => a.questionId));

    const incorrect = allQuestions.filter(q => incorrectIds.has(q.id));
    const unattempted = allQuestions.filter(q => !attemptedIds.has(q.id));
    const correctOld = allQuestions.filter(q => attemptedIds.has(q.id) && !incorrectIds.has(q.id));

    let selected: any[] = [];
    selected.push(...shuffleArray(incorrect).slice(0, Math.ceil(sessionSize * 0.4)));
    const remaining = sessionSize - selected.length;
    selected.push(...shuffleArray(unattempted).slice(0, Math.ceil(remaining * 0.7)));
    const stillNeeded = sessionSize - selected.length;
    if (stillNeeded > 0) {
      selected.push(...shuffleArray(correctOld).slice(0, stillNeeded));
    }
    if (selected.length < sessionSize) {
      const usedIds = new Set(selected.map(q => q.id));
      const leftover = allQuestions.filter(q => !usedIds.has(q.id));
      selected.push(...shuffleArray(leftover).slice(0, sessionSize - selected.length));
    }

    selected = shuffleArray(selected).slice(0, sessionSize);

    await storage.createOrUpdateDailyUsage(user.id, today, moduleType);

    res.json({
      questions: selected,
      sessionSize,
      isPremium,
      dailyUsed: currentCount + 1,
      dailyLimit: isPremium ? null : FREE_DAILY_LIMIT,
      suggestedDifficulty: difficulty,
    });
  });

  app.post("/api/practice/attempt", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { questionId, moduleType, correct, userAnswer, correctAnswer, questionText, explanation, score, difficulty } = req.body;

    const attempt = await storage.createPracticeAttempt({
      userId: user.id,
      questionId,
      moduleType,
      correct: !!correct,
      userAnswer,
      correctAnswer,
      questionText,
      explanation,
      score,
      difficulty,
    });

    res.json(attempt);
  });

  app.get("/api/practice/mistakes", requireAuth, async (req, res) => {
    const user = req.user as any;
    const moduleType = req.query.module as string | undefined;
    const mistakes = await storage.getIncorrectAttempts(user.id, moduleType);
    res.json(mistakes);
  });

  app.get("/api/practice/history", requireAuth, async (req, res) => {
    const user = req.user as any;
    const attempts = await storage.getPracticeAttempts(user.id);

    const moduleStats: Record<string, { total: number; correct: number; avgScore: number }> = {};
    for (const a of attempts) {
      if (!moduleStats[a.moduleType]) {
        moduleStats[a.moduleType] = { total: 0, correct: 0, avgScore: 0 };
      }
      moduleStats[a.moduleType].total++;
      if (a.correct) moduleStats[a.moduleType].correct++;
    }

    for (const mod of Object.keys(moduleStats)) {
      moduleStats[mod].avgScore = moduleStats[mod].total > 0
        ? Math.round((moduleStats[mod].correct / moduleStats[mod].total) * 100)
        : 0;
    }

    const usage = await storage.getDailyUsage(user.id, getToday());

    res.json({
      totalAttempts: attempts.length,
      moduleStats,
      dailyUsage: usage || { listeningCount: 0, readingCount: 0, writingCount: 0, speakingCount: 0 },
    });
  });

  app.get("/api/practice/daily-usage", requireAuth, async (req, res) => {
    const user = req.user as any;
    const usage = await storage.getDailyUsage(user.id, getToday());
    const isPremium = hasPremiumAccess(user);
    res.json({
      usage: usage || { listeningCount: 0, readingCount: 0, writingCount: 0, speakingCount: 0 },
      isPremium,
      dailyLimit: isPremium ? null : FREE_DAILY_LIMIT,
    });
  });

  app.get("/api/reading/passages", async (_req, res) => {
    const passages = await storage.getReadingPassages();
    res.json(passages);
  });

  app.get("/api/reading/passages/:id/questions", async (req, res) => {
    const questions = await storage.getReadingQuestions(req.params.id);
    res.json(questions);
  });

  app.post("/api/reading/submit", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { passageId, answers } = req.body;
    const questions = await storage.getReadingQuestions(passageId);

    let correct = 0;
    for (const q of questions) {
      const isCorrect = answers[q.id] === q.correctAnswer;
      if (isCorrect) correct++;
      await storage.createPracticeAttempt({
        userId: user.id,
        questionId: q.id,
        moduleType: "reading",
        correct: isCorrect,
        userAnswer: answers[q.id] || "",
        correctAnswer: q.correctAnswer,
        questionText: q.questionText,
        explanation: q.explanation,
        difficulty: "medium",
      });
    }

    await storage.createOrUpdateDailyUsage(user.id, getToday(), "reading");

    const score = Math.round((correct / questions.length) * 100);
    await storage.createUserProgress({
      userId: user.id,
      skill: "reading",
      score,
      date: getToday(),
    });

    const profile = await storage.getUserProfile(user.id);
    if (profile) {
      const skills = await storage.getSkillScores(user.id);
      const avgScore = (skills.listening + skills.reading + skills.writing + skills.speaking) / 4;
      const predicted = Math.round((avgScore / 100 * 4 + 3.5) * 10) / 10;
      await storage.updateUserProfile(user.id, {
        predictedScore: Math.min(9, predicted),
        confidence: avgScore > 60 ? "High" : avgScore > 30 ? "Medium" : "Building data...",
        totalStudyMinutes: (profile.totalStudyMinutes || 0) + 10,
      });
    }

    res.json({ correct, total: questions.length });
  });

  app.get("/api/listening/passages", async (_req, res) => {
    const passages = await storage.getListeningPassages();
    res.json(passages);
  });

  app.get("/api/listening/passages/:id/questions", async (req, res) => {
    const questions = await storage.getListeningQuestions(req.params.id);
    res.json(questions);
  });

  app.post("/api/listening/submit", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { passageId, answers } = req.body;
    const questions = await storage.getListeningQuestions(passageId);

    let correct = 0;
    for (const q of questions) {
      const isCorrect = answers[q.id] === q.correctAnswer;
      if (isCorrect) correct++;
      await storage.createPracticeAttempt({
        userId: user.id,
        questionId: q.id,
        moduleType: "listening",
        correct: isCorrect,
        userAnswer: answers[q.id] || "",
        correctAnswer: q.correctAnswer,
        questionText: q.questionText,
        explanation: q.explanation,
        difficulty: "medium",
      });
    }

    await storage.createOrUpdateDailyUsage(user.id, getToday(), "listening");

    const score = Math.round((correct / questions.length) * 100);
    await storage.createUserProgress({
      userId: user.id,
      skill: "listening",
      score,
      date: getToday(),
    });

    const profile = await storage.getUserProfile(user.id);
    if (profile) {
      const skills = await storage.getSkillScores(user.id);
      const avgScore = (skills.listening + skills.reading + skills.writing + skills.speaking) / 4;
      const predicted = Math.round((avgScore / 100 * 4 + 3.5) * 10) / 10;
      await storage.updateUserProfile(user.id, {
        predictedScore: Math.min(9, predicted),
        confidence: avgScore > 60 ? "High" : avgScore > 30 ? "Medium" : "Building data...",
        totalStudyMinutes: (profile.totalStudyMinutes || 0) + 10,
      });
    }

    res.json({ correct, total: questions.length });
  });

  app.get("/api/writing/prompts", async (_req, res) => {
    const prompts = await storage.getWritingPrompts();
    res.json(prompts);
  });

  app.post("/api/writing/submit", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { promptId, content, wordCount } = req.body;

    const feedback = analyzeWriting(content);

    await storage.createWritingSubmission({
      userId: user.id,
      promptId,
      content,
      wordCount,
      score: feedback.score,
      feedback,
    });

    await storage.createPracticeAttempt({
      userId: user.id,
      questionId: promptId,
      moduleType: "writing",
      correct: feedback.score >= 6,
      userAnswer: content.substring(0, 200),
      correctAnswer: "N/A",
      questionText: "Writing Task",
      score: feedback.score,
      difficulty: "medium",
      aiFeedback: feedback,
    });

    await storage.createOrUpdateDailyUsage(user.id, getToday(), "writing");

    const scorePercent = Math.round((feedback.score / 9) * 100);
    await storage.createUserProgress({
      userId: user.id,
      skill: "writing",
      score: scorePercent,
      date: getToday(),
    });

    const profile = await storage.getUserProfile(user.id);
    if (profile) {
      const skills = await storage.getSkillScores(user.id);
      const avgScore = (skills.listening + skills.reading + skills.writing + skills.speaking) / 4;
      const predicted = Math.round((avgScore / 100 * 4 + 3.5) * 10) / 10;
      await storage.updateUserProfile(user.id, {
        predictedScore: Math.min(9, predicted),
        confidence: avgScore > 60 ? "High" : avgScore > 30 ? "Medium" : "Building data...",
        totalStudyMinutes: (profile.totalStudyMinutes || 0) + 20,
      });
    }

    res.json(feedback);
  });

  app.get("/api/speaking/prompts", async (_req, res) => {
    const prompts = await storage.getSpeakingPrompts();
    res.json(prompts);
  });

  app.post("/api/speaking/submit", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { promptId, transcript } = req.body;

    const feedback = analyzeSpeaking(transcript);

    await storage.createSpeakingSubmission({
      userId: user.id,
      promptId,
      transcript,
      score: feedback.score,
      feedback,
    });

    await storage.createPracticeAttempt({
      userId: user.id,
      questionId: promptId,
      moduleType: "speaking",
      correct: feedback.score >= 6,
      userAnswer: transcript.substring(0, 200),
      correctAnswer: "N/A",
      questionText: "Speaking Task",
      score: feedback.score,
      difficulty: "medium",
      aiFeedback: feedback,
    });

    await storage.createOrUpdateDailyUsage(user.id, getToday(), "speaking");

    const scorePercent = Math.round((feedback.score / 9) * 100);
    await storage.createUserProgress({
      userId: user.id,
      skill: "speaking",
      score: scorePercent,
      date: getToday(),
    });

    const profile = await storage.getUserProfile(user.id);
    if (profile) {
      const skills = await storage.getSkillScores(user.id);
      const avgScore = (skills.listening + skills.reading + skills.writing + skills.speaking) / 4;
      const predicted = Math.round((avgScore / 100 * 4 + 3.5) * 10) / 10;
      await storage.updateUserProfile(user.id, {
        predictedScore: Math.min(9, predicted),
        confidence: avgScore > 60 ? "High" : avgScore > 30 ? "Medium" : "Building data...",
        totalStudyMinutes: (profile.totalStudyMinutes || 0) + 15,
      });
    }

    res.json(feedback);
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    const sanitized = allUsers.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      subscriptionStatus: u.subscriptionStatus,
      premiumOverride: u.premiumOverride,
      createdAt: u.createdAt,
    }));
    res.json(sanitized);
  });

  app.patch("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    const adminUser = req.user as any;
    const targetUser = await storage.getUser(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.role === "owner") {
      return res.status(403).json({ message: "Cannot modify owner account" });
    }

    const { role, subscriptionStatus, premiumOverride } = req.body;
    const update: any = {};

    const validRoles = ["user", "admin"];
    const validSubStatuses = ["free", "active", "expired"];

    if (role !== undefined) {
      if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
      if (role === "admin" && adminUser.role !== "owner") {
        return res.status(403).json({ message: "Only owner can promote to admin" });
      }
      update.role = role;
    }
    if (subscriptionStatus !== undefined) {
      if (!validSubStatuses.includes(subscriptionStatus)) {
        return res.status(400).json({ message: "Invalid subscription status. Must be 'free', 'active', or 'expired'" });
      }
      update.subscriptionStatus = subscriptionStatus;
    }
    if (premiumOverride !== undefined) {
      if (typeof premiumOverride !== "boolean") {
        return res.status(400).json({ message: "premiumOverride must be a boolean" });
      }
      update.premiumOverride = premiumOverride;
    }

    const updated = await storage.updateUser(req.params.userId, update);
    res.json({
      id: updated!.id,
      username: updated!.username,
      displayName: updated!.displayName,
      email: updated!.email,
      role: updated!.role,
      subscriptionStatus: updated!.subscriptionStatus,
      premiumOverride: updated!.premiumOverride,
    });
  });

  app.post("/api/admin/reading/passages", requireAdmin, async (req, res) => {
    const passage = await storage.createReadingPassage(req.body);
    res.json(passage);
  });

  app.patch("/api/admin/reading/passages/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateReadingPassage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Passage not found" });
    res.json(updated);
  });

  app.delete("/api/admin/reading/passages/:id", requireAdmin, async (req, res) => {
    await storage.deleteReadingPassage(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/reading/questions", requireAdmin, async (req, res) => {
    const question = await storage.createReadingQuestion(req.body);
    res.json(question);
  });

  app.patch("/api/admin/reading/questions/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateReadingQuestion(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Question not found" });
    res.json(updated);
  });

  app.delete("/api/admin/reading/questions/:id", requireAdmin, async (req, res) => {
    await storage.deleteReadingQuestion(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/listening/passages", requireAdmin, async (req, res) => {
    const passage = await storage.createListeningPassage(req.body);
    res.json(passage);
  });

  app.patch("/api/admin/listening/passages/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateListeningPassage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Passage not found" });
    res.json(updated);
  });

  app.delete("/api/admin/listening/passages/:id", requireAdmin, async (req, res) => {
    await storage.deleteListeningPassage(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/listening/questions", requireAdmin, async (req, res) => {
    const question = await storage.createListeningQuestion(req.body);
    res.json(question);
  });

  app.patch("/api/admin/listening/questions/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateListeningQuestion(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Question not found" });
    res.json(updated);
  });

  app.delete("/api/admin/listening/questions/:id", requireAdmin, async (req, res) => {
    await storage.deleteListeningQuestion(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/writing/prompts", requireAdmin, async (req, res) => {
    const prompt = await storage.createWritingPrompt(req.body);
    res.json(prompt);
  });

  app.patch("/api/admin/writing/prompts/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateWritingPrompt(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Prompt not found" });
    res.json(updated);
  });

  app.delete("/api/admin/writing/prompts/:id", requireAdmin, async (req, res) => {
    await storage.deleteWritingPrompt(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/speaking/prompts", requireAdmin, async (req, res) => {
    const prompt = await storage.createSpeakingPrompt(req.body);
    res.json(prompt);
  });

  app.patch("/api/admin/speaking/prompts/:id", requireAdmin, async (req, res) => {
    const updated = await storage.updateSpeakingPrompt(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Prompt not found" });
    res.json(updated);
  });

  app.delete("/api/admin/speaking/prompts/:id", requireAdmin, async (req, res) => {
    await storage.deleteSpeakingPrompt(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}

async function getAdaptiveDifficulty(userId: string, moduleType: string): Promise<string> {
  const attempts = await storage.getPracticeAttemptsByModule(userId, moduleType);
  if (attempts.length < 5) return "medium";

  const recent = attempts.slice(0, 10);
  const correctCount = recent.filter(a => a.correct).length;
  const accuracy = correctCount / recent.length;

  if (accuracy >= 0.8) return "hard";
  if (accuracy <= 0.5) return "easy";
  return "medium";
}
