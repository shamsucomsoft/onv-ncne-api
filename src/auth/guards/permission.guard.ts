import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../auth.controller';
import { roles } from '../../drizzle/schema';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!handlerPermissions) {
      return true;
    }
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);
    if (!user) {
      return false;
    }
    return handlerPermissions.some((permission) =>
      user.role?.permissions.some((p) => p === permission),
    );
  }
}
