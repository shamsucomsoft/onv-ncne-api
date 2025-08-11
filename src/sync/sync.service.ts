import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';
import * as schema from 'src/drizzle/schema';
import { StorageService } from 'src/storage/storage.service';

export enum UpdateType {
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface SyncError {
  type: 'UNIQUE_VIOLATION' | 'FOREIGN_KEY_VIOLATION' | 'OTHER';
  field?: string;
  message: string;
  code?: string;
}

export interface SyncResult {
  success: boolean;
  error?: SyncError;
  recordId?: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  rejectedRecords?: Array<{
    table: string;
    recordId: string;
    error: SyncError;
  }>;
  totalProcessed: number;
  successfulRecords: number;
}

@Injectable()
export class SyncService {
  constructor(
    @Inject(DRIZZLE_ORM) private readonly db: DrizzleORM,
    private readonly storage: StorageService,
  ) {}

  async handleSync(data: any, user: any, files: Array<any> = []): Promise<SyncResponse> {
    const transaction = data;

    if (!transaction || !transaction.crud) {
      return {
        success: false,
        message: 'No data to sync',
        totalProcessed: 0,
        successfulRecords: 0,
      };
    }

    const filesMap = new Map(files.map((f) => [f.fieldname, f] as const));

    const rejectedRecords: Array<{ table: string; recordId: string; error: SyncError }> = [];
    let totalProcessed = 0;
    let successfulRecords = 0;

    for (const op of transaction.crud) {
      const table = op.type as string;
      totalProcessed++;

      if (!Object.prototype.hasOwnProperty.call(op, 'data')) {
        rejectedRecords.push({
          table,
          recordId: op.data?.id || 'unknown',
          error: { type: 'OTHER', message: 'No data provided for sync operation' },
        });
        continue;
      }

      // Attach file by key for basic_information if present
      if (table === 'basic_information' && op.data) {
        const fileKey = op.data.image_uri || op.data.imageUrl || op.data.image_url;
        if (fileKey && filesMap.has(fileKey)) {
          op.data.file = filesMap.get(fileKey);
        }
      }

      let result: SyncResult;
      switch (op.op) {
        case UpdateType.PUT:
          result = await this.handlePut(table, { ...op.data }, user);
          break;
        case UpdateType.PATCH:
          result = await this.handlePatch(table, { id: op.id, ...op.data }, user);
          break;
        case UpdateType.DELETE:
          result = { success: false, error: { type: 'OTHER', message: 'DELETE operations not supported' } };
          break;
        default:
          result = { success: false, error: { type: 'OTHER', message: `Unknown operation: ${op.op}` } };
      }

      if (result.success) {
        successfulRecords++;
      } else if (result.error) {
        rejectedRecords.push({ table, recordId: result.recordId || op.data?.id || 'unknown', error: result.error });
      }
    }

    const allSuccessful = rejectedRecords.length === 0;
    const partialSuccess = successfulRecords > 0 && rejectedRecords.length > 0;
    const message = allSuccessful
      ? `All ${successfulRecords} records synced successfully`
      : partialSuccess
      ? `${successfulRecords} of ${totalProcessed} records synced successfully. ${rejectedRecords.length} records rejected.`
      : `Sync failed. All ${totalProcessed} records rejected.`;

    return {
      success: allSuccessful,
      message,
      rejectedRecords: rejectedRecords.length > 0 ? rejectedRecords : undefined,
      totalProcessed,
      successfulRecords,
    };
  }

  private handleDatabaseError(error: any): SyncError {
    if (error?.code === '23505' || /duplicate key value|unique/i.test(error?.message || '')) {
      return { type: 'UNIQUE_VIOLATION', message: 'Unique constraint violation', code: error.code };
    }
    if (error?.code === '23503' || /foreign key/i.test(error?.message || '')) {
      return { type: 'FOREIGN_KEY_VIOLATION', message: 'Referenced data missing or invalid', code: error.code };
    }
    return { type: 'OTHER', message: error?.message || 'Unknown database error', code: error?.code };
  }

  private async handlePut(table: string, record: any, user: { id: string } | undefined): Promise<SyncResult> {
    try {
      switch (table) {
        case 'communities':
          return await this.upsertCommunity(record, user, false);
        case 'skills_survey_submissions':
          return await this.upsertSkillsSurveySubmission(record, user, false);
        case 'basic_information':
          return await this.upsertBasicInformation(record, user, false);
        case 'demographic_information':
          return await this.upsertDemographicInformation(record, user, false);
        case 'current_skills':
          return await this.upsertCurrentSkills(record, user, false);
        case 'skills_need':
          return await this.upsertSkillsNeed(record, user, false);
        case 'desired_skills':
          return await this.upsertDesiredSkills(record, user, false);
        case 'perception_of_skills':
          return await this.upsertPerceptionOfSkills(record, user, false);
        default:
          return { success: false, error: { type: 'OTHER', message: `Unsupported table: ${table}` }, recordId: record.id };
      }
    } catch (error: any) {
      console.log(error);
      return { success: false, error: this.handleDatabaseError(error), recordId: record?.id };
    }
  }

  private async handlePatch(table: string, record: any, user: { id: string } | undefined): Promise<SyncResult> {
    try {
      switch (table) {
        case 'communities':
          return await this.upsertCommunity(record, user, true);
        case 'skills_survey_submissions':
          return await this.upsertSkillsSurveySubmission(record, user, true);
        case 'basic_information':
          return await this.upsertBasicInformation(record, user, true);
        case 'demographic_information':
          return await this.upsertDemographicInformation(record, user, true);
        case 'current_skills':
          return await this.upsertCurrentSkills(record, user, true);
        case 'skills_need':
          return await this.upsertSkillsNeed(record, user, true);
        case 'desired_skills':
          return await this.upsertDesiredSkills(record, user, true);
        case 'perception_of_skills':
          return await this.upsertPerceptionOfSkills(record, user, true);
        default:
          return { success: false, error: { type: 'OTHER', message: `Unsupported table: ${table}` }, recordId: record.id };
      }
    } catch (error: any) {
      console.log(error);
      return { success: false, error: this.handleDatabaseError(error), recordId: record?.id };
    }
  }

  private async upsertCommunity(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.communities.$inferInsert = {
      id: dto.id,
      state: dto.state,
      zone: dto.zone,
      localGovernmentArea: dto.local_government_area,
      nameOfCommunity: dto.name_of_community,
      latitude: dto.latitude != null ? Number(dto.latitude) : undefined,
      longitude: dto.longitude != null ? Number(dto.longitude) : undefined,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
      createdBy: dto.created_by || user?.id,
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.communities.findFirst({ where: eq(schema.communities.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Community not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.communities).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.communities.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.communities).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertSkillsSurveySubmission(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.skillsSurveySubmissions.$inferInsert = {
      id: dto.id,
      submittedBy: dto.submitted_by || user?.id,
      isComplete: typeof dto.is_complete === 'boolean' ? dto.is_complete : dto.is_complete != null ? Boolean(Number(dto.is_complete)) : false,
      submittedAt: dto.submitted_at ? new Date(dto.submitted_at) : undefined,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.skillsSurveySubmissions.findFirst({ where: eq(schema.skillsSurveySubmissions.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Submission not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.skillsSurveySubmissions).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.skillsSurveySubmissions.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.skillsSurveySubmissions).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertBasicInformation(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const maybePersistImage = async (file?: any, recordId?: string): Promise<string | undefined> => {
      if (!file || !recordId) return undefined;
      const ext = (file.mimetype?.split('/')[1] || 'jpg').toLowerCase();
      const filePath = `nomadic/basic-information/${recordId}.${ext}`;
      await this.storage.saveFile(
        filePath,
        file.mimetype || 'image/jpeg',
        file.buffer,
        {
          ownerId: recordId,
          ownerType: 'basic_information',
          syncSource: 'mobile-app-multipart',
          originalSize: String(file.buffer?.length || 0),
        },
        false,
      );
      return filePath;
    };

    const values: typeof schema.basicInformation.$inferInsert = {
      id: dto.id,
      imageUrl: dto.image_url || dto.imageUrl,
      nin: dto.nin,
      submissionId: dto.submission_id,
      communityId: dto.community_id,
      enteredBy: dto.entered_by || user?.id,
      dateOfSurvey: dto.date_of_survey ? new Date(dto.date_of_survey) : undefined,
      state: dto.state,
      localGovernmentArea: dto.local_government_area,
      nameOfCommunity: dto.name_of_community,
      zone: dto.zone,
      latitude: dto.latitude != null ? Number(dto.latitude) : undefined,
      longitude: dto.longitude != null ? Number(dto.longitude) : undefined,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (!values.imageUrl && dto.file && dto.id) {
      try {
        const savedPath = await maybePersistImage(dto.file, dto.id);
        if (savedPath) {
          (values as any).imageUrl = savedPath;
        }
      } catch {}
    }

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.basicInformation.findFirst({ where: eq(schema.basicInformation.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Basic information not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.basicInformation).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.basicInformation.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
        await this.db.insert(schema.basicInformation).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertDemographicInformation(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.demographicInformation.$inferInsert = {
      id: dto.id,
      submissionId: dto.submission_id,
      enteredBy: dto.entered_by || user?.id,
      firstName: dto.first_name,
      middleName: dto.middle_name,
      lastName: dto.last_name,
      sex: dto.sex,
      ageRange: dto.age_range,
      phoneNumber: dto.phone_number,
      email: dto.email,
      levelOfEducation: dto.level_of_education,
      typeOfNomadism: dto.type_of_nomadism,
      occupationHerding: dto.occupation_herding != null ? Boolean(Number(dto.occupation_herding)) : dto.occupation_herding,
      occupationFarming: dto.occupation_farming != null ? Boolean(Number(dto.occupation_farming)) : dto.occupation_farming,
      occupationFishing: dto.occupation_fishing != null ? Boolean(Number(dto.occupation_fishing)) : dto.occupation_fishing,
      occupationTrading: dto.occupation_trading != null ? Boolean(Number(dto.occupation_trading)) : dto.occupation_trading,
      occupationArtisan: dto.occupation_artisan != null ? Boolean(Number(dto.occupation_artisan)) : dto.occupation_artisan,
      occupationOthers: dto.occupation_others != null ? Boolean(Number(dto.occupation_others)) : dto.occupation_others,
      facialCaptureFilePath: dto.facial_capture_file_path,
      thumbPrintFilePath: dto.thumb_print_file_path,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.demographicInformation.findFirst({ where: eq(schema.demographicInformation.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Demographic information not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.demographicInformation).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.demographicInformation.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.demographicInformation).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertCurrentSkills(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.currentSkills.$inferInsert = {
      id: dto.id,
      submissionId: dto.submission_id,
      enteredBy: dto.entered_by || user?.id,
      hasSkills: dto.has_skills,
      skillsDescription: dto.skills_description,
      confidenceLevel: dto.confidence_level,
      reasonForNoSkills: dto.reason_for_no_skills,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.currentSkills.findFirst({ where: eq(schema.currentSkills.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Current skills not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.currentSkills).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.currentSkills.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.currentSkills).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertSkillsNeed(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.skillsNeed.$inferInsert = {
      id: dto.id,
      submissionId: dto.submission_id,
      enteredBy: dto.entered_by || user?.id,
      wantTraining: dto.want_training,
      skillsToLearn: dto.skills_to_learn,
      skillsRelevance: dto.skills_relevance,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.skillsNeed.findFirst({ where: eq(schema.skillsNeed.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Skills need not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.skillsNeed).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.skillsNeed.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.skillsNeed).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertDesiredSkills(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const booleanFrom = (v: any) => (v != null ? Boolean(Number(v)) : v);

    const values: typeof schema.desiredSkills.$inferInsert = {
      id: dto.id,
      submissionId: dto.submission_id,
      enteredBy: dto.entered_by || user?.id,
      communitySkillsNeeded: dto.community_skills_needed,
      interestedLivestockDairyBeef: booleanFrom(dto.interested_livestock_dairy_beef),
      interestedLivestockSmallRuminants: booleanFrom(dto.interested_livestock_small_ruminants),
      interestedLivestockFeeds: booleanFrom(dto.interested_livestock_feeds),
      interestedPoultry: booleanFrom(dto.interested_poultry),
      interestedRabbitary: booleanFrom(dto.interested_rabbitary),
      interestedFishProduction: booleanFrom(dto.interested_fish_production),
      interestedSnailery: booleanFrom(dto.interested_snailery),
      interestedBeeKeeping: booleanFrom(dto.interested_bee_keeping),
      interestedCropProduction: booleanFrom(dto.interested_crop_production),
      interestedIrrigation: booleanFrom(dto.interested_irrigation),
      interestedGardening: booleanFrom(dto.interested_gardening),
      interestedIct: booleanFrom(dto.interested_ict),
      interestedPhoneRepairs: booleanFrom(dto.interested_phone_repairs),
      interestedFashionDesign: booleanFrom(dto.interested_fashion_design),
      interestedKnitting: booleanFrom(dto.interested_knitting),
      interestedHairDressing: booleanFrom(dto.interested_hair_dressing),
      interestedBeadsRaffia: booleanFrom(dto.interested_beads_raffia),
      interestedShoeBagMaking: booleanFrom(dto.interested_shoe_bag_making),
      interestedAutoMechanic: booleanFrom(dto.interested_auto_mechanic),
      interestedCarpentry: booleanFrom(dto.interested_carpentry),
      interestedMasonry: booleanFrom(dto.interested_masonry),
      interestedPomadeSoapMaking: booleanFrom(dto.interested_pomade_soap_making),
      interestedPotteryCeramics: booleanFrom(dto.interested_pottery_ceramics),
      interestedSolarPower: booleanFrom(dto.interested_solar_power),
      interestedWelding: booleanFrom(dto.interested_welding),
      interestedCatering: booleanFrom(dto.interested_catering),
      interestedOthers: booleanFrom(dto.interested_others),
      mostPreferredSkill: dto.most_preferred_skill,
      learningMethod: dto.learning_method,
      availableResources: dto.available_resources,
      preferredLearningTime: dto.preferred_learning_time,
      barrierFinancialCost: booleanFrom(dto.barrier_financial_cost),
      barrierTimeConstraint: booleanFrom(dto.barrier_time_constraint),
      barrierLackOfInformation: booleanFrom(dto.barrier_lack_of_information),
      barrierInaccessibility: booleanFrom(dto.barrier_inaccessibility),
      barrierInsecurity: booleanFrom(dto.barrier_insecurity),
      barrierHealthChallenges: booleanFrom(dto.barrier_health_challenges),
      barrierOthers: booleanFrom(dto.barrier_others),
      availableForExternalTraining: dto.available_for_external_training,
      externalTrainingTimeline: dto.external_training_timeline,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.desiredSkills.findFirst({ where: eq(schema.desiredSkills.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Desired skills not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.desiredSkills).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.desiredSkills.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.desiredSkills).values(values);
      return { success: true, recordId: dto.id };
    }
  }

  private async upsertPerceptionOfSkills(dto: any, user: { id: string } | undefined, isUpdate: boolean): Promise<SyncResult> {
    const values: typeof schema.perceptionOfSkills.$inferInsert = {
      id: dto.id,
      submissionId: dto.submission_id,
      enteredBy: dto.entered_by || user?.id,
      skillsImportanceForDevelopment: dto.skills_importance_for_development,
      communitySkillsSupportLevel: dto.community_skills_support_level,
      skillsEffectiveForFinancialSecurity: dto.skills_effective_for_financial_security,
      experiencesWithSkillsAcquisition: dto.experiences_with_skills_acquisition,
      suggestionsForImprovement: dto.suggestions_for_improvement,
      createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date(),
    } as any;

    if (isUpdate) {
      if (!dto.id) return { success: false, error: { type: 'OTHER', message: 'No ID provided for update' } };
      const existing = await this.db.query.perceptionOfSkills.findFirst({ where: eq(schema.perceptionOfSkills.id, dto.id) });
      if (!existing) return { success: false, error: { type: 'OTHER', message: 'Perception of skills not found' }, recordId: dto.id };
      const { id, createdAt, ...toUpdate } = values as any;
      await this.db.update(schema.perceptionOfSkills).set({ ...toUpdate, updatedAt: new Date() }).where(eq(schema.perceptionOfSkills.id, dto.id));
      return { success: true, recordId: dto.id };
    } else {
      await this.db.insert(schema.perceptionOfSkills).values(values);
      return { success: true, recordId: dto.id };
    }
  }
}


