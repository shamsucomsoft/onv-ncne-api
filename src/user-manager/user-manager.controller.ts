import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserManagerService } from './user-manager.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';

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
  getAllUsers() {
    return this.userManagerService.getAllUsers();
  }

  @Get('users/:id')
  @Permissions('users:read')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userManagerService.getUserById(id);
  }

  @Patch('users/:id')
  @Permissions('users:update')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userManagerService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Permissions('users:delete')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userManagerService.deleteUser(id);
  }

  // Role Routes
  @Post('roles')
  @Permissions('roles:create')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.userManagerService.createRole(createRoleDto);
  }

  @Get('roles')
  @Permissions('roles:read')
  getAllRoles() {
    return this.userManagerService.getAllRoles();
  }

  @Get('roles/:id')
  @Permissions('roles:read')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.userManagerService.getRoleById(id);
  }

  @Patch('roles/:id')
  @Permissions('roles:update')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.userManagerService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @Permissions('roles:delete')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.userManagerService.deleteRole(id);
  }
}
