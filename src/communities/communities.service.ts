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
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';

export interface CommunityStats {
  totalCommunities: number;
  engagedCommunities: number;
  activeCenters: number;
  averageDistance: number;
}

export interface GeographicDistribution {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface CommunityEngagement {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
    borderColor: string;
  }>;
}

export interface DistanceAnalysis {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface CommunityChallenge {
  challenge: string;
  percentage: number;
  communities: number;
}

export interface ZoneData {
  zone: string;
  communities: number;
  centers: number;
  engagement: string;
  priority: string;
}

export interface CommunitiesResponse {
  communityStats: CommunityStats;
  geographicDistribution: GeographicDistribution;
  communityEngagement: CommunityEngagement;
  distanceAnalysis: DistanceAnalysis;
  challenges: CommunityChallenge[];
  zoneData: ZoneData[];
}

// Educational Programs Interfaces
export interface EducationalStats {
  totalLearners: number;
  enrolledLearners: number;
  activePrograms: number;
  averageCompletion: number;
  flaggedLearners: number;
}

export interface GenderAgeDistribution {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface ProgramBarriers {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
    borderColor: string;
  }>;
}

export interface EcologicalZoneDistribution {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface SettlementTypeDistribution {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
    borderColor: string;
  }>;
}

export interface MonthlyEnrollmentData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }>;
}

export interface StateAnalysis {
  state: string;
  total: number;
  male: number;
  female: number;
  primaryBarrier: string;
  status: string;
}

export interface EducationalProgram {
  program: string;
  beneficiaries: number;
  cost: number;
  effectiveness: number;
}

export interface NomadicLearner {
  id: string;
  learnerId: string;
  name: string;
  age: number;
  gender: string;
  state: string;
  lga: string;
  settlementType: string;
  primaryBarrier: string;
  programStatus: string;
  participationLevel: string;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  flagStatus?: 'active' | 'resolved' | 'dismissed';
  flagNotes?: string;
}

export interface EducationalProgramsResponse {
  educationalStats: EducationalStats;
  genderAgeDistribution: GenderAgeDistribution;
  programBarriers: ProgramBarriers;
  ecologicalZoneDistribution: EcologicalZoneDistribution;
  settlementTypeDistribution: SettlementTypeDistribution;
  monthlyEnrollmentData: MonthlyEnrollmentData;
  stateAnalysis: StateAnalysis[];
  educationalPrograms: EducationalProgram[];
  learners: NomadicLearner[];
}

@Injectable()
export class CommunitiesService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleORM) {}

  async getCommunitiesData(): Promise<CommunitiesResponse> {
    const [
      communityStats,
      geographicDistribution,
      communityEngagement,
      distanceAnalysis,
      challenges,
      zoneData,
    ] = await Promise.all([
      this.getCommunityStats(),
      this.getGeographicDistribution(),
      this.getCommunityEngagement(),
      this.getDistanceAnalysis(),
      this.getChallenges(),
      this.getZoneData(),
    ]);

    return {
      communityStats,
      geographicDistribution,
      communityEngagement,
      distanceAnalysis,
      challenges,
      zoneData,
    };
  }

  async getEducationalProgramsData(): Promise<EducationalProgramsResponse> {
    const [
      educationalStats,
      genderAgeDistribution,
      programBarriers,
      ecologicalZoneDistribution,
      settlementTypeDistribution,
      monthlyEnrollmentData,
      stateAnalysis,
      educationalPrograms,
      learners,
    ] = await Promise.all([
      this.getEducationalStats(),
      this.getGenderAgeDistribution(),
      this.getProgramBarriers(),
      this.getEcologicalZoneDistribution(),
      this.getSettlementTypeDistribution(),
      this.getMonthlyEnrollmentData(),
      this.getStateAnalysis(),
      this.getEducationalPrograms(),
      this.getNomadicLearners(),
    ]);

    return {
      educationalStats,
      genderAgeDistribution,
      programBarriers,
      ecologicalZoneDistribution,
      settlementTypeDistribution,
      monthlyEnrollmentData,
      stateAnalysis,
      educationalPrograms,
      learners,
    };
  }

  private async getCommunityStats(): Promise<CommunityStats> {
    // Get total unique communities
    const communitiesQuery = this.db
      .select({
        communityCount: sql<number>`COUNT(DISTINCT ${basicInformation.nameOfCommunity})`,
      })
      .from(basicInformation)
      .where(sql`${basicInformation.nameOfCommunity} IS NOT NULL`);

    const communitiesResult = await communitiesQuery;
    const totalCommunities = communitiesResult[0]?.communityCount || 0;

    // Get engaged communities (communities with completed surveys)
    const engagedQuery = this.db
      .select({
        engagedCount: sql<number>`COUNT(DISTINCT ${basicInformation.nameOfCommunity})`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(
        and(
          eq(skillsSurveySubmissions.isComplete, true),
          sql`${basicInformation.nameOfCommunity} IS NOT NULL`,
        ),
      );

    const engagedResult = await engagedQuery;
    const engagedCommunities = engagedResult[0]?.engagedCount || 0;

    // Estimate active centers (30% of communities have centers, 80% are active)
    const estimatedCenters = Math.floor(totalCommunities * 0.3);
    const activeCenters = Math.floor(estimatedCenters * 0.8);

    // Estimate average distance (placeholder - would need actual coordinates)
    const averageDistance = 3.2; // This would be calculated from actual coordinates

    return {
      totalCommunities,
      engagedCommunities,
      activeCenters,
      averageDistance,
    };
  }

  private async getGeographicDistribution(): Promise<GeographicDistribution> {
    const zoneQuery = this.db
      .select({
        zone: basicInformation.zone,
        communityCount: sql<number>`COUNT(DISTINCT ${basicInformation.nameOfCommunity})`,
        centerCount: sql<number>`COUNT(DISTINCT CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN ${basicInformation.nameOfCommunity} END)`,
      })
      .from(basicInformation)
      .leftJoin(
        skillsSurveySubmissions,
        eq(basicInformation.submissionId, skillsSurveySubmissions.id),
      )
      .where(sql`${basicInformation.zone} IS NOT NULL`)
      .groupBy(basicInformation.zone);

    const zoneResults = await zoneQuery;

    const zoneLabels = {
      'north-west': 'Northern Zone',
      'north-east': 'North East',
      'north-central': 'Middle Belt',
      'south-west': 'South West',
      'south-east': 'South East',
      'south-south': 'South South',
    };

    const labels: string[] = [];
    const communityData: number[] = [];
    const centerData: number[] = [];

    // Initialize with all zones
    Object.entries(zoneLabels).forEach(([key, label]) => {
      labels.push(label);
      const zoneResult = zoneResults.find((r) => r.zone === key);
      communityData.push(zoneResult?.communityCount || 0);
      centerData.push(zoneResult?.centerCount || 0);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Communities',
          data: communityData,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderColor: 'rgba(15, 23, 42, 1)',
          borderWidth: 1,
        },
        {
          label: 'ANFE Centers',
          data: centerData,
          backgroundColor: 'rgba(15, 118, 110, 0.9)',
          borderColor: 'rgba(15, 118, 110, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  private async getCommunityEngagement(): Promise<CommunityEngagement> {
    // Calculate engagement levels based on survey completion rates per community
    const engagementQuery = this.db
      .select({
        community: basicInformation.nameOfCommunity,
        totalSurveys: count(),
        completedSurveys: sql<number>`COUNT(CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(sql`${basicInformation.nameOfCommunity} IS NOT NULL`)
      .groupBy(basicInformation.nameOfCommunity);

    const engagementResults = await engagementQuery;

    // Calculate engagement levels
    let veryHigh = 0;
    let high = 0;
    let moderate = 0;
    let low = 0;
    let veryLow = 0;

    engagementResults.forEach((result) => {
      const completionRate =
        result.totalSurveys > 0
          ? (result.completedSurveys / result.totalSurveys) * 100
          : 0;

      if (completionRate >= 80) veryHigh++;
      else if (completionRate >= 60) high++;
      else if (completionRate >= 40) moderate++;
      else if (completionRate >= 20) low++;
      else veryLow++;
    });

    return {
      labels: ['Very High', 'High', 'Moderate', 'Low', 'Very Low'],
      datasets: [
        {
          data: [veryHigh, high, moderate, low, veryLow],
          backgroundColor: [
            'rgba(15, 118, 110, 0.9)',
            'rgba(34, 197, 94, 0.9)',
            'rgba(161, 98, 7, 0.9)',
            'rgba(220, 38, 38, 0.9)',
            'rgba(185, 28, 28, 0.9)',
          ],
          borderWidth: 2,
          borderColor: '#1f2937',
        },
      ],
    };
  }

  private async getDistanceAnalysis(): Promise<DistanceAnalysis> {
    // Since we don't have actual distance data, we'll estimate based on coordinates
    // For now, return placeholder data with 0 values
    return {
      labels: ['Less than 1km', '1-2km', '2-5km', '5-10km', 'More than 10km'],
      datasets: [
        {
          label: 'Percentage of Communities',
          data: [0, 0, 0, 0, 0], // All 0 since we don't have actual distance data
          backgroundColor: 'rgba(29, 78, 216, 0.9)',
          borderColor: 'rgba(29, 78, 216, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  private async getChallenges(): Promise<CommunityChallenge[]> {
    // Get total communities for percentage calculation
    const totalCommunitiesQuery = this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${basicInformation.nameOfCommunity})`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(sql`${basicInformation.nameOfCommunity} IS NOT NULL`);

    const totalCommunitiesResult = await totalCommunitiesQuery;
    const totalCommunities = totalCommunitiesResult[0]?.count || 0;

    if (totalCommunities === 0) {
      return [];
    }

    // Single query to get all barrier counts using conditional aggregation
    const challengesQuery = this.db
      .select({
        barrierFinancialCost: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierFinancialCost} = true THEN ${basicInformation.nameOfCommunity} END)`,
        barrierTimeConstraint: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierTimeConstraint} = true THEN ${basicInformation.nameOfCommunity} END)`,
        barrierLackOfInformation: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierLackOfInformation} = true THEN ${basicInformation.nameOfCommunity} END)`,
        barrierInaccessibility: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierInaccessibility} = true THEN ${basicInformation.nameOfCommunity} END)`,
        barrierInsecurity: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierInsecurity} = true THEN ${basicInformation.nameOfCommunity} END)`,
        barrierHealthChallenges: sql<number>`COUNT(DISTINCT CASE WHEN ${desiredSkills.barrierHealthChallenges} = true THEN ${basicInformation.nameOfCommunity} END)`,
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
      .where(sql`${basicInformation.nameOfCommunity} IS NOT NULL`);

    const challengesResult = await challengesQuery;
    const result = challengesResult[0];

    const barrierMapping = [
      { field: 'barrierFinancialCost', label: 'Lack of infrastructure' },
      { field: 'barrierTimeConstraint', label: 'Poor road access' },
      { field: 'barrierLackOfInformation', label: 'Limited funding' },
      { field: 'barrierInaccessibility', label: 'Teacher shortage' },
      { field: 'barrierInsecurity', label: 'Cultural resistance' },
      { field: 'barrierHealthChallenges', label: 'Language barriers' },
    ];

    const challenges: CommunityChallenge[] = [];

    for (const barrier of barrierMapping) {
      const affectedCommunities =
        result[barrier.field as keyof typeof result] || 0;
      const percentage = Math.round(
        (affectedCommunities / totalCommunities) * 100,
      );

      if (affectedCommunities > 0) {
        challenges.push({
          challenge: barrier.label,
          percentage,
          communities: affectedCommunities,
        });
      }
    }

    // Sort by percentage descending
    return challenges.sort((a, b) => b.percentage - a.percentage);
  }

  private async getZoneData(): Promise<ZoneData[]> {
    const zoneQuery = this.db
      .select({
        zone: basicInformation.zone,
        communities: sql<number>`COUNT(DISTINCT ${basicInformation.nameOfCommunity})`,
        centers: sql<number>`COUNT(DISTINCT CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN ${basicInformation.nameOfCommunity} END)`,
        totalSurveys: count(),
        completedSurveys: sql<number>`COUNT(CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(sql`${basicInformation.zone} IS NOT NULL`)
      .groupBy(basicInformation.zone);

    const zoneResults = await zoneQuery;

    const zoneLabels = {
      'north-west': 'Northern Zone',
      'north-east': 'North East',
      'north-central': 'Middle Belt',
      'south-west': 'South West',
      'south-east': 'South East',
      'south-south': 'South South',
    };

    return zoneResults.map((result) => {
      const completionRate =
        result.totalSurveys > 0
          ? (result.completedSurveys / result.totalSurveys) * 100
          : 0;

      let engagement: string;
      if (completionRate >= 80) engagement = 'Very High';
      else if (completionRate >= 60) engagement = 'High';
      else if (completionRate >= 40) engagement = 'Moderate';
      else if (completionRate >= 20) engagement = 'Low';
      else engagement = 'Very Low';

      let priority: string;
      if (result.communities > 2000) priority = 'Critical';
      else if (result.communities > 1000) priority = 'High';
      else if (result.communities > 500) priority = 'Moderate';
      else priority = 'Low';

      return {
        zone:
          zoneLabels[result.zone as keyof typeof zoneLabels] ||
          result.zone ||
          'Unknown',
        communities: result.communities,
        centers: result.centers,
        engagement,
        priority,
      };
    });
  }

  // Educational Programs Private Methods
  private async getEducationalStats(): Promise<EducationalStats> {
    const totalSurveysQuery = this.db
      .select({
        totalSurveys: count(),
        completedSurveys: sql<number>`COUNT(CASE WHEN ${skillsSurveySubmissions.isComplete} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions);

    const result = await totalSurveysQuery;
    const totalSurveys = result[0]?.totalSurveys || 0;
    const completedSurveys = result[0]?.completedSurveys || 0;

    // Estimate educational program metrics based on survey data
    const totalLearners = totalSurveys; // Estimate total nomadic population
    const enrolledLearners = Math.floor(totalLearners * 0.17); // 17% enrollment rate
    const activePrograms = 127; // Fixed number for now
    const averageCompletion =
      Math.round((completedSurveys / totalSurveys) * 100) || 67;
    const flaggedLearners = 0; // Will be implemented when flagging system is added

    return {
      totalLearners,
      enrolledLearners,
      activePrograms,
      averageCompletion,
      flaggedLearners,
    };
  }

  private async getGenderAgeDistribution(): Promise<GenderAgeDistribution> {
    const genderAgeQuery = this.db
      .select({
        sex: demographicInformation.sex,
        ageRange: demographicInformation.ageRange,
        count: count(),
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      )
      .where(
        and(
          sql`${demographicInformation.sex} IS NOT NULL`,
          sql`${demographicInformation.ageRange} IS NOT NULL`,
        ),
      )
      .groupBy(demographicInformation.sex, demographicInformation.ageRange);

    const results = await genderAgeQuery;

    // Process data for chart format
    const ageRanges = ['6-12 years', '13-17 years', '18-25 years', '26+ years'];
    const maleData = ageRanges.map((range) => {
      const maleCount =
        results.find((r) => r.sex === 'male' && r.ageRange === range)?.count ||
        0;
      return maleCount; // Scale up for population estimate
    });
    const femaleData = ageRanges.map((range) => {
      const femaleCount =
        results.find((r) => r.sex === 'female' && r.ageRange === range)
          ?.count || 0;
      return femaleCount; // Scale up for population estimate
    });

    return {
      labels: ageRanges,
      datasets: [
        {
          label: 'Male',
          data: maleData,
          backgroundColor: 'rgba(29, 78, 216, 0.9)',
          borderColor: 'rgba(29, 78, 216, 1)',
          borderWidth: 1,
        },
        {
          label: 'Female',
          data: femaleData,
          backgroundColor: 'rgba(236, 72, 153, 0.9)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  private async getProgramBarriers(): Promise<ProgramBarriers> {
    const barriersQuery = this.db
      .select({
        barrierFinancialCost: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierFinancialCost} = true THEN 1 END)`,
        barrierTimeConstraint: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierTimeConstraint} = true THEN 1 END)`,
        barrierLackOfInformation: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierLackOfInformation} = true THEN 1 END)`,
        barrierInaccessibility: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierInaccessibility} = true THEN 1 END)`,
        barrierInsecurity: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierInsecurity} = true THEN 1 END)`,
        barrierHealthChallenges: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierHealthChallenges} = true THEN 1 END)`,
        barrierOthers: sql<number>`COUNT(CASE WHEN ${desiredSkills.barrierOthers} = true THEN 1 END)`,
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        desiredSkills,
        eq(skillsSurveySubmissions.id, desiredSkills.submissionId),
      );

    const result = await barriersQuery;
    const barrierData = result[0];

    const labels = [
      'Seasonal Migration',
      'Distance to Centers',
      'Economic Constraints',
      'Cultural Factors',
      'Water/Grazing Needs',
      'Poor Infrastructure',
      'Language Barriers',
      'Insecurity',
    ];

    const data = [
      barrierData?.barrierTimeConstraint || 0,
      barrierData?.barrierInaccessibility || 0,
      barrierData?.barrierFinancialCost || 0,
      barrierData?.barrierLackOfInformation || 0,
      barrierData?.barrierHealthChallenges || 0,
      barrierData?.barrierInsecurity || 0,
      barrierData?.barrierOthers || 0,
      0, // Placeholder for insecurity
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(185, 28, 28, 0.9)',
            'rgba(220, 38, 38, 0.9)',
            'rgba(161, 98, 7, 0.9)',
            'rgba(180, 83, 9, 0.9)',
            'rgba(15, 118, 110, 0.9)',
            'rgba(29, 78, 216, 0.9)',
            'rgba(147, 51, 234, 0.9)',
            'rgba(236, 72, 153, 0.9)',
          ],
          borderWidth: 2,
          borderColor: '#1f2937',
        },
      ],
    };
  }

  private async getEcologicalZoneDistribution(): Promise<EcologicalZoneDistribution> {
    const zoneQuery = this.db
      .select({
        zone: basicInformation.zone,
        count: count(),
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        basicInformation,
        eq(skillsSurveySubmissions.id, basicInformation.submissionId),
      )
      .where(sql`${basicInformation.zone} IS NOT NULL`)
      .groupBy(basicInformation.zone);

    const results = await zoneQuery;

    const zoneLabels = {
      'north-west': 'Sahel Zone',
      'north-east': 'Sudan Savanna',
      'north-central': 'Guinea Savanna',
      'south-west': 'Forest Zone',
      'south-east': 'Coastal Zone',
      'south-south': 'Coastal Zone',
    };

    const labels = Object.values(zoneLabels);
    const data = labels.map((label) => {
      const zoneKey = Object.keys(zoneLabels).find(
        (key) => zoneLabels[key] === label,
      );
      const count = results.find((r) => r.zone === zoneKey)?.count || 0;
      return count; // Scale up for population estimate
    });

    return {
      labels,
      datasets: [
        {
          label: 'Nomadic Learners (thousands)',
          data,
          backgroundColor: 'rgba(15, 118, 110, 0.9)',
          borderColor: 'rgba(15, 118, 110, 1)',
          borderWidth: 1,
        },
      ],
    };
  }

  private async getSettlementTypeDistribution(): Promise<SettlementTypeDistribution> {
    const settlementQuery = this.db
      .select({
        typeOfNomadism: demographicInformation.typeOfNomadism,
        count: count(),
      })
      .from(skillsSurveySubmissions)
      .leftJoin(
        demographicInformation,
        eq(skillsSurveySubmissions.id, demographicInformation.submissionId),
      )
      .where(sql`${demographicInformation.typeOfNomadism} IS NOT NULL`)
      .groupBy(demographicInformation.typeOfNomadism);

    const results = await settlementQuery;

    const nomadismLabels: Record<string, string> = {
      settled: 'Settled',
      semi_settled: 'Semi-Settled',
      mobile: 'Mobile',
    };

    const labels = Object.keys(nomadismLabels).map(
      (key) => nomadismLabels[key],
    );
    const data = Object.keys(nomadismLabels).map((key) => {
      const count = results.find((r) => r.typeOfNomadism === key)?.count || 0;
      const total = results.reduce((sum, r) => sum + r.count, 0);
      return total > 0 ? Math.round((count / total) * 100) : 0;
    });

    // Add mock categories for now
    const extendedLabels = [...labels, 'Seasonal', 'Transhumant'];
    const extendedData = [...data, 12, 7];

    return {
      labels: extendedLabels,
      datasets: [
        {
          data: extendedData,
          backgroundColor: [
            'rgba(15, 118, 110, 0.9)',
            'rgba(29, 78, 216, 0.9)',
            'rgba(161, 98, 7, 0.9)',
            'rgba(220, 38, 38, 0.9)',
            'rgba(147, 51, 234, 0.9)',
          ],
          borderWidth: 2,
          borderColor: '#1f2937',
        },
      ],
    };
  }

  private async getMonthlyEnrollmentData(): Promise<MonthlyEnrollmentData> {
    // For now, return mock data since we don't have monthly enrollment tracking
    // This could be enhanced with actual enrollment data when available
    return {
      labels: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      datasets: [
        {
          label: 'New Enrollments',
          data: [
            12500, 18300, 15800, 22100, 19500, 8200, 4100, 6800, 14200, 18500,
            16200, 13000,
          ],
          borderColor: 'rgba(15, 118, 110, 0.9)',
          backgroundColor: 'rgba(15, 118, 110, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Program Completions',
          data: [
            8400, 12600, 10200, 14800, 13500, 11200, 9800, 11100, 13400, 15800,
            14900, 12200,
          ],
          borderColor: 'rgba(29, 78, 216, 0.9)',
          backgroundColor: 'rgba(29, 78, 216, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }

  private async getStateAnalysis(): Promise<StateAnalysis[]> {
    const stateQuery = this.db
      .select({
        state: basicInformation.state,
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
      .where(
        and(
          sql`${basicInformation.state} IS NOT NULL`,
          sql`${demographicInformation.sex} IS NOT NULL`,
        ),
      )
      .groupBy(basicInformation.state, demographicInformation.sex);

    const results = await stateQuery;

    // Group by state and calculate totals
    const stateData = new Map<string, { male: number; female: number }>();
    results.forEach((result) => {
      if (result.state) {
        const current = stateData.get(result.state) || { male: 0, female: 0 };
        if (result.sex === 'male') {
          current.male += result.count;
        } else if (result.sex === 'female') {
          current.female += result.count;
        }
        stateData.set(result.state, current);
      }
    });

    // Convert to array and add mock data for missing states
    const stateAnalysis: StateAnalysis[] = Array.from(stateData.entries()).map(
      ([state, data]) => {
        const total = data.male + data.female; // Scale up for population estimate
        const male = data.male;
        const female = data.female;

        // Determine primary barrier and status based on data
        const primaryBarrier =
          total > 300000
            ? 'Migration'
            : total > 200000
              ? 'Distance'
              : 'Economic';
        const status =
          total > 300000 ? 'Critical' : total > 200000 ? 'High' : 'Moderate';

        return {
          state,
          total,
          male,
          female,
          primaryBarrier,
          status,
        };
      },
    );

    // Add mock data for states not in database
    const mockStates = [
      {
        state: 'Sokoto',
        total: 420000,
        male: 220000,
        female: 200000,
        primaryBarrier: 'Migration',
        status: 'Critical',
      },
      {
        state: 'Kebbi',
        total: 380000,
        male: 195000,
        female: 185000,
        primaryBarrier: 'Distance',
        status: 'High',
      },
      {
        state: 'Zamfara',
        total: 350000,
        male: 180000,
        female: 170000,
        primaryBarrier: 'Security',
        status: 'Critical',
      },
      {
        state: 'Katsina',
        total: 320000,
        male: 165000,
        female: 155000,
        primaryBarrier: 'Economic',
        status: 'High',
      },
      {
        state: 'Kano',
        total: 280000,
        male: 145000,
        female: 135000,
        primaryBarrier: 'Cultural',
        status: 'Moderate',
      },
      {
        state: 'Yobe',
        total: 250000,
        male: 130000,
        female: 120000,
        primaryBarrier: 'Infrastructure',
        status: 'High',
      },
    ];

    // Merge real data with mock data, prioritizing real data
    const allStates = new Map<string, StateAnalysis>();
    mockStates.forEach((state) => allStates.set(state.state, state));
    stateAnalysis.forEach((state) => allStates.set(state.state, state));

    return Array.from(allStates.values());
  }

  private async getEducationalPrograms(): Promise<EducationalProgram[]> {
    // For now, return mock data since we don't have program-specific data
    // This could be enhanced with actual program data when available
    return [
      {
        program: 'Mobile Learning Units',
        beneficiaries: 145000,
        cost: 3200000,
        effectiveness: 78,
      },
      {
        program: 'Seasonal Schools',
        beneficiaries: 89000,
        cost: 2100000,
        effectiveness: 85,
      },
      {
        program: 'Skills Training Centers',
        beneficiaries: 67000,
        cost: 1800000,
        effectiveness: 71,
      },
      {
        program: 'Adult Literacy Programs',
        beneficiaries: 52000,
        cost: 900000,
        effectiveness: 69,
      },
      {
        program: 'Nomadic Education Boarding',
        beneficiaries: 38000,
        cost: 4500000,
        effectiveness: 92,
      },
      {
        program: 'Community Learning Centers',
        beneficiaries: 94000,
        cost: 1500000,
        effectiveness: 73,
      },
    ];
  }

  private async getNomadicLearners(): Promise<NomadicLearner[]> {
    const learnersQuery = this.db
      .select({
        id: skillsSurveySubmissions.id,
        firstName: demographicInformation.firstName,
        lastName: demographicInformation.lastName,
        ageRange: demographicInformation.ageRange,
        sex: demographicInformation.sex,
        state: basicInformation.state,
        localGovernmentArea: basicInformation.localGovernmentArea,
        typeOfNomadism: demographicInformation.typeOfNomadism,
        isComplete: skillsSurveySubmissions.isComplete,
        confidenceLevel: currentSkills.confidenceLevel,
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
        currentSkills,
        eq(skillsSurveySubmissions.id, currentSkills.submissionId),
      )
      .limit(100); // Limit for performance

    const results = await learnersQuery;

    return results.map((result, index) => {
      const name = `${result.firstName || 'Unknown'} ${result.lastName || 'Learner'}`;
      const age = this.extractAgeFromRange(result.ageRange);
      const gender =
        result.sex === 'male'
          ? 'Male'
          : result.sex === 'female'
            ? 'Female'
            : 'Unknown';
      const settlementType = this.mapNomadismType(result.typeOfNomadism);
      const primaryBarrier = this.determinePrimaryBarrier(result);
      const programStatus = result.isComplete ? 'Enrolled' : 'Pending';
      const participationLevel = this.determineParticipationLevel(
        result.confidenceLevel,
      );

      return {
        id: result.id,
        learnerId: `NL${String(index + 1).padStart(3, '0')}`,
        name,
        age,
        gender,
        state: result.state || 'Unknown',
        lga: result.localGovernmentArea || 'Unknown',
        settlementType,
        primaryBarrier,
        programStatus,
        participationLevel,
        isFlagged: false, // Will be implemented when flagging system is added
      };
    });
  }

  private extractAgeFromRange(ageRange: string | null): number {
    if (!ageRange) return 18;
    const match = ageRange.match(/(\d+)/);
    return match ? parseInt(match[1]) + 6 : 18; // Add 6 to get approximate age
  }

  private mapNomadismType(typeOfNomadism: string | null): string {
    if (!typeOfNomadism) return 'Unknown';
    const mapping: Record<string, string> = {
      settled: 'Settled',
      semi_settled: 'Semi-Settled',
      mobile: 'Mobile',
    };
    return mapping[typeOfNomadism] || typeOfNomadism;
  }

  private determinePrimaryBarrier(result: any): string {
    // This could be enhanced with actual barrier data from desiredSkills table
    const barriers = [
      'Seasonal Migration',
      'Distance',
      'Economic',
      'Cultural',
      'Infrastructure',
    ];
    return barriers[Math.floor(Math.random() * barriers.length)];
  }

  private determineParticipationLevel(confidenceLevel: string | null): string {
    if (!confidenceLevel) return 'Low';
    const level = parseInt(confidenceLevel);
    if (level >= 4) return 'High';
    if (level >= 3) return 'Moderate';
    return 'Low';
  }
}
