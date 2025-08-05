import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schema';
import {
  skillsSurveySubmissions,
  basicInformation,
  demographicInformation,
  currentSkills,
  skillsNeed,
  desiredSkills,
  perceptionOfSkills,
  users,
} from 'src/drizzle/schema';
import { eq, and, count, desc, asc, ilike } from 'drizzle-orm';
import {
  CreateSkillsSurveyDto,
  UpdateSkillsSurveyDto,
  SkillsSurveyQueryDto,
} from './dto/skills-survey.dto';
import { responder } from 'src/utils/response.utils';

@Injectable()
export class SkillsSurveyService {
  constructor(
    @Inject('DRIZZLE_ORM') private db: NodePgDatabase<typeof schema>,
  ) {}

  async createSurvey(createSurveyDto: CreateSkillsSurveyDto, userId?: string) {
    try {
      return await this.db.transaction(async (tx) => {
        // Create main submission
        const submission = await tx
          .insert(skillsSurveySubmissions)
          .values({
            submittedBy: userId,
            isComplete: false,
          })
          .returning();

        const submissionId = submission[0].id;

        // Insert basic information
        if (createSurveyDto.basicInformation) {
          const basicInfo = {
            submissionId,
            dateOfSurvey: createSurveyDto.basicInformation.dateOfSurvey
              ? new Date(createSurveyDto.basicInformation.dateOfSurvey)
              : null,
            state: createSurveyDto.basicInformation.state || null,
            localGovernmentArea:
              createSurveyDto.basicInformation.localGovernmentArea || null,
            nameOfCommunity:
              createSurveyDto.basicInformation.nameOfCommunity || null,
            zone:
              (createSurveyDto.basicInformation.zone as
                | 'north-west'
                | 'north-east'
                | 'north-central'
                | 'south-east'
                | 'south-west'
                | 'south-south') || null,
            latitude: createSurveyDto.basicInformation.latitude || null,
            longitude: createSurveyDto.basicInformation.longitude || null,
          };
          await tx.insert(basicInformation).values(basicInfo);
        }

        // Insert demographic information (required)
        const demographicInfo = {
          submissionId,
          firstName: createSurveyDto.demographicInformation.firstName,
          middleName: createSurveyDto.demographicInformation.middleName || null,
          lastName: createSurveyDto.demographicInformation.lastName,
          sex:
            (createSurveyDto.demographicInformation.sex as 'male' | 'female') ||
            null,
          ageRange:
            (createSurveyDto.demographicInformation.ageRange as
              | '16-20'
              | '21-25'
              | '26-30'
              | '31-35'
              | '36_and_above') || null,
          phoneNumber:
            createSurveyDto.demographicInformation.phoneNumber || null,
          email: createSurveyDto.demographicInformation.email || null,
          levelOfEducation:
            (createSurveyDto.demographicInformation.levelOfEducation as
              | 'quranic'
              | 'adult_literacy'
              | 'fslc'
              | 'jssce'
              | 'ssce'
              | 'aissce'
              | 'tertiary'
              | 'non_literate') || null,
          typeOfNomadism:
            (createSurveyDto.demographicInformation.typeOfNomadism as
              | 'settled'
              | 'semi_settled'
              | 'mobile') || null,
          occupationHerding:
            createSurveyDto.demographicInformation.occupationHerding || false,
          occupationFarming:
            createSurveyDto.demographicInformation.occupationFarming || false,
          occupationFishing:
            createSurveyDto.demographicInformation.occupationFishing || false,
          occupationTrading:
            createSurveyDto.demographicInformation.occupationTrading || false,
          occupationArtisan:
            createSurveyDto.demographicInformation.occupationArtisan || false,
          occupationOthers:
            createSurveyDto.demographicInformation.occupationOthers || false,
          facialCaptureFilePath:
            createSurveyDto.demographicInformation.facialCaptureFilePath ||
            null,
          thumbPrintFilePath:
            createSurveyDto.demographicInformation.thumbPrintFilePath || null,
        };
        await tx.insert(demographicInformation).values(demographicInfo);

        // Insert current skills
        if (createSurveyDto.currentSkills) {
          const currentSkillsData = {
            submissionId,
            hasSkills: createSurveyDto.currentSkills.hasSkills || null,
            skillsDescription:
              createSurveyDto.currentSkills.skillsDescription || null,
            confidenceLevel:
              createSurveyDto.currentSkills.confidenceLevel || null,
            reasonForNoSkills:
              createSurveyDto.currentSkills.reasonForNoSkills || null,
          };
          await tx.insert(currentSkills).values(currentSkillsData);
        }

        // Insert skills need
        if (createSurveyDto.skillsNeed) {
          const skillsNeedData = {
            submissionId,
            wantTraining: createSurveyDto.skillsNeed.wantTraining || null,
            skillsToLearn: createSurveyDto.skillsNeed.skillsToLearn || null,
            skillsRelevance: createSurveyDto.skillsNeed.skillsRelevance || null,
          };
          await tx.insert(skillsNeed).values(skillsNeedData);
        }

        // Insert desired skills
        if (createSurveyDto.desiredSkills) {
          const desiredSkillsData = {
            submissionId,
            communitySkillsNeeded:
              createSurveyDto.desiredSkills.communitySkillsNeeded || null,
            interestedLivestockDairyBeef:
              createSurveyDto.desiredSkills.interestedLivestockDairyBeef ||
              false,
            interestedLivestockSmallRuminants:
              createSurveyDto.desiredSkills.interestedLivestockSmallRuminants ||
              false,
            interestedLivestockFeeds:
              createSurveyDto.desiredSkills.interestedLivestockFeeds || false,
            interestedPoultry:
              createSurveyDto.desiredSkills.interestedPoultry || false,
            interestedRabbitary:
              createSurveyDto.desiredSkills.interestedRabbitary || false,
            interestedFishProduction:
              createSurveyDto.desiredSkills.interestedFishProduction || false,
            interestedSnailery:
              createSurveyDto.desiredSkills.interestedSnailery || false,
            interestedBeeKeeping:
              createSurveyDto.desiredSkills.interestedBeeKeeping || false,
            interestedCropProduction:
              createSurveyDto.desiredSkills.interestedCropProduction || false,
            interestedIrrigation:
              createSurveyDto.desiredSkills.interestedIrrigation || false,
            interestedGardening:
              createSurveyDto.desiredSkills.interestedGardening || false,
            interestedIct: createSurveyDto.desiredSkills.interestedIct || false,
            interestedPhoneRepairs:
              createSurveyDto.desiredSkills.interestedPhoneRepairs || false,
            interestedFashionDesign:
              createSurveyDto.desiredSkills.interestedFashionDesign || false,
            interestedKnitting:
              createSurveyDto.desiredSkills.interestedKnitting || false,
            interestedHairDressing:
              createSurveyDto.desiredSkills.interestedHairDressing || false,
            interestedBeadsRaffia:
              createSurveyDto.desiredSkills.interestedBeadsRaffia || false,
            interestedShoeBagMaking:
              createSurveyDto.desiredSkills.interestedShoeBagMaking || false,
            interestedAutoMechanic:
              createSurveyDto.desiredSkills.interestedAutoMechanic || false,
            interestedCarpentry:
              createSurveyDto.desiredSkills.interestedCarpentry || false,
            interestedMasonry:
              createSurveyDto.desiredSkills.interestedMasonry || false,
            interestedPomadeSoapMaking:
              createSurveyDto.desiredSkills.interestedPomadeSoapMaking || false,
            interestedPotteryCeramics:
              createSurveyDto.desiredSkills.interestedPotteryCeramics || false,
            interestedSolarPower:
              createSurveyDto.desiredSkills.interestedSolarPower || false,
            interestedWelding:
              createSurveyDto.desiredSkills.interestedWelding || false,
            interestedCatering:
              createSurveyDto.desiredSkills.interestedCatering || false,
            interestedOthers:
              createSurveyDto.desiredSkills.interestedOthers || false,
            mostPreferredSkill:
              (createSurveyDto.desiredSkills.mostPreferredSkill as
                | 'livestock_dairy_beef'
                | 'livestock_small_ruminants'
                | 'livestock_feeds'
                | 'poultry'
                | 'rabbitary'
                | 'fish_production'
                | 'snailery'
                | 'bee_keeping'
                | 'crop_production'
                | 'irrigation'
                | 'gardening'
                | 'ict'
                | 'phone_repairs'
                | 'fashion_design'
                | 'knitting'
                | 'hair_dressing'
                | 'beads_raffia'
                | 'shoe_bag_making'
                | 'auto_mechanic'
                | 'carpentry'
                | 'masonry'
                | 'pomade_soap_making'
                | 'pottery_ceramics'
                | 'solar_power'
                | 'welding'
                | 'catering'
                | 'others') || null,
            learningMethod:
              (createSurveyDto.desiredSkills.learningMethod as
                | 'formal_training'
                | 'informal_training'
                | 'apprenticeship'
                | 'others') || null,
            availableResources:
              (createSurveyDto.desiredSkills.availableResources as
                | 'vocational_centres'
                | 'local_centres'
                | 'community_programmes'
                | 'apprenticeship_workshops'
                | 'none') || null,
            preferredLearningTime:
              (createSurveyDto.desiredSkills.preferredLearningTime as
                | 'morning'
                | 'afternoon'
                | 'evening') || null,
            barrierFinancialCost:
              createSurveyDto.desiredSkills.barrierFinancialCost || false,
            barrierTimeConstraint:
              createSurveyDto.desiredSkills.barrierTimeConstraint || false,
            barrierLackOfInformation:
              createSurveyDto.desiredSkills.barrierLackOfInformation || false,
            barrierInaccessibility:
              createSurveyDto.desiredSkills.barrierInaccessibility || false,
            barrierInsecurity:
              createSurveyDto.desiredSkills.barrierInsecurity || false,
            barrierHealthChallenges:
              createSurveyDto.desiredSkills.barrierHealthChallenges || false,
            barrierOthers: createSurveyDto.desiredSkills.barrierOthers || false,
            availableForExternalTraining:
              createSurveyDto.desiredSkills.availableForExternalTraining ||
              null,
            externalTrainingTimeline:
              createSurveyDto.desiredSkills.externalTrainingTimeline || null,
          };
          await tx.insert(desiredSkills).values(desiredSkillsData);
        }

        // Insert perception of skills
        if (createSurveyDto.perceptionOfSkills) {
          const perceptionData = {
            submissionId,
            skillsImportanceForDevelopment:
              createSurveyDto.perceptionOfSkills
                .skillsImportanceForDevelopment || null,
            communitySkillsSupportLevel:
              createSurveyDto.perceptionOfSkills.communitySkillsSupportLevel ||
              null,
            skillsEffectiveForFinancialSecurity:
              createSurveyDto.perceptionOfSkills
                .skillsEffectiveForFinancialSecurity || null,
            experiencesWithSkillsAcquisition:
              createSurveyDto.perceptionOfSkills
                .experiencesWithSkillsAcquisition || null,
            suggestionsForImprovement:
              createSurveyDto.perceptionOfSkills.suggestionsForImprovement ||
              null,
          };
          await tx.insert(perceptionOfSkills).values(perceptionData);
        }

        return submission[0];
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to create survey: ${error.message}`,
      );
    }
  }

  async updateSurvey(
    id: string,
    updateSurveyDto: UpdateSkillsSurveyDto,
    userId?: string,
  ) {
    const survey = await this.db.query.skillsSurveySubmissions.findFirst({
      where: eq(skillsSurveySubmissions.id, id),
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    try {
      return await this.db.transaction(async (tx) => {
        // Update main submission
        const updatedSubmission = await tx
          .update(skillsSurveySubmissions)
          .set({
            isComplete: updateSurveyDto.isComplete ?? survey.isComplete,
            submittedAt: updateSurveyDto.isComplete ? new Date() : null,
          })
          .where(eq(skillsSurveySubmissions.id, id))
          .returning();

        // Update basic information
        if (updateSurveyDto.basicInformation) {
          const existing = await tx.query.basicInformation.findFirst({
            where: eq(basicInformation.submissionId, id),
          });

          const basicInfoUpdate = {
            dateOfSurvey: updateSurveyDto.basicInformation.dateOfSurvey
              ? new Date(updateSurveyDto.basicInformation.dateOfSurvey)
              : null,
            state: updateSurveyDto.basicInformation.state || null,
            localGovernmentArea:
              updateSurveyDto.basicInformation.localGovernmentArea || null,
            nameOfCommunity:
              updateSurveyDto.basicInformation.nameOfCommunity || null,
            zone:
              (updateSurveyDto.basicInformation.zone as
                | 'north-west'
                | 'north-east'
                | 'north-central'
                | 'south-east'
                | 'south-west'
                | 'south-south') || null,
            latitude: updateSurveyDto.basicInformation.latitude || null,
            longitude: updateSurveyDto.basicInformation.longitude || null,
          };

          if (existing) {
            await tx
              .update(basicInformation)
              .set(basicInfoUpdate)
              .where(eq(basicInformation.submissionId, id));
          } else {
            await tx.insert(basicInformation).values({
              submissionId: id,
              ...basicInfoUpdate,
            });
          }
        }

        // Update demographic information
        if (updateSurveyDto.demographicInformation) {
          const existing = await tx.query.demographicInformation.findFirst({
            where: eq(demographicInformation.submissionId, id),
          });

          const demographicInfoUpdate = {
            firstName: updateSurveyDto.demographicInformation.firstName,
            middleName:
              updateSurveyDto.demographicInformation.middleName || null,
            lastName: updateSurveyDto.demographicInformation.lastName,
            sex:
              (updateSurveyDto.demographicInformation.sex as
                | 'male'
                | 'female') || null,
            ageRange:
              (updateSurveyDto.demographicInformation.ageRange as
                | '16-20'
                | '21-25'
                | '26-30'
                | '31-35'
                | '36_and_above') || null,
            phoneNumber:
              updateSurveyDto.demographicInformation.phoneNumber || null,
            email: updateSurveyDto.demographicInformation.email || null,
            levelOfEducation:
              (updateSurveyDto.demographicInformation.levelOfEducation as
                | 'quranic'
                | 'adult_literacy'
                | 'fslc'
                | 'jssce'
                | 'ssce'
                | 'aissce'
                | 'tertiary'
                | 'non_literate') || null,
            typeOfNomadism:
              (updateSurveyDto.demographicInformation.typeOfNomadism as
                | 'settled'
                | 'semi_settled'
                | 'mobile') || null,
            occupationHerding:
              updateSurveyDto.demographicInformation.occupationHerding || false,
            occupationFarming:
              updateSurveyDto.demographicInformation.occupationFarming || false,
            occupationFishing:
              updateSurveyDto.demographicInformation.occupationFishing || false,
            occupationTrading:
              updateSurveyDto.demographicInformation.occupationTrading || false,
            occupationArtisan:
              updateSurveyDto.demographicInformation.occupationArtisan || false,
            occupationOthers:
              updateSurveyDto.demographicInformation.occupationOthers || false,
            facialCaptureFilePath:
              updateSurveyDto.demographicInformation.facialCaptureFilePath ||
              null,
            thumbPrintFilePath:
              updateSurveyDto.demographicInformation.thumbPrintFilePath || null,
          };

          if (existing) {
            await tx
              .update(demographicInformation)
              .set(demographicInfoUpdate)
              .where(eq(demographicInformation.submissionId, id));
          } else {
            await tx.insert(demographicInformation).values({
              submissionId: id,
              ...demographicInfoUpdate,
            });
          }
        }

        // Update current skills
        if (updateSurveyDto.currentSkills) {
          const existing = await tx.query.currentSkills.findFirst({
            where: eq(currentSkills.submissionId, id),
          });

          if (existing) {
            await tx
              .update(currentSkills)
              .set(updateSurveyDto.currentSkills)
              .where(eq(currentSkills.submissionId, id));
          } else {
            await tx.insert(currentSkills).values({
              submissionId: id,
              ...updateSurveyDto.currentSkills,
            });
          }
        }

        // Update skills need
        if (updateSurveyDto.skillsNeed) {
          const existing = await tx.query.skillsNeed.findFirst({
            where: eq(skillsNeed.submissionId, id),
          });

          if (existing) {
            await tx
              .update(skillsNeed)
              .set(updateSurveyDto.skillsNeed)
              .where(eq(skillsNeed.submissionId, id));
          } else {
            await tx.insert(skillsNeed).values({
              submissionId: id,
              ...updateSurveyDto.skillsNeed,
            });
          }
        }

        // Update desired skills
        if (updateSurveyDto.desiredSkills) {
          const existing = await tx.query.desiredSkills.findFirst({
            where: eq(desiredSkills.submissionId, id),
          });

          const desiredSkillsUpdate = {
            communitySkillsNeeded:
              updateSurveyDto.desiredSkills.communitySkillsNeeded || null,
            interestedLivestockDairyBeef:
              updateSurveyDto.desiredSkills.interestedLivestockDairyBeef ||
              false,
            interestedLivestockSmallRuminants:
              updateSurveyDto.desiredSkills.interestedLivestockSmallRuminants ||
              false,
            interestedLivestockFeeds:
              updateSurveyDto.desiredSkills.interestedLivestockFeeds || false,
            interestedPoultry:
              updateSurveyDto.desiredSkills.interestedPoultry || false,
            interestedRabbitary:
              updateSurveyDto.desiredSkills.interestedRabbitary || false,
            interestedFishProduction:
              updateSurveyDto.desiredSkills.interestedFishProduction || false,
            interestedSnailery:
              updateSurveyDto.desiredSkills.interestedSnailery || false,
            interestedBeeKeeping:
              updateSurveyDto.desiredSkills.interestedBeeKeeping || false,
            interestedCropProduction:
              updateSurveyDto.desiredSkills.interestedCropProduction || false,
            interestedIrrigation:
              updateSurveyDto.desiredSkills.interestedIrrigation || false,
            interestedGardening:
              updateSurveyDto.desiredSkills.interestedGardening || false,
            interestedIct: updateSurveyDto.desiredSkills.interestedIct || false,
            interestedPhoneRepairs:
              updateSurveyDto.desiredSkills.interestedPhoneRepairs || false,
            interestedFashionDesign:
              updateSurveyDto.desiredSkills.interestedFashionDesign || false,
            interestedKnitting:
              updateSurveyDto.desiredSkills.interestedKnitting || false,
            interestedHairDressing:
              updateSurveyDto.desiredSkills.interestedHairDressing || false,
            interestedBeadsRaffia:
              updateSurveyDto.desiredSkills.interestedBeadsRaffia || false,
            interestedShoeBagMaking:
              updateSurveyDto.desiredSkills.interestedShoeBagMaking || false,
            interestedAutoMechanic:
              updateSurveyDto.desiredSkills.interestedAutoMechanic || false,
            interestedCarpentry:
              updateSurveyDto.desiredSkills.interestedCarpentry || false,
            interestedMasonry:
              updateSurveyDto.desiredSkills.interestedMasonry || false,
            interestedPomadeSoapMaking:
              updateSurveyDto.desiredSkills.interestedPomadeSoapMaking || false,
            interestedPotteryCeramics:
              updateSurveyDto.desiredSkills.interestedPotteryCeramics || false,
            interestedSolarPower:
              updateSurveyDto.desiredSkills.interestedSolarPower || false,
            interestedWelding:
              updateSurveyDto.desiredSkills.interestedWelding || false,
            interestedCatering:
              updateSurveyDto.desiredSkills.interestedCatering || false,
            interestedOthers:
              updateSurveyDto.desiredSkills.interestedOthers || false,
            mostPreferredSkill:
              (updateSurveyDto.desiredSkills.mostPreferredSkill as
                | 'livestock_dairy_beef'
                | 'livestock_small_ruminants'
                | 'livestock_feeds'
                | 'poultry'
                | 'rabbitary'
                | 'fish_production'
                | 'snailery'
                | 'bee_keeping'
                | 'crop_production'
                | 'irrigation'
                | 'gardening'
                | 'ict'
                | 'phone_repairs'
                | 'fashion_design'
                | 'knitting'
                | 'hair_dressing'
                | 'beads_raffia'
                | 'shoe_bag_making'
                | 'auto_mechanic'
                | 'carpentry'
                | 'masonry'
                | 'pomade_soap_making'
                | 'pottery_ceramics'
                | 'solar_power'
                | 'welding'
                | 'catering'
                | 'others') || null,
            learningMethod:
              (updateSurveyDto.desiredSkills.learningMethod as
                | 'formal_training'
                | 'informal_training'
                | 'apprenticeship'
                | 'others') || null,
            availableResources:
              (updateSurveyDto.desiredSkills.availableResources as
                | 'vocational_centres'
                | 'local_centres'
                | 'community_programmes'
                | 'apprenticeship_workshops'
                | 'none') || null,
            preferredLearningTime:
              (updateSurveyDto.desiredSkills.preferredLearningTime as
                | 'morning'
                | 'afternoon'
                | 'evening') || null,
            barrierFinancialCost:
              updateSurveyDto.desiredSkills.barrierFinancialCost || false,
            barrierTimeConstraint:
              updateSurveyDto.desiredSkills.barrierTimeConstraint || false,
            barrierLackOfInformation:
              updateSurveyDto.desiredSkills.barrierLackOfInformation || false,
            barrierInaccessibility:
              updateSurveyDto.desiredSkills.barrierInaccessibility || false,
            barrierInsecurity:
              updateSurveyDto.desiredSkills.barrierInsecurity || false,
            barrierHealthChallenges:
              updateSurveyDto.desiredSkills.barrierHealthChallenges || false,
            barrierOthers: updateSurveyDto.desiredSkills.barrierOthers || false,
            availableForExternalTraining:
              (updateSurveyDto.desiredSkills.availableForExternalTraining as
                | 'yes'
                | 'no') || null,
            externalTrainingTimeline:
              updateSurveyDto.desiredSkills.externalTrainingTimeline || null,
          };

          if (existing) {
            await tx
              .update(desiredSkills)
              .set(desiredSkillsUpdate)
              .where(eq(desiredSkills.submissionId, id));
          } else {
            await tx.insert(desiredSkills).values({
              submissionId: id,
              ...desiredSkillsUpdate,
            });
          }
        }

        // Update perception of skills
        if (updateSurveyDto.perceptionOfSkills) {
          const existing = await tx.query.perceptionOfSkills.findFirst({
            where: eq(perceptionOfSkills.submissionId, id),
          });

          if (existing) {
            await tx
              .update(perceptionOfSkills)
              .set(updateSurveyDto.perceptionOfSkills)
              .where(eq(perceptionOfSkills.submissionId, id));
          } else {
            await tx.insert(perceptionOfSkills).values({
              submissionId: id,
              ...updateSurveyDto.perceptionOfSkills,
            });
          }
        }

        return updatedSubmission[0];
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to update survey: ${error.message}`,
      );
    }
  }

  async getAllSurveys(query: SkillsSurveyQueryDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Build where conditions for filtering
    if (query.state) {
      conditions.push(ilike(basicInformation.state, `%${query.state}%`));
    }

    if (query.lga) {
      conditions.push(
        ilike(basicInformation.localGovernmentArea, `%${query.lga}%`),
      );
    }

    if (query.typeOfNomadism) {
      conditions.push(
        eq(
          demographicInformation.typeOfNomadism,
          query.typeOfNomadism as 'settled' | 'semi_settled' | 'mobile',
        ),
      );
    }

    if (query.sex) {
      conditions.push(
        eq(demographicInformation.sex, query.sex as 'male' | 'female'),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalQuery = this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      );

    if (whereClause) {
      totalQuery.where(whereClause);
    }

    const totalResult = await totalQuery;
    const total = totalResult[0].count;

    // Get paginated results
    const surveysQuery = this.db
      .select()
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      )
      .leftJoin(
        currentSkills,
        eq(skillsSurveySubmissions.id, currentSkills.submissionId),
      )
      .leftJoin(
        skillsNeed,
        eq(skillsSurveySubmissions.id, skillsNeed.submissionId),
      )
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      )
      .leftJoin(
        perceptionOfSkills,
        eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
      )
      .leftJoin(users, eq(skillsSurveySubmissions.submittedBy, users.id))
      .offset(offset)
      .limit(limit)
      .orderBy(desc(skillsSurveySubmissions.createdAt));

    if (whereClause) {
      surveysQuery.where(whereClause);
    }

    const surveys = await surveysQuery;

    return responder(
      200,
      {
        data: surveys,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Surveys retrieved successfully',
    );
  }

  async getSurveyById(id: string) {
    const survey = await this.db
      .select()
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      )
      .leftJoin(
        currentSkills,
        eq(skillsSurveySubmissions.id, currentSkills.submissionId),
      )
      .leftJoin(
        skillsNeed,
        eq(skillsSurveySubmissions.id, skillsNeed.submissionId),
      )
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      )
      .leftJoin(
        perceptionOfSkills,
        eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
      )
      .leftJoin(users, eq(skillsSurveySubmissions.submittedBy, users.id))
      .where(eq(skillsSurveySubmissions.id, id));

    if (!survey || survey.length === 0) {
      throw new NotFoundException('Survey not found');
    }

    return responder(200, survey[0], 'Survey retrieved successfully');
  }

  async deleteSurvey(id: string) {
    const survey = await this.db.query.skillsSurveySubmissions.findFirst({
      where: eq(skillsSurveySubmissions.id, id),
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    await this.db
      .delete(skillsSurveySubmissions)
      .where(eq(skillsSurveySubmissions.id, id));

    return responder(200, null, 'Survey deleted successfully');
  }

  async getSurveyStats() {
    const totalSurveys = await this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions);

    const completedSurveys = await this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .where(eq(skillsSurveySubmissions.isComplete, true));

    const genderDistribution = await this.db
      .select({
        sex: demographicInformation.sex,
        count: count(),
      })
      .from(demographicInformation)
      .groupBy(demographicInformation.sex);

    const ageDistribution = await this.db
      .select({
        ageRange: demographicInformation.ageRange,
        count: count(),
      })
      .from(demographicInformation)
      .groupBy(demographicInformation.ageRange);

    const nomadismDistribution = await this.db
      .select({
        typeOfNomadism: demographicInformation.typeOfNomadism,
        count: count(),
      })
      .from(demographicInformation)
      .groupBy(demographicInformation.typeOfNomadism);

    const skillInterests = await this.db
      .select({
        mostPreferredSkill: desiredSkills.mostPreferredSkill,
        count: count(),
      })
      .from(desiredSkills)
      .where(
        eq(desiredSkills.mostPreferredSkill, desiredSkills.mostPreferredSkill),
      )
      .groupBy(desiredSkills.mostPreferredSkill);

    return responder(
      200,
      {
        totalSurveys: totalSurveys[0].count,
        completedSurveys: completedSurveys[0].count,
        genderDistribution,
        ageDistribution,
        nomadismDistribution,
        skillInterests,
      },
      'Survey statistics retrieved successfully',
    );
  }
}
