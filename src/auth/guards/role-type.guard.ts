import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../auth.controller';
import { roles } from 'src/drizzle/schema';

@Injectable()
export class RoleTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerRoleTypes = this.reflector.get<
      (typeof roles.$inferSelect)['type'][]
    >('roles', context.getHandler());
    if (!handlerRoleTypes) {
      return true;
    }
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }
    return handlerRoleTypes.some((roleType) => user.role?.type === roleType);
  }
}
