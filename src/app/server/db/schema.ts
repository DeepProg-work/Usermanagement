import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  integer,
  primaryKey,
  sqliteTable,
  // sqliteTableCreator, // Assuming you might use this for multi-project schemas, keeping it.
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// --- ROLES TABLE ---
export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

// --- USER AUTHENTICATION TABLES ---
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  roleId: integer("role_id").references(() => roles.id), // User's global/default role
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const authenticators = sqliteTable(
  'authenticator',
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: integer("credentialBackedUp", {
      mode: "boolean",
    }).notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compoundKey: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);

// --- COURSES, QUIZZES, QUESTIONS, ETC. ---
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export const quizzes = sqliteTable('quizzes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  text: text('question_text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export const questionOptions = sqliteTable('question_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  text: text('option_text').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export const explanations = sqliteTable('explanations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' })
    .unique(),
  text: text('explanation_text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

// --- JUNCTION TABLES WITH ROLEID ---
export const userCourses = sqliteTable('user_courses', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id), // FK to roles table
  assignedAt: integer('assigned_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
}, (uc) => ({
  compoundKey: primaryKey({ columns: [uc.userId, uc.courseId, uc.roleId] }),
}));

export const userQuizzes = sqliteTable('user_quizzes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: integer('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id), // FK to roles table
  assignedAt: integer('assigned_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
}, (uq) => ({
  compoundKey: primaryKey({ columns: [uq.userId, uq.quizId, uq.roleId] }),
}));


// --- RELATIONS ---

// Role Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users), // Users having this role globally
  userCourses: many(userCourses), // User-course associations having this role
  userQuizzes: many(userQuizzes), // User-quiz associations having this role
}));

// User Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  userCourses: many(userCourses),
  userQuizzes: many(userQuizzes),
  role: one(roles, { // User's global role
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

// Account Relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Session Relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Authenticator Relations
export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

// Course Relations
export const coursesRelations = relations(courses, ({ many }) => ({
  quizzes: many(quizzes),
  userCourses: many(userCourses),
}));

// Quiz Relations
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  questions: many(questions),
  userQuizzes: many(userQuizzes),
}));

// Question Relations (and options, explanations) remain the same internally
// ... (questionsRelations, questionOptionsRelations, explanationsRelations as before)
export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  options: many(questionOptions),
  explanation: one(explanations, {
    fields: [questions.id],
    references: [explanations.questionId],
  }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const explanationsRelations = relations(explanations, ({ one }) => ({
  question: one(questions, {
    fields: [explanations.questionId],
    references: [questions.id],
  }),
}));


// UserCourses Junction Table Relations
export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, {
    fields: [userCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
  role: one(roles, { // The specific role in this user-course association
    fields: [userCourses.roleId],
    references: [roles.id],
  }),
}));

// UserQuizzes Junction Table Relations
export const userQuizzesRelations = relations(userQuizzes, ({ one }) => ({
  user: one(users, {
    fields: [userQuizzes.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [userQuizzes.quizId],
    references: [quizzes.id],
  }),
  role: one(roles, { // The specific role in this user-quiz association
    fields: [userQuizzes.roleId],
    references: [roles.id],
  }),
}));