import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  integer,
  primaryKey,
  sqliteTable,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";


 
export const roles =  sqliteTable('roles', {

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

// roleId: integer("role_id").references(() => roles.id), // REMOVED: User's global/default role

});



// --- NEW JUNCTION TABLE FOR USER ROLES (MANY-TO-MANY) ---

export const userRoles = sqliteTable('user_roles', {

userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),

// You can add other fields here if needed, e.g., assignedBy, context

assignedAt: integer('assigned_at', { mode: 'timestamp' })

.default(sql`(strftime('%s', 'now'))`)

.notNull(),

}, (ur) => ({

compoundKey: primaryKey({ columns: [ur.userId, ur.roleId] }),

}));
 
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
)
 
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})
 
export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)
 
export const authenticators = sqliteTable(
  "authenticator",
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
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)
