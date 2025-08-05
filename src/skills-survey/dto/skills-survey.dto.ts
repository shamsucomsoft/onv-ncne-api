import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BasicInformationDto {
  @IsDateString()
  @IsOptional()
  dateOfSurvey?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  localGovernmentArea?: string;

  @IsString()
  @IsOptional()
  nameOfCommunity?: string;

  @IsEnum([
    'north-west',
    'north-east',
    'north-central',
    'south-east',
    'south-west',
    'south-south',
  ])
  @IsOptional()
  zone?:
    | 'north-west'
    | 'north-east'
    | 'north-central'
    | 'south-east'
    | 'south-west'
    | 'south-south';

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class DemographicInformationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(['male', 'female'])
  @IsOptional()
  sex?: 'male' | 'female';

  @IsEnum(['16-20', '21-25', '26-30', '31-35', '36_and_above'])
  @IsOptional()
  ageRange?: '16-20' | '21-25' | '26-30' | '31-35' | '36_and_above';

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum([
    'quranic',
    'adult_literacy',
    'fslc',
    'jssce',
    'ssce',
    'aissce',
    'tertiary',
    'non_literate',
  ])
  @IsOptional()
  levelOfEducation?: string;

  @IsEnum(['settled', 'semi_settled', 'mobile'])
  @IsOptional()
  typeOfNomadism?: 'settled' | 'semi_settled' | 'mobile';

  @IsBoolean()
  @IsOptional()
  occupationHerding?: boolean;

  @IsBoolean()
  @IsOptional()
  occupationFarming?: boolean;

  @IsBoolean()
  @IsOptional()
  occupationFishing?: boolean;

  @IsBoolean()
  @IsOptional()
  occupationTrading?: boolean;

  @IsBoolean()
  @IsOptional()
  occupationArtisan?: boolean;

  @IsBoolean()
  @IsOptional()
  occupationOthers?: boolean;

  @IsString()
  @IsOptional()
  facialCaptureFilePath?: string;

  @IsString()
  @IsOptional()
  thumbPrintFilePath?: string;
}

export class CurrentSkillsDto {
  @IsEnum(['yes', 'no'])
  @IsOptional()
  hasSkills?: 'yes' | 'no';

  @IsString()
  @IsOptional()
  skillsDescription?: string;

  @IsEnum(['1', '2', '3', '4', '5'])
  @IsOptional()
  confidenceLevel?: '1' | '2' | '3' | '4' | '5';

  @IsString()
  @IsOptional()
  reasonForNoSkills?: string;
}

export class SkillsNeedDto {
  @IsEnum(['yes', 'no'])
  @IsOptional()
  wantTraining?: 'yes' | 'no';

  @IsString()
  @IsOptional()
  skillsToLearn?: string;

  @IsEnum(['1', '2', '3', '4', '5'])
  @IsOptional()
  skillsRelevance?: '1' | '2' | '3' | '4' | '5';
}

export class DesiredSkillsDto {
  @IsString()
  @IsOptional()
  communitySkillsNeeded?: string;

  // Interest checkboxes
  @IsBoolean()
  @IsOptional()
  interestedLivestockDairyBeef?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedLivestockSmallRuminants?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedLivestockFeeds?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedPoultry?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedRabbitary?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedFishProduction?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedSnailery?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedBeeKeeping?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedCropProduction?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedIrrigation?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedGardening?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedIct?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedPhoneRepairs?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedFashionDesign?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedKnitting?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedHairDressing?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedBeadsRaffia?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedShoeBagMaking?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedAutoMechanic?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedCarpentry?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedMasonry?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedPomadeSoapMaking?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedPotteryCeramics?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedSolarPower?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedWelding?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedCatering?: boolean;

  @IsBoolean()
  @IsOptional()
  interestedOthers?: boolean;

  @IsEnum([
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
  ])
  @IsOptional()
  mostPreferredSkill?: string;

  @IsEnum(['formal_training', 'informal_training', 'apprenticeship', 'others'])
  @IsOptional()
  learningMethod?: string;

  @IsEnum([
    'vocational_centres',
    'local_centres',
    'community_programmes',
    'apprenticeship_workshops',
    'none',
  ])
  @IsOptional()
  availableResources?: string;

  @IsEnum(['morning', 'afternoon', 'evening'])
  @IsOptional()
  preferredLearningTime?: 'morning' | 'afternoon' | 'evening';

  // Barriers checkboxes
  @IsBoolean()
  @IsOptional()
  barrierFinancialCost?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierTimeConstraint?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierLackOfInformation?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierInaccessibility?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierInsecurity?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierHealthChallenges?: boolean;

  @IsBoolean()
  @IsOptional()
  barrierOthers?: boolean;

  @IsEnum(['yes', 'no'])
  @IsOptional()
  availableForExternalTraining?: 'yes' | 'no';

  @IsString()
  @IsOptional()
  externalTrainingTimeline?: string;
}

export class PerceptionOfSkillsDto {
  @IsEnum(['1', '2', '3', '4', '5'])
  @IsOptional()
  skillsImportanceForDevelopment?: '1' | '2' | '3' | '4' | '5';

  @IsEnum(['1', '2', '3', '4', '5'])
  @IsOptional()
  communitySkillsSupportLevel?: '1' | '2' | '3' | '4' | '5';

  @IsEnum(['1', '2', '3', '4', '5'])
  @IsOptional()
  skillsEffectiveForFinancialSecurity?: '1' | '2' | '3' | '4' | '5';

  @IsString()
  @IsOptional()
  experiencesWithSkillsAcquisition?: string;

  @IsString()
  @IsOptional()
  suggestionsForImprovement?: string;
}

export class CreateSkillsSurveyDto {
  @ValidateNested()
  @Type(() => BasicInformationDto)
  @IsOptional()
  basicInformation?: BasicInformationDto;

  @ValidateNested()
  @Type(() => DemographicInformationDto)
  @IsNotEmpty()
  demographicInformation: DemographicInformationDto;

  @ValidateNested()
  @Type(() => CurrentSkillsDto)
  @IsOptional()
  currentSkills?: CurrentSkillsDto;

  @ValidateNested()
  @Type(() => SkillsNeedDto)
  @IsOptional()
  skillsNeed?: SkillsNeedDto;

  @ValidateNested()
  @Type(() => DesiredSkillsDto)
  @IsOptional()
  desiredSkills?: DesiredSkillsDto;

  @ValidateNested()
  @Type(() => PerceptionOfSkillsDto)
  @IsOptional()
  perceptionOfSkills?: PerceptionOfSkillsDto;
}

export class UpdateSkillsSurveyDto {
  @ValidateNested()
  @Type(() => BasicInformationDto)
  @IsOptional()
  basicInformation?: BasicInformationDto;

  @ValidateNested()
  @Type(() => DemographicInformationDto)
  @IsOptional()
  demographicInformation?: DemographicInformationDto;

  @ValidateNested()
  @Type(() => CurrentSkillsDto)
  @IsOptional()
  currentSkills?: CurrentSkillsDto;

  @ValidateNested()
  @Type(() => SkillsNeedDto)
  @IsOptional()
  skillsNeed?: SkillsNeedDto;

  @ValidateNested()
  @Type(() => DesiredSkillsDto)
  @IsOptional()
  desiredSkills?: DesiredSkillsDto;

  @ValidateNested()
  @Type(() => PerceptionOfSkillsDto)
  @IsOptional()
  perceptionOfSkills?: PerceptionOfSkillsDto;

  @IsBoolean()
  @IsOptional()
  isComplete?: boolean;
}

export class SkillsSurveyQueryDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsEnum(['settled', 'semi_settled', 'mobile'])
  typeOfNomadism?: string;

  @IsOptional()
  @IsEnum(['male', 'female'])
  sex?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
