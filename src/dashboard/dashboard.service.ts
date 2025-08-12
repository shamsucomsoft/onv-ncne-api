import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, SQL, sql } from 'drizzle-orm';
import {
  basicInformation,
  demographicInformation,
  skillsSurveySubmissions,
  desiredSkills,
  currentSkills,
  perceptionOfSkills,
  communities,
  users,
  roles,
  skillsNeed,
} from '../drizzle/schema';
import {
  DashboardFiltersDto,
  DashboardStatsResponseDto,
  StateStatsDto,
  SkillInterestByGenderDto,
  SkillBarrierDto,
  SkillProficiencyDto,
  NomadismTypeDto,
  OverallStatsDto,
  TopSkillDto,
  DashboardInsightsResponseDto,
  InsightDto,
  DashboardLiteResponseDto,
} from './dto/dashboard.dto';
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';

@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleORM) {}

  async getDashboardStats(
    filters: DashboardFiltersDto,
  ): Promise<DashboardStatsResponseDto> {
    const whereConditions = this.buildWhereConditions(filters);

    // Get parallel queries for better performance
    const [
      overallStats,
      stateStats,
      skillInterestByGender,
      skillBarriers,
      skillProficiency,
      nomadismTypes,
      topSkills,
    ] = await Promise.all([
      this.getOverallStats(whereConditions),
      this.getStateStats(whereConditions),
      this.getSkillInterestByGender(whereConditions),
      this.getSkillBarriers(whereConditions),
      this.getSkillProficiency(whereConditions),
      this.getNomadismTypes(whereConditions),
      this.getTopSkills(whereConditions),
    ]);

    return {
      overallStats,
      stateStats,
      skillInterestByGender,
      skillBarriers,
      skillProficiency,
      nomadismTypes,
      topSkills,
      lastUpdated: new Date(),
    };
  }

  async getDashboardInsights(
    filters: DashboardFiltersDto,
  ): Promise<DashboardInsightsResponseDto> {
    const stats = await this.getDashboardStats(filters);
    const insights = await this.generateInsights(stats);

    return {
      insights: insights.insights,
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    };
  }

  async getDashboardStatsLite(
    filters: DashboardFiltersDto,
  ): Promise<DashboardLiteResponseDto> {
    const whereConditions = this.buildWhereConditions(filters);

    console.log('whereConditions', whereConditions?.toString());
    // Run all queries in parallel for efficiency
    const [
      overallData,
      stateBreakdown,
      demographics,
      skillsData,
      perceptionsData,
      recentsData,
    ] = await Promise.all([
      this.getOverallStatsLite(whereConditions),
      this.getStateBreakdownLite(whereConditions),
      this.getDemographicsLite(whereConditions),
      this.getSkillsDataLite(whereConditions),
      this.getPerceptionsLite(whereConditions),
      this.getRecentsLite(whereConditions),
    ]);

    return {
      overall: overallData,
      stateBreakdown,
      demographics,
      skills: skillsData,
      perceptions: perceptionsData,
      recents: recentsData,
    };
  }

  async getPublicData() {
    const data = {
      collections: 0,
      states: 0,
      communities: 0,
      gender: {male:0, female:0},
    }
    const [
      collections,
      states,
      _communities,
      gender,
      _gender,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(skillsSurveySubmissions),
      this.db.execute(sql`select count(distinct(c.local_government_area)) as count from communities c ;`),
      this.db.select({ count: count() }).from(communities),
      this.db
        .select({ count: count() })
        .from(demographicInformation)
        .where(eq(demographicInformation.sex, 'male')),
      this.db
        .select({ count: count() })
        .from(demographicInformation)
        .where(eq(demographicInformation.sex, 'female')),
    ]);
    data.collections = collections[0]?.count || 0;
    data.states = Number(states.rows[0].count) || 0;
    data.communities = _communities[0]?.count || 0;
    data.gender.male = gender[0]?.count || 0;
    data.gender.female = _gender[0]?.count || 0;
    return data;
  }
  private buildWhereConditions(filters: DashboardFiltersDto) {
    const conditions: SQL[] = [];

    // if (filters.state && filters.state !== 'ALL') {
    //   conditions.push(eq(basicInformation.state, filters.state));
    // }

    // if (filters.zone) {
    //   conditions.push(eq(basicInformation.zone, filters.zone));
    // }

    // if (filters.dateFrom) {
    //   conditions.push(
    //     gte(skillsSurveySubmissions.submittedAt, new Date(filters.dateFrom)),
    //   );
    // }

    // if (filters.dateTo) {
    //   conditions.push(
    //     lte(skillsSurveySubmissions.submittedAt, new Date(filters.dateTo)),
    //   );
    // }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private async getOverallStats(
    whereConditions: any,
  ): Promise<OverallStatsDto> {
    // Total surveys
    const totalSurveysQuery = this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      );

    if (whereConditions) {
      totalSurveysQuery.where(whereConditions);
    }

    const totalSurveysResult = await totalSurveysQuery;
    const totalSurveys = totalSurveysResult[0]?.count || 0;

    // Completed surveys
    const completedSurveysQuery = this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(
        and(eq(skillsSurveySubmissions.isComplete, true), whereConditions),
      );

    const completedSurveysResult = await completedSurveysQuery;
    const completedSurveys = completedSurveysResult[0]?.count || 0;

    // Estimate population and communities based on survey data
    const estimatedPopulation = totalSurveys * 180; // Estimate 180 people per survey
    const estimatedCommunities = Math.floor(totalSurveys / 15); // Estimate 15 surveys per community
    const estimatedSkillsCenters = Math.floor(estimatedCommunities * 0.3); // 30% of communities have centers

    const completionRate =
      totalSurveys > 0
        ? Math.round((completedSurveys / totalSurveys) * 100)
        : 0;
    const skillsTrainingRate = 25; // This could be calculated from actual training data when available

    return {
      totalNomadicPopulation: estimatedPopulation,
      totalSurveys,
      completedSurveys,
      totalCommunities: estimatedCommunities,
      skillsCenters: estimatedSkillsCenters,
      completionRate,
      skillsTrainingRate,
      activeCenters: Math.floor(estimatedSkillsCenters * 0.8), // 80% active
    };
  }

  private async getStateStats(whereConditions: any): Promise<StateStatsDto[]> {
    const query = this.db
      .select({
        state: basicInformation.state,
        zone: basicInformation.zone,
        totalSurveys: count(),
        completedSurveys: sql<number>`COUNT(CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .groupBy(basicInformation.state, basicInformation.zone);

    if (whereConditions) {
      query.where(whereConditions);
    }

    const results = await query;

    return results
      .filter((result) => result.state) // Filter out null states
      .map((result) => {
        const estimatedPopulation = result.totalSurveys * 180;
        const estimatedCenters = Math.floor((result.totalSurveys / 15) * 0.3);
        const trainingRate = Math.floor(Math.random() * 15) + 15; // Random between 15-30% for now

        return {
          state: result.state || 'N/A',
          code: this.getStateCode(result.state || '00'),
          nomadicPopulation: estimatedPopulation,
          skillsCenters: estimatedCenters,
          skillsTrainingRate: trainingRate,
          totalSurveys: result.totalSurveys,
          completedSurveys: result.completedSurveys,
          zone: result.zone || 'unknown',
        };
      });
  }

  private async getSkillInterestByGender(
    whereConditions: any,
  ): Promise<SkillInterestByGenderDto[]> {
    // Get skill interests aggregated by gender
    const skillFields = [
      'interestedLivestockDairyBeef',
      'interestedCropProduction',
      'interestedIrrigation',
      'interestedWelding',
      'interestedAutoMechanic',
      'interestedIct',
      'interestedPoultry',
      'interestedFashionDesign',
    ];

    const skillLabels = {
      interestedLivestockDairyBeef: 'Livestock Production',
      interestedCropProduction: 'Crop Farming',
      interestedIrrigation: 'Irrigation',
      interestedWelding: 'Welding',
      interestedAutoMechanic: 'Auto Mechanic',
      interestedIct: 'ICT Skills',
      interestedPoultry: 'Poultry',
      interestedFashionDesign: 'Fashion Design',
    };

    const results: SkillInterestByGenderDto[] = [];

    for (const field of skillFields) {
      const query = this.db
        .select({
          sex: demographicInformation.sex,
          count: sql<number>`COUNT(CASE WHEN ${desiredSkills[field]} = true THEN 1 END)`,
        })
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
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .groupBy(demographicInformation.sex);

      if (whereConditions) {
        query.where(whereConditions);
      }

      const skillResults = await query;

      const maleCount = skillResults.find((r) => r.sex === 'male')?.count || 0;
      const femaleCount =
        skillResults.find((r) => r.sex === 'female')?.count || 0;

      results.push({
        skill: skillLabels[field],
        maleCount,
        femaleCount,
        totalCount: maleCount + femaleCount,
      });
    }

    return results.filter((r) => r.totalCount > 0);
  }

  private async getSkillBarriers(
    whereConditions: any,
  ): Promise<SkillBarrierDto[]> {
    const barrierFields = [
      'barrierFinancialCost',
      'barrierTimeConstraint',
      'barrierLackOfInformation',
      'barrierInaccessibility',
      'barrierInsecurity',
      'barrierHealthChallenges',
      'barrierOthers',
    ];

    const barrierLabels = {
      barrierFinancialCost: 'Financial Cost',
      barrierTimeConstraint: 'Time Constraints',
      barrierLackOfInformation: 'Lack of Information',
      barrierInaccessibility: 'Distance/Accessibility',
      barrierInsecurity: 'Insecurity',
      barrierHealthChallenges: 'Health Challenges',
      barrierOthers: 'Other Barriers',
    };

    // Get total count for percentage calculation
    const totalQuery = this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      );

    if (whereConditions) {
      totalQuery.where(whereConditions);
    }

    const totalResult = await totalQuery;
    const total = totalResult[0]?.count || 1;

    const results: SkillBarrierDto[] = [];

    for (const field of barrierFields) {
      const query = this.db
        .select({
          count: sql<number>`COUNT(CASE WHEN ${desiredSkills[field]} = true THEN 1 END)`,
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        );

      if (whereConditions) {
        query.where(whereConditions);
      }

      const result = await query;
      const count = result[0]?.count || 0;

      if (count > 0) {
        results.push({
          barrier: barrierLabels[field],
          count,
          percentage: Math.round((count / total) * 100),
        });
      }
    }

    return results.sort((a, b) => b.count - a.count);
  }

  private async getSkillProficiency(
    whereConditions: any,
  ): Promise<SkillProficiencyDto[]> {
    // This would need to be enhanced based on actual proficiency data
    // For now, return estimated data based on confidence levels
    return [
      {
        skill: 'Livestock Skills',
        noSkills: 25,
        basic: 35,
        intermediate: 28,
        advanced: 12,
      },
      {
        skill: 'Agricultural Skills',
        noSkills: 35,
        basic: 28,
        intermediate: 25,
        advanced: 12,
      },
      {
        skill: 'Technical Skills',
        noSkills: 65,
        basic: 22,
        intermediate: 10,
        advanced: 3,
      },
    ];
  }

  private async getNomadismTypes(
    whereConditions: any,
  ): Promise<NomadismTypeDto[]> {
    const query = this.db
      .select({
        type: demographicInformation.typeOfNomadism,
        count: count(),
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      )
      .groupBy(demographicInformation.typeOfNomadism);

    if (whereConditions) {
      query.where(whereConditions);
    }

    const results = await query;
    const total = results.reduce((sum, r) => sum + r.count, 0);

    const typeLabels = {
      settled: 'Settled',
      semi_settled: 'Semi-Settled',
      mobile: 'Mobile',
    };

    return results
      .filter((r) => r.type)
      .map((r) => ({
        type: typeLabels[r.type as keyof typeof typeLabels] || r.type || 'N/A',
        count: r.count,
        percentage: Math.round((r.count / total) * 100),
      }));
  }

  private async getTopSkills(whereConditions: any): Promise<TopSkillDto[]> {
    const query = this.db
      .select({
        skill: desiredSkills.mostPreferredSkill,
        count: count(),
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      )
      .groupBy(desiredSkills.mostPreferredSkill)
      .orderBy(desc(count()))
      .limit(10);

    if (whereConditions) {
      query.where(whereConditions);
    }

    const results = await query;
    const total = results.reduce((sum, r) => sum + r.count, 0);

    const skillLabels = {
      livestock_dairy_beef: 'Livestock (Dairy & Beef)',
      crop_production: 'Crop Production',
      irrigation: 'Irrigation Farming',
      poultry: 'Poultry Farming',
      welding: 'Welding & Fabrication',
      ict: 'ICT Skills',
      auto_mechanic: 'Auto Mechanic',
      fashion_design: 'Fashion Design',
    };

    return results
      .filter((r) => r.skill)
      .map((r) => ({
        skill:
          skillLabels[r.skill as keyof typeof skillLabels] || r.skill || 'N/A',
        count: r.count,
        trend: Math.random() > 0.5 ? 'up' : 'down', // Mock trend for now
        percentage: Math.round((r.count / total) * 100),
      }));
  }

  private async generateInsights(stats: DashboardStatsResponseDto): Promise<{
    insights: InsightDto[];
    keyFindings: string[];
    recommendations: string[];
  }> {
    const insights: InsightDto[] = [];
    const keyFindings: string[] = [];
    const recommendations: string[] = [];

    // Analyze completion rates
    if (stats.overallStats.completionRate < 70) {
      insights.push({
        title: 'Low Survey Completion Rate',
        description: `Only ${stats.overallStats.completionRate}% of surveys are being completed, indicating potential issues with survey length or accessibility.`,
        impact: 'high',
        category: 'barrier',
        metrics: {
          value: stats.overallStats.completionRate,
          unit: '%',
        },
      });
      recommendations.push(
        'Consider simplifying survey process and providing offline completion options',
      );
    }

    // Analyze skill barriers
    const topBarrier = stats.skillBarriers[0];
    if (topBarrier && topBarrier.percentage > 30) {
      insights.push({
        title: `High Impact Barrier: ${topBarrier.barrier}`,
        description: `${topBarrier.percentage}% of respondents cite ${topBarrier.barrier.toLowerCase()} as a major barrier to skills training.`,
        impact: 'high',
        category: 'barrier',
        metrics: {
          value: topBarrier.percentage,
          unit: '%',
        },
      });
      recommendations.push(
        `Address ${topBarrier.barrier.toLowerCase()} through targeted interventions and policy measures`,
      );
    }

    // Analyze top skills demand
    const topSkill = stats.topSkills[0];
    if (topSkill) {
      keyFindings.push(
        `${topSkill.skill} is the most in-demand skill with ${topSkill.count} respondents showing interest`,
      );
      insights.push({
        title: 'High Demand Skill Identified',
        description: `${topSkill.skill} shows highest demand with ${topSkill.percentage}% of skill preferences.`,
        impact: 'medium',
        category: 'opportunity',
        metrics: {
          value: topSkill.percentage,
          unit: '%',
        },
      });
    }

    // Analyze nomadism patterns
    const settledNomads = stats.nomadismTypes.find((t) => t.type === 'Settled');
    if (settledNomads && settledNomads.percentage > 40) {
      keyFindings.push(
        `${settledNomads.percentage}% of nomads are settled, indicating potential for permanent training centers`,
      );
      recommendations.push(
        'Establish permanent skills training centers in areas with high settled nomad populations',
      );
    }

    return { insights, keyFindings, recommendations };
  }

  private async getOverallStatsLite(whereConditions: any) {
    const [
      submissionsResult,
      completedResult,
      usersResult,
      rolesResult,
      statesResult,
      communitiesResult,
      geoTaggedResult,
    ] = await Promise.all([
      // Total submissions
      this.db
        .select({ count: count() })
        .from(skillsSurveySubmissions),
      // Completed submissions
      this.db
        .select({ count: count() })
        .from(skillsSurveySubmissions)
        .where(
            eq(skillsSurveySubmissions.isComplete, true),
        ),

      // Total users
      this.db.select({ count: count() }).from(users),

      // Total roles
      this.db.select({ count: count() }).from(roles),

      // States covered
      this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${basicInformation.state})` })
        .from(basicInformation),

      // Communities covered
      this.db.select({ count: count() }).from(communities),

      // Geo-tagged submissions
      this.db
        .select({ count: count() })
        .from(basicInformation)
        .where(
and(
                sql`${basicInformation.latitude} IS NOT NULL`,
                sql`${basicInformation.longitude} IS NOT NULL`,
              )
           
        ),
    ]);

    return {
      submissionsTotal: submissionsResult[0]?.count || 0,
      submissionsCompleted: completedResult[0]?.count || 0,
      usersTotal: usersResult[0]?.count || 0,
      rolesTotal: rolesResult[0]?.count || 0,
      statesCovered: statesResult[0]?.count || 0,
      communitiesCovered: communitiesResult[0]?.count || 0,
      geoTaggedSubmissions: geoTaggedResult[0]?.count || 0,
      biometricCapturesTotal: 0, // TODO: Implement when demographic table is properly joined
      phoneNumbersCollected: 0, // TODO: Implement when demographic table is properly joined
      emailsCollected: 0, // TODO: Implement when demographic table is properly joined
    };
  }

  private async getStateBreakdownLite(whereConditions: any) {
    const query = this.db
      .select({
        state: basicInformation.state,
        zone: basicInformation.zone,
        submissions: count(),
        completed: sql<number>`COUNT(CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .groupBy(basicInformation.state, basicInformation.zone);

    if (whereConditions) {
      query.where(whereConditions);
    }

    return await query;
  }

  private async getDemographicsLite(whereConditions: any) {
    const [genderResult, ageResult, nomadismResult, educationResult, occupationsResult] = await Promise.all([
      // Gender distribution
      this.db
        .select({
          sex: demographicInformation.sex,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          demographicInformation,
          eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
        )
        .where(whereConditions)
        .groupBy(demographicInformation.sex),

      // Age range distribution
      this.db
        .select({
          ageRange: demographicInformation.ageRange,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          demographicInformation,
          eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
        )
        .where(whereConditions)
        .groupBy(demographicInformation.ageRange),

      // Nomadism type distribution
      this.db
        .select({
          typeOfNomadism: demographicInformation.typeOfNomadism,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          demographicInformation,
          eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
        )
        .where(whereConditions)
        .groupBy(demographicInformation.typeOfNomadism),

      // Education level distribution
      this.db
        .select({
          levelOfEducation: demographicInformation.levelOfEducation,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          demographicInformation,
          eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
        )
        .where(whereConditions)
        .groupBy(demographicInformation.levelOfEducation),

      // Occupations analysis
      this.getOccupationCounts(whereConditions),
    ]);

    return {
      gender: genderResult,
      ageRange: ageResult,
      nomadism: nomadismResult,
      education: educationResult,
      occupations: occupationsResult,
    };
  }

  private async getOccupationCounts(whereConditions: any): Promise<Array<{ occupation: string; count: number }>> {
    const occupationFields = [
      'occupationHerding',
      'occupationFarming',
      'occupationFishing',
      'occupationTrading',
      'occupationArtisan',
      'occupationOthers',
    ];

    const results: Array<{ occupation: string; count: number }> = [];
    for (const field of occupationFields) {
      const result = await this.db
        .select({
          count: sql<number>`COUNT(CASE WHEN ${demographicInformation[field]} = true THEN 1 END)`,
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          demographicInformation,
          eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
        )
        .where(whereConditions);

      results.push({
        occupation: field.replace('occupation', '').replace(/([A-Z])/g, ' $1').trim(),
        count: result[0]?.count || 0,
      });
    }
    return results;
  }

  private async getSkillsDataLite(whereConditions: any) {
    const [
      mostPreferredResult,
      detailedInterestsResult,
      detailedBarriersResult,
      wantTrainingResult,
      learningMethodResult,
      availableResourcesResult,
      preferredTimeResult,
      hasCurrentSkillsResult,
      confidenceLevelsResult,
      skillsRelevanceResult,
      availableForExternalTrainingResult,
      externalTrainingTimelineResult,
    ] = await Promise.all([
      // Most preferred skills
      this.db
        .select({
          skill: desiredSkills.mostPreferredSkill,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(desiredSkills.mostPreferredSkill)
        .orderBy(desc(count()))
        .limit(10),

      // Detailed skill interests
      this.getDetailedSkillInterests(whereConditions),

      // Detailed barriers
      this.getDetailedBarriers(whereConditions),

      // Want training
      this.db
        .select({
          value: skillsNeed.wantTraining,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          skillsNeed,
          eq(skillsSurveySubmissions.id, skillsNeed.submissionId),
        )
        .where(whereConditions)
        .groupBy(skillsNeed.wantTraining),

      // Learning method
      this.db
        .select({
          value: desiredSkills.learningMethod,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(desiredSkills.learningMethod),

      // Available resources
      this.db
        .select({
          value: desiredSkills.availableResources,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(desiredSkills.availableResources),

      // Preferred learning time
      this.db
        .select({
          value: desiredSkills.preferredLearningTime,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(desiredSkills.preferredLearningTime),

      // Has current skills
      this.db
        .select({
          value: currentSkills.hasSkills,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          currentSkills,
          eq(skillsSurveySubmissions.id, currentSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(currentSkills.hasSkills),

      // Confidence levels
      this.db
        .select({
          level: currentSkills.confidenceLevel,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          currentSkills,
          eq(skillsSurveySubmissions.id, currentSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(currentSkills.confidenceLevel),

      // Skills relevance
      this.db
        .select({
          level: skillsNeed.skillsRelevance,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          skillsNeed,
          eq(skillsSurveySubmissions.id, skillsNeed.submissionId),
        )
        .where(whereConditions)
        .groupBy(skillsNeed.skillsRelevance),

      // Available for external training
      this.db
        .select({
          value: desiredSkills.availableForExternalTraining,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(desiredSkills.availableForExternalTraining),

      // External training timeline count
      this.db
        .select({ count: count() })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(
          whereConditions
            ? and(
                sql`${desiredSkills.externalTrainingTimeline} IS NOT NULL`,
                whereConditions,
              )
            : sql`${desiredSkills.externalTrainingTimeline} IS NOT NULL`,
        ),
    ]);

    return {
      mostPreferred: mostPreferredResult,
      detailedInterests: detailedInterestsResult,
      wantTraining: wantTrainingResult,
      learningMethod: learningMethodResult,
      availableResources: availableResourcesResult,
      preferredLearningTime: preferredTimeResult,
      hasCurrentSkills: hasCurrentSkillsResult,
      confidenceLevels: confidenceLevelsResult,
      skillsRelevance: skillsRelevanceResult,
      detailedBarriers: detailedBarriersResult,
      availableForExternalTraining: availableForExternalTrainingResult,
      externalTrainingTimeline: externalTrainingTimelineResult[0]?.count || 0,
    };
  }

  private async getDetailedSkillInterests(whereConditions: any): Promise<Array<{ interest: string; count: number; percentage: number }>> {
    const skillFields = [
      'interestedLivestockDairyBeef',
      'interestedLivestockSmallRuminants',
      'interestedLivestockFeeds',
      'interestedPoultry',
      'interestedRabbitary',
      'interestedFishProduction',
      'interestedSnailery',
      'interestedBeeKeeping',
      'interestedCropProduction',
      'interestedIrrigation',
      'interestedGardening',
      'interestedIct',
      'interestedPhoneRepairs',
      'interestedFashionDesign',
      'interestedKnitting',
      'interestedHairDressing',
      'interestedBeadsRaffia',
      'interestedShoeBagMaking',
      'interestedAutoMechanic',
      'interestedCarpentry',
      'interestedMasonry',
      'interestedPomadeSoapMaking',
      'interestedPotteryCeramics',
      'interestedSolarPower',
      'interestedWelding',
      'interestedCatering',
      'interestedOthers',
    ];

    // Get total submissions for percentage calculation
    const totalResult = await this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      )
      .where(whereConditions);

    const totalSubmissions = totalResult[0]?.count || 0;
    const results: Array<{ interest: string; count: number; percentage: number }> = [];

    for (const field of skillFields) {
      const result = await this.db
        .select({
          count: sql<number>`COUNT(CASE WHEN ${desiredSkills[field]} = true THEN 1 END)`,
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions);

      const count = result[0]?.count || 0;
      const percentage = totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0;

      results.push({
        interest: field.replace('interested', '').replace(/([A-Z])/g, ' $1').trim(),
        count,
        percentage,
      });
    }

    // Sort by count descending
    return results.sort((a, b) => b.count - a.count);
  }

  private async getDetailedBarriers(whereConditions: any): Promise<Array<{ barrier: string; count: number; percentage: number }>> {
    const barrierFields = [
      'barrierFinancialCost',
      'barrierTimeConstraint',
      'barrierLackOfInformation',
      'barrierInaccessibility',
      'barrierInsecurity',
      'barrierHealthChallenges',
      'barrierOthers',
    ];

    // Get total submissions for percentage calculation
    const totalResult = await this.db
      .select({ count: count() })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      )
      .where(whereConditions);

    const totalSubmissions = totalResult[0]?.count || 0;
    const results: Array<{ barrier: string; count: number; percentage: number }> = [];

    for (const field of barrierFields) {
      const result = await this.db
        .select({
          count: sql<number>`COUNT(CASE WHEN ${desiredSkills[field]} = true THEN 1 END)`,
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          desiredSkills,
          eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
        )
        .where(whereConditions);

      const count = result[0]?.count || 0;
      const percentage = totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0;

      results.push({
        barrier: field.replace('barrier', '').replace(/([A-Z])/g, ' $1').trim(),
        count,
        percentage,
      });
    }

    // Sort by count descending
    return results.sort((a, b) => b.count - a.count);
  }

  private async getRecentsLite(whereConditions: any) {
    const query = this.db
      .select({
        id: skillsSurveySubmissions.id,
        state: basicInformation.state,
        community: basicInformation.nameOfCommunity,
        submittedAt: skillsSurveySubmissions.submittedAt,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .orderBy(desc(skillsSurveySubmissions.submittedAt))
      .limit(5);

    if (whereConditions) {
      query.where(whereConditions);
    }

    return await query;
  }

  private async getPerceptionsLite(whereConditions: any) {
    const [
      skillsImportanceResult,
      communitySupportResult,
      financialSecurityResult,
      improvementSuggestionsResult,
    ] = await Promise.all([
      // Skills importance for development
      this.db
        .select({
          rating: perceptionOfSkills.skillsImportanceForDevelopment,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          perceptionOfSkills,
          eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(perceptionOfSkills.skillsImportanceForDevelopment),

      // Community skills support level
      this.db
        .select({
          rating: perceptionOfSkills.communitySkillsSupportLevel,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          perceptionOfSkills,
          eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(perceptionOfSkills.communitySkillsSupportLevel),

      // Skills effective for financial security
      this.db
        .select({
          rating: perceptionOfSkills.skillsEffectiveForFinancialSecurity,
          count: count(),
        })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          perceptionOfSkills,
          eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
        )
        .where(whereConditions)
        .groupBy(perceptionOfSkills.skillsEffectiveForFinancialSecurity),

      // Count of improvement suggestions
      this.db
        .select({ count: count() })
        .from(skillsSurveySubmissions)
        .leftJoin(
          basicInformation,
          eq(skillsSurveySubmissions.id, basicInformation.submissionId),
        )
        .leftJoin(
          perceptionOfSkills,
          eq(skillsSurveySubmissions.id, perceptionOfSkills.submissionId),
        )
        .where(
          whereConditions
            ? and(
                sql`${perceptionOfSkills.suggestionsForImprovement} IS NOT NULL`,
                whereConditions,
              )
            : sql`${perceptionOfSkills.suggestionsForImprovement} IS NOT NULL`,
        ),
    ]);

    return {
      skillsImportanceForDevelopment: skillsImportanceResult,
      communitySkillsSupportLevel: communitySupportResult,
      skillsEffectiveForFinancialSecurity: financialSecurityResult,
      improvementSuggestions: improvementSuggestionsResult[0]?.count || 0,
    };
  }

  private getStateCode(stateName: string): string {
    const stateCodes = {
      Sokoto: 'SK',
      Kebbi: 'KB',
      Zamfara: 'ZF',
      Katsina: 'KT',
      Kano: 'KN',
      Yobe: 'YB',
      Bauchi: 'BC',
      Niger: 'NG',
      Borno: 'BO',
      Adamawa: 'AD',
      Taraba: 'TB',
      Plateau: 'PL',
      Kaduna: 'KD',
      Kwara: 'KW',
      Oyo: 'OY',
    };

    return (
      stateCodes[stateName] || stateName?.substring(0, 2).toUpperCase() || 'UK'
    );
  }
}
