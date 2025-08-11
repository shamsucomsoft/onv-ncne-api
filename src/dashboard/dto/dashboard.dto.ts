import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class DashboardFiltersDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn([
    'north-west',
    'north-east',
    'north-central',
    'south-east',
    'south-west',
    'south-south',
  ])
  zone?:
    | 'north-west'
    | 'north-east'
    | 'north-central'
    | 'south-east'
    | 'south-west'
    | 'south-south';
}

export interface StateStatsDto {
  state: string;
  code: string;
  nomadicPopulation: number;
  skillsCenters: number;
  skillsTrainingRate: number;
  totalSurveys: number;
  completedSurveys: number;
  zone: string;
}

export interface SkillInterestByGenderDto {
  skill: string;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
}

export interface SkillBarrierDto {
  barrier: string;
  count: number;
  percentage: number;
}

export interface SkillProficiencyDto {
  skill: string;
  noSkills: number;
  basic: number;
  intermediate: number;
  advanced: number;
}

export interface NomadismTypeDto {
  type: string;
  count: number;
  percentage: number;
}

export interface OverallStatsDto {
  totalNomadicPopulation: number;
  totalSurveys: number;
  completedSurveys: number;
  totalCommunities: number;
  skillsCenters: number;
  completionRate: number;
  skillsTrainingRate: number;
  activeCenters: number;
}

export interface TopSkillDto {
  skill: string;
  count: number;
  trend: 'up' | 'down';
  percentage: number;
}

export interface DashboardStatsResponseDto {
  overallStats: OverallStatsDto;
  stateStats: StateStatsDto[];
  skillInterestByGender: SkillInterestByGenderDto[];
  skillBarriers: SkillBarrierDto[];
  skillProficiency: SkillProficiencyDto[];
  nomadismTypes: NomadismTypeDto[];
  topSkills: TopSkillDto[];
  lastUpdated: Date;
}

export interface InsightDto {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'barrier' | 'opportunity' | 'trend' | 'recommendation';
  metrics?: {
    value: number;
    unit: string;
    change?: number;
  };
}

export interface DashboardInsightsResponseDto {
  insights: InsightDto[];
  keyFindings: string[];
  recommendations: string[];
}

// Lite stats strictly derived from schema
export interface DashboardLiteResponseDto {
  overall: {
    submissionsTotal: number;
    submissionsCompleted: number;
    usersTotal: number;
    rolesTotal: number;
    statesCovered: number;
    communitiesCovered: number;
    geoTaggedSubmissions: number;
    biometricCapturesTotal: number;
    phoneNumbersCollected: number;
    emailsCollected: number;
  };
  stateBreakdown: Array<{
    state: string | null;
    zone: string | null;
    submissions: number;
    completed: number;
  }>;
  demographics: {
    gender: Array<{ sex: string | null; count: number }>;
    ageRange: Array<{ ageRange: string | null; count: number }>;
    nomadism: Array<{ typeOfNomadism: string | null; count: number }>;
    education: Array<{ levelOfEducation: string | null; count: number }>;
    occupations: Array<{ occupation: string; count: number }>;
  };
  skills: {
    mostPreferred: Array<{ skill: string | null; count: number }>;
    detailedInterests: Array<{ interest: string; count: number; percentage: number }>;
    wantTraining: Array<{ value: string | null; count: number }>;
    learningMethod: Array<{ value: string | null; count: number }>;
    availableResources: Array<{ value: string | null; count: number }>;
    preferredLearningTime: Array<{ value: string | null; count: number }>;
    hasCurrentSkills: Array<{ value: string | null; count: number }>;
    confidenceLevels: Array<{ level: string | null; count: number }>;
    skillsRelevance: Array<{ level: string | null; count: number }>;
    detailedBarriers: Array<{ barrier: string; count: number; percentage: number }>;
    availableForExternalTraining: Array<{ value: string | null; count: number }>;
    externalTrainingTimeline: number;
  };
  perceptions: {
    skillsImportanceForDevelopment: Array<{ rating: string | null; count: number }>;
    communitySkillsSupportLevel: Array<{ rating: string | null; count: number }>;
    skillsEffectiveForFinancialSecurity: Array<{ rating: string | null; count: number }>;
    improvementSuggestions: number;
  };
  recents: Array<{
    id: string;
    state: string | null;
    community: string | null;
    submittedAt: Date | null;
  }>;
}