import { IsString, IsNotEmpty, IsEnum, IsArray } from 'class-validator';
import { RoleTypeEnum } from 'src/drizzle/schema';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissions: string[];

  @IsEnum(RoleTypeEnum)
  @IsNotEmpty()
  type: RoleTypeEnum;
}

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissions: string[];

  @IsEnum(RoleTypeEnum)
  @IsNotEmpty()
  type: RoleTypeEnum;
}
