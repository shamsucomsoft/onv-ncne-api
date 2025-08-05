import { relations } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const RoleType = pgEnum('role_type', ['collector', 'admin']);
export enum RoleTypeEnum {
  COLLECTOR = 'collector',
  ADMIN = 'admin',
}

export const UserStatus = pgEnum('user_status', [
  'active',
  'invited',
  'suspended',
]);
export enum UserStatusEnum {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
}

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    permissions: text('permissions').array().notNull(),
    type: RoleType('role_type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').references(() => users.id),
  },
  (table) => ({
    uniqueName: uniqueIndex('unique_name').on(table.name),
  }),
);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name'),
  email: varchar('email', { length: 256 }).notNull(),
  roleId: uuid('role_id').references(() => roles.id),
  password: varchar('password', { length: 256 }),
  status: UserStatus('status').notNull().default('invited'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  invitationToken: uuid('invitation_token'),
  invitationExpiresAt: timestamp('invitation_expires_at'),
  invitedBy: uuid('invited_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tokens = pgTable('tokens', {
  id: uuid('id').primaryKey(),
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
  invitedByUser: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));
