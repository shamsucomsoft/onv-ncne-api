import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  pgEnum,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';

export const RoleType = pgEnum('role_type', ['collector', 'admin']);
export enum RoleTypeEnum {
  COLLECTOR = 'collector',
  ADMIN = 'admin',
}

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  permissions: text('permissions').array().notNull(),
  type: RoleType('role_type').notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name'),
  email: varchar('email', { length: 256 }).notNull(),
  roleId: integer('role_id').references(() => roles.id),
  password: varchar('password', { length: 256 }).notNull(),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 6 }).notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  used: boolean('used').notNull().default(false),
  type: varchar('type', {
    length: 256,
    enum: ['forgot_password', 'verify_email'],
  }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));
