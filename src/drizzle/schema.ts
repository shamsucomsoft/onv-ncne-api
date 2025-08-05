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
  index,
  doublePrecision,
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

// Questionnaire survey tables with specific columns for each question
export const skillsSurveySubmissions = pgTable('skills_survey_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  submittedBy: uuid('submitted_by').references(() => users.id),
  isComplete: boolean('is_complete').notNull().default(false),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Basic Information
export const basicInformation = pgTable(
  'basic_information',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .references(() => skillsSurveySubmissions.id)
      .notNull(),
    dateOfSurvey: timestamp('date_of_survey'),
    state: text('state'),
    localGovernmentArea: text('local_government_area'),
    nameOfCommunity: text('name_of_community'),
    zone: varchar('zone', {
      enum: [
        'north-west',
        'north-east',
        'north-central',
        'south-east',
        'south-west',
        'south-south',
      ],
    }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    stateIdx: index('basic_state_idx').on(table.state),
    lgaIdx: index('basic_lga_idx').on(table.localGovernmentArea),
  }),
);

// Demographic Information
export const demographicInformation = pgTable(
  'demographic_information',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .references(() => skillsSurveySubmissions.id)
      .notNull(),
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    lastName: text('last_name').notNull(),
    sex: varchar('sex', { enum: ['male', 'female'] }),
    ageRange: varchar('age_range', {
      enum: ['16-20', '21-25', '26-30', '31-35', '36_and_above'],
    }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    email: varchar('email', { length: 256 }),
    levelOfEducation: varchar('level_of_education', {
      enum: [
        'quranic',
        'adult_literacy',
        'fslc',
        'jssce',
        'ssce',
        'aissce',
        'tertiary',
        'non_literate',
      ],
    }),
    typeOfNomadism: varchar('type_of_nomadism', {
      enum: ['settled', 'semi_settled', 'mobile'],
    }),
    occupationHerding: boolean('occupation_herding').default(false),
    occupationFarming: boolean('occupation_farming').default(false),
    occupationFishing: boolean('occupation_fishing').default(false),
    occupationTrading: boolean('occupation_trading').default(false),
    occupationArtisan: boolean('occupation_artisan').default(false),
    occupationOthers: boolean('occupation_others').default(false),
    facialCaptureFilePath: text('facial_capture_file_path'),
    thumbPrintFilePath: text('thumb_print_file_path'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ageRangeIdx: index('demographic_age_range_idx').on(table.ageRange),
    sexIdx: index('demographic_sex_idx').on(table.sex),
    nomadismTypeIdx: index('demographic_nomadism_type_idx').on(
      table.typeOfNomadism,
    ),
  }),
);

// Current Skills
export const currentSkills = pgTable('current_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .references(() => skillsSurveySubmissions.id)
    .notNull(),
  hasSkills: varchar('has_skills', { enum: ['yes', 'no'] }),
  skillsDescription: text('skills_description'),
  confidenceLevel: varchar('confidence_level', {
    enum: ['1', '2', '3', '4', '5'],
  }),
  reasonForNoSkills: text('reason_for_no_skills'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Skills Need
export const skillsNeed = pgTable('skills_need', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .references(() => skillsSurveySubmissions.id)
    .notNull(),
  wantTraining: varchar('want_training', { enum: ['yes', 'no'] }),
  skillsToLearn: text('skills_to_learn'),
  skillsRelevance: varchar('skills_relevance', {
    enum: ['1', '2', '3', '4', '5'],
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Desired Skills
export const desiredSkills = pgTable(
  'desired_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .references(() => skillsSurveySubmissions.id)
      .notNull(),
    communitySkillsNeeded: text('community_skills_needed'),
    // Interest checkboxes
    interestedLivestockDairyBeef: boolean(
      'interested_livestock_dairy_beef',
    ).default(false),
    interestedLivestockSmallRuminants: boolean(
      'interested_livestock_small_ruminants',
    ).default(false),
    interestedLivestockFeeds: boolean('interested_livestock_feeds').default(
      false,
    ),
    interestedPoultry: boolean('interested_poultry').default(false),
    interestedRabbitary: boolean('interested_rabbitary').default(false),
    interestedFishProduction: boolean('interested_fish_production').default(
      false,
    ),
    interestedSnailery: boolean('interested_snailery').default(false),
    interestedBeeKeeping: boolean('interested_bee_keeping').default(false),
    interestedCropProduction: boolean('interested_crop_production').default(
      false,
    ),
    interestedIrrigation: boolean('interested_irrigation').default(false),
    interestedGardening: boolean('interested_gardening').default(false),
    interestedIct: boolean('interested_ict').default(false),
    interestedPhoneRepairs: boolean('interested_phone_repairs').default(false),
    interestedFashionDesign: boolean('interested_fashion_design').default(
      false,
    ),
    interestedKnitting: boolean('interested_knitting').default(false),
    interestedHairDressing: boolean('interested_hair_dressing').default(false),
    interestedBeadsRaffia: boolean('interested_beads_raffia').default(false),
    interestedShoeBagMaking: boolean('interested_shoe_bag_making').default(
      false,
    ),
    interestedAutoMechanic: boolean('interested_auto_mechanic').default(false),
    interestedCarpentry: boolean('interested_carpentry').default(false),
    interestedMasonry: boolean('interested_masonry').default(false),
    interestedPomadeSoapMaking: boolean(
      'interested_pomade_soap_making',
    ).default(false),
    interestedPotteryCeramics: boolean('interested_pottery_ceramics').default(
      false,
    ),
    interestedSolarPower: boolean('interested_solar_power').default(false),
    interestedWelding: boolean('interested_welding').default(false),
    interestedCatering: boolean('interested_catering').default(false),
    interestedOthers: boolean('interested_others').default(false),
    // Most preferred skill (radio)
    mostPreferredSkill: varchar('most_preferred_skill', {
      enum: [
        'livestock_dairy_beef',
        'livestock_small_ruminants',
        'livestock_feeds',
        'poultry',
        'rabbitary',
        'fish_production',
        'snailery',
        'bee_keeping',
        'crop_production',
        'irrigation',
        'gardening',
        'ict',
        'phone_repairs',
        'fashion_design',
        'knitting',
        'hair_dressing',
        'beads_raffia',
        'shoe_bag_making',
        'auto_mechanic',
        'carpentry',
        'masonry',
        'pomade_soap_making',
        'pottery_ceramics',
        'solar_power',
        'welding',
        'catering',
        'others',
      ],
    }),
    learningMethod: varchar('learning_method', {
      enum: [
        'formal_training',
        'informal_training',
        'apprenticeship',
        'others',
      ],
    }),
    availableResources: varchar('available_resources', {
      enum: [
        'vocational_centres',
        'local_centres',
        'community_programmes',
        'apprenticeship_workshops',
        'none',
      ],
    }),
    preferredLearningTime: varchar('preferred_learning_time', {
      enum: ['morning', 'afternoon', 'evening'],
    }),
    // Barriers checkboxes
    barrierFinancialCost: boolean('barrier_financial_cost').default(false),
    barrierTimeConstraint: boolean('barrier_time_constraint').default(false),
    barrierLackOfInformation: boolean('barrier_lack_of_information').default(
      false,
    ),
    barrierInaccessibility: boolean('barrier_inaccessibility').default(false),
    barrierInsecurity: boolean('barrier_insecurity').default(false),
    barrierHealthChallenges: boolean('barrier_health_challenges').default(
      false,
    ),
    barrierOthers: boolean('barrier_others').default(false),
    availableForExternalTraining: varchar('available_for_external_training', {
      enum: ['yes', 'no'],
    }),
    externalTrainingTimeline: text('external_training_timeline'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    preferredSkillIdx: index('desired_preferred_skill_idx').on(
      table.mostPreferredSkill,
    ),
  }),
);

// Perception of Skills
export const perceptionOfSkills = pgTable('perception_of_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .references(() => skillsSurveySubmissions.id)
    .notNull(),
  skillsImportanceForDevelopment: varchar('skills_importance_for_development', {
    enum: ['1', '2', '3', '4', '5'],
  }),
  communitySkillsSupportLevel: varchar('community_skills_support_level', {
    enum: ['1', '2', '3', '4', '5'],
  }),
  skillsEffectiveForFinancialSecurity: varchar(
    'skills_effective_for_financial_security',
    {
      enum: ['1', '2', '3', '4', '5'],
    },
  ),
  experiencesWithSkillsAcquisition: text('experiences_with_skills_acquisition'),
  suggestionsForImprovement: text('suggestions_for_improvement'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const skillsSurveySubmissionsRelations = relations(
  skillsSurveySubmissions,
  ({ one }) => ({
    submittedByUser: one(users, {
      fields: [skillsSurveySubmissions.submittedBy],
      references: [users.id],
    }),
    basicInformation: one(basicInformation),
    demographicInformation: one(demographicInformation),
    currentSkills: one(currentSkills),
    skillsNeed: one(skillsNeed),
    desiredSkills: one(desiredSkills),
    perceptionOfSkills: one(perceptionOfSkills),
  }),
);

export const basicInformationRelations = relations(
  basicInformation,
  ({ one }) => ({
    submission: one(skillsSurveySubmissions, {
      fields: [basicInformation.submissionId],
      references: [skillsSurveySubmissions.id],
    }),
  }),
);

export const demographicInformationRelations = relations(
  demographicInformation,
  ({ one }) => ({
    submission: one(skillsSurveySubmissions, {
      fields: [demographicInformation.submissionId],
      references: [skillsSurveySubmissions.id],
    }),
  }),
);

export const currentSkillsRelations = relations(currentSkills, ({ one }) => ({
  submission: one(skillsSurveySubmissions, {
    fields: [currentSkills.submissionId],
    references: [skillsSurveySubmissions.id],
  }),
}));

export const skillsNeedRelations = relations(skillsNeed, ({ one }) => ({
  submission: one(skillsSurveySubmissions, {
    fields: [skillsNeed.submissionId],
    references: [skillsSurveySubmissions.id],
  }),
}));

export const desiredSkillsRelations = relations(desiredSkills, ({ one }) => ({
  submission: one(skillsSurveySubmissions, {
    fields: [desiredSkills.submissionId],
    references: [skillsSurveySubmissions.id],
  }),
}));

export const perceptionOfSkillsRelations = relations(
  perceptionOfSkills,
  ({ one }) => ({
    submission: one(skillsSurveySubmissions, {
      fields: [perceptionOfSkills.submissionId],
      references: [skillsSurveySubmissions.id],
    }),
  }),
);
