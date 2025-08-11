CREATE TYPE "public"."role_type" AS ENUM('collector', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TABLE "basic_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text,
	"nin" varchar(32),
	"submission_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"entered_by" uuid,
	"date_of_survey" timestamp,
	"state" text,
	"local_government_area" text,
	"name_of_community" text,
	"zone" varchar,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_of_community" text NOT NULL,
	"state" text NOT NULL,
	"local_government_area" text NOT NULL,
	"zone" varchar,
	"latitude" double precision,
	"longitude" double precision,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"entered_by" uuid,
	"has_skills" varchar,
	"skills_description" text,
	"confidence_level" varchar,
	"reason_for_no_skills" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demographic_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"entered_by" uuid,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"sex" varchar,
	"age_range" varchar,
	"phone_number" varchar(20),
	"email" varchar(256),
	"level_of_education" varchar,
	"type_of_nomadism" varchar,
	"occupation_herding" boolean DEFAULT false,
	"occupation_farming" boolean DEFAULT false,
	"occupation_fishing" boolean DEFAULT false,
	"occupation_trading" boolean DEFAULT false,
	"occupation_artisan" boolean DEFAULT false,
	"occupation_others" boolean DEFAULT false,
	"facial_capture_file_path" text,
	"thumb_print_file_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desired_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"entered_by" uuid,
	"community_skills_needed" text,
	"interested_livestock_dairy_beef" boolean DEFAULT false,
	"interested_livestock_small_ruminants" boolean DEFAULT false,
	"interested_livestock_feeds" boolean DEFAULT false,
	"interested_poultry" boolean DEFAULT false,
	"interested_rabbitary" boolean DEFAULT false,
	"interested_fish_production" boolean DEFAULT false,
	"interested_snailery" boolean DEFAULT false,
	"interested_bee_keeping" boolean DEFAULT false,
	"interested_crop_production" boolean DEFAULT false,
	"interested_irrigation" boolean DEFAULT false,
	"interested_gardening" boolean DEFAULT false,
	"interested_ict" boolean DEFAULT false,
	"interested_phone_repairs" boolean DEFAULT false,
	"interested_fashion_design" boolean DEFAULT false,
	"interested_knitting" boolean DEFAULT false,
	"interested_hair_dressing" boolean DEFAULT false,
	"interested_beads_raffia" boolean DEFAULT false,
	"interested_shoe_bag_making" boolean DEFAULT false,
	"interested_auto_mechanic" boolean DEFAULT false,
	"interested_carpentry" boolean DEFAULT false,
	"interested_masonry" boolean DEFAULT false,
	"interested_pomade_soap_making" boolean DEFAULT false,
	"interested_pottery_ceramics" boolean DEFAULT false,
	"interested_solar_power" boolean DEFAULT false,
	"interested_welding" boolean DEFAULT false,
	"interested_catering" boolean DEFAULT false,
	"interested_others" boolean DEFAULT false,
	"most_preferred_skill" varchar,
	"learning_method" varchar,
	"available_resources" varchar,
	"preferred_learning_time" varchar,
	"barrier_financial_cost" boolean DEFAULT false,
	"barrier_time_constraint" boolean DEFAULT false,
	"barrier_lack_of_information" boolean DEFAULT false,
	"barrier_inaccessibility" boolean DEFAULT false,
	"barrier_insecurity" boolean DEFAULT false,
	"barrier_health_challenges" boolean DEFAULT false,
	"barrier_others" boolean DEFAULT false,
	"available_for_external_training" varchar,
	"external_training_timeline" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perception_of_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"entered_by" uuid,
	"skills_importance_for_development" varchar,
	"community_skills_support_level" varchar,
	"skills_effective_for_financial_security" varchar,
	"experiences_with_skills_acquisition" text,
	"suggestions_for_improvement" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"permissions" text[] NOT NULL,
	"role_type" "role_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "skills_need" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"entered_by" uuid,
	"want_training" varchar,
	"skills_to_learn" text,
	"skills_relevance" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills_survey_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitted_by" uuid,
	"is_complete" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" varchar(6) NOT NULL,
	"email" varchar(256) NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"type" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text,
	"email" varchar(256) NOT NULL,
	"role_id" uuid,
	"password" varchar(256),
	"status" "user_status" DEFAULT 'invited' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"invitation_token" uuid,
	"invitation_expires_at" timestamp,
	"invited_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "basic_information" ADD CONSTRAINT "basic_information_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basic_information" ADD CONSTRAINT "basic_information_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "current_skills" ADD CONSTRAINT "current_skills_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demographic_information" ADD CONSTRAINT "demographic_information_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desired_skills" ADD CONSTRAINT "desired_skills_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perception_of_skills" ADD CONSTRAINT "perception_of_skills_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills_need" ADD CONSTRAINT "skills_need_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills_survey_submissions" ADD CONSTRAINT "skills_survey_submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "basic_state_idx" ON "basic_information" USING btree ("state");--> statement-breakpoint
CREATE INDEX "basic_lga_idx" ON "basic_information" USING btree ("local_government_area");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_community" ON "communities" USING btree ("state","local_government_area","name_of_community");--> statement-breakpoint
CREATE INDEX "communities_state_idx" ON "communities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "communities_lga_idx" ON "communities" USING btree ("local_government_area");--> statement-breakpoint
CREATE INDEX "demographic_age_range_idx" ON "demographic_information" USING btree ("age_range");--> statement-breakpoint
CREATE INDEX "demographic_sex_idx" ON "demographic_information" USING btree ("sex");--> statement-breakpoint
CREATE INDEX "demographic_nomadism_type_idx" ON "demographic_information" USING btree ("type_of_nomadism");--> statement-breakpoint
CREATE INDEX "desired_preferred_skill_idx" ON "desired_skills" USING btree ("most_preferred_skill");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_name" ON "roles" USING btree ("name");