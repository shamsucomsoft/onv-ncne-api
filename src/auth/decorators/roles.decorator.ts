import { SetMetadata } from '@nestjs/common';
import { RoleTypeEnum } from 'src/drizzle/schema';

export const ROLES_KEY = 'roles';
export const Roles = (role: RoleTypeEnum[]) => SetMetadata(ROLES_KEY, role);
