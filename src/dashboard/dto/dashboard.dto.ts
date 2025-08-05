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
