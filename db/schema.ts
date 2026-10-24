import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const votes = sqliteTable("reveal_votes", {
  visitorId: text("visitor_id").primaryKey(),
  choice: text("choice").$type<"boy" | "girl">().notNull(),
});
