import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  nameOfCommunity: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  localGovernmentArea: string;

  @IsEnum([
    'north-west',
    'north-east',
    'north-central',
    'south-east',
    'south-west',
    'south-south',
  ])
  zone:
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


