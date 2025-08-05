import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { roles, RoleTypeEnum, users } from 'src/drizzle/schema';
import { responder } from 'src/utils/response.utils';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UserDecorator } from './decorators/user.decorator';
import { LoginDto } from './dto/login.dto';
import { RoleTypeGuard } from './guards/role-type.guard';
import { PowerSyncService } from './powersync.service';

export type UserWithRole = typeof users.$inferSelect & {
  role: typeof roles.$inferSelect | null;
};

export type RequestWithUser = Request & { user: UserWithRole };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly powerSyncService: PowerSyncService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.service.login(loginDto);
  }

  @UseGuards(RoleTypeGuard)
  @Roles([RoleTypeEnum.COLLECTOR])
  @Get('me/collector')
  getProfile(@UserDecorator() user: UserWithRole) {
    return responder(200, user);
  }

  @UseGuards(RoleTypeGuard)
  @Roles([RoleTypeEnum.ADMIN])
  @Get('me/admin')
  getAdmin(@UserDecorator() user: UserWithRole) {
    return responder(200, user);
  }

  /**
   * JWKS endpoint for PowerSync - serves the public key
   * This endpoint should be accessible without authentication
   */
  @Public()
  @Get('powersync/jwks')
  getPowerSyncJWKS() {
    return this.powerSyncService.getJwks();
  }

  /**
   * Generate PowerSync JWT for authenticated user
   * This endpoint requires authentication
   */
  @Get('powersync/token')
  getPowerSyncToken(@UserDecorator() user: UserWithRole) {
    return this.powerSyncService.generateToken(user.id);
  }
}
