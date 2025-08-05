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

  private buildWhereConditions(filters: DashboardFiltersDto) {
    const conditions: SQL[] = [];

    if (filters.state && filters.state !== 'ALL') {
      conditions.push(eq(basicInformation.state, filters.state));
    }

    if (filters.zone) {
      conditions.push(eq(basicInformation.zone, filters.zone));
    }

    if (filters.dateFrom) {
      conditions.push(
        gte(basicInformation.dateOfSurvey, new Date(filters.dateFrom)),
      );
    }

    if (filters.dateTo) {
      conditions.push(
        lte(basicInformation.dateOfSurvey, new Date(filters.dateTo)),
      );
    }

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
