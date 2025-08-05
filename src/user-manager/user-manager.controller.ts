import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import {
  AcceptInvitationDto,
  CreateUserDto,
  InviteUserDto,
  UpdateUserDto,
} from './dto/user.dto';
import { PaginationQueryDto } from './dto/pagination.dto';
import { UserManagerService } from './user-manager.service';

@Controller('user-manager')
@UseGuards(PermissionsGuard)
export class UserManagerController {
  constructor(private readonly userManagerService: UserManagerService) {}

  // User Routes
  @Post('users')
  @Permissions('users:create')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userManagerService.createUser(createUserDto);
  }

  @Get('users')
  @Permissions('users:read')
  getAllUsers(@Query() paginationQuery: PaginationQueryDto) {
    return this.userManagerService.getAllUsers(paginationQuery);
  }

  @Get('users/:id')
  @Permissions('users:read')
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagerService.getUserById(id);
  }

  @Patch('users/:id')
  @Permissions('users:update')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userManagerService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Permissions('users:delete')
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagerService.deleteUser(id);
  }

  // Invitation Routes
  @Post('users/invite')
  @Permissions('users:invite')
  inviteUser(@Body() inviteUserDto: InviteUserDto) {
    // For now, we'll use a hardcoded user ID. In real implementation,
    // you'd get this from the JWT token/user context
    const invitedByUserId = 'current-user-id';
    return this.userManagerService.inviteUser(inviteUserDto, invitedByUserId);
  }

  @Delete('users/:id/revoke-invitation')
  @Permissions('users:invite')
  revokeInvitation(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagerService.revokeInvitation(id);
  }

  @Post('users/accept-invitation')
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.userManagerService.acceptInvitation(acceptInvitationDto);
  }

  // Role Routes
  @Post('roles')
  @Permissions('roles:create')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.userManagerService.createRole(createRoleDto);
  }

  @Get('roles')
  @Permissions('roles:read')
  getAllRoles(@Query() paginationQuery: PaginationQueryDto) {
    return this.userManagerService.getAllRoles(paginationQuery);
  }

  @Get('roles/:id')
  @Permissions('roles:read')
  getRoleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagerService.getRoleById(id);
  }

  @Patch('roles/:id')
  @Permissions('roles:update')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.userManagerService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @Permissions('roles:delete')
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.userManagerService.deleteRole(id);
  }
}
