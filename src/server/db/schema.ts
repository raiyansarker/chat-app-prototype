// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `chat-prototype_${name}`);

export const user = mysqlTable(
  "user",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    username: varchar("slug", { length: 256 }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    usernameIndex: index("username_idx").on(table.username),
  }),
);

export const userRelations = relations(user, ({ many }) => ({
  chats: many(userToChat),
  messages: many(message),
}));

/**
 * unique for each chat room
 */
export const chat = mysqlTable(
  "chat",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    slug: varchar("slug", { length: 256 })
      .notNull()
      .$defaultFn(() => createId()),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIndex: index("slug_idx").on(table.slug),
  }),
);

export const chatRelations = relations(chat, ({ many }) => ({
  users: many(userToChat),
  message: many(message),
}));

export const userToChat = mysqlTable(
  "users_to_chat",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.chatId),
  }),
);

export const userToChatRelations = relations(userToChat, ({ one }) => ({
  chat: one(chat, {
    fields: [userToChat.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [userToChat.userId],
    references: [user.id],
  }),
}));

export const message = mysqlTable(
  "message",
  {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    data: text("data").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    chatIdIndex: index("chat_id_idx").on(table.chatId),
    userIdIndex: index("sender_idx").on(table.userId),
    createdAtIndex: index("created_at_idx").on(table.createdAt),
  }),
);

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [message.userId],
    references: [user.id],
  }),
}));
