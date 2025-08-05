import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schema';
import { roles, users, UserStatusEnum } from 'src/drizzle/schema';
import {
  CreateUserDto,
  UpdateUserDto,
  InviteUserDto,
  AcceptInvitationDto,
} from './dto/user.dto';
import { eq, and, count } from 'drizzle-orm';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import {
  PaginationQueryDto,
  PaginationMetaDto,
  PaginatedResponseDto,
} from './dto/pagination.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { responder } from 'src/utils/response.utils';

@Injectable()
export class UserManagerService {
  constructor(
    @Inject('DRIZZLE_ORM') private db: NodePgDatabase<typeof schema>,
  ) {}

  // User Methods
  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, createUserDto.email),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, createUserDto.roleId),
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.db
      .insert(users)
      .values({ ...createUserDto, password: hashedPassword })
      .returning();
    return responder(201, newUser[0], 'User created successfully');
  }

  async getAllUsers(paginationQuery: PaginationQueryDto) {
    // Get total count for pagination metadata
    const [totalResult] = await this.db.select({ count: count() }).from(users);
    const totalItems = totalResult.count;

    // Get paginated users
    const userData = await this.db.query.users.findMany({
      with: {
        role: true,
      },
      limit: paginationQuery.take,
      offset: paginationQuery.skip,
    });

    const meta = new PaginationMetaDto(paginationQuery, totalItems);
    const paginatedData = new PaginatedResponseDto(userData, meta);
    return responder(200, paginatedData, 'Users fetched successfully');
  }

  async getUserById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return responder(200, user, 'User fetched successfully');
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    await this.getUserById(id);

    if (updateUserDto.roleId) {
      const role = await this.db.query.roles.findFirst({
        where: eq(roles.id, updateUserDto.roleId),
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.db
      .update(users)
      .set(updateUserDto)
      .where(eq(users.id, id))
      .returning();

    return responder(200, updatedUser[0], 'User updated successfully');
  }

  async deleteUser(id: string) {
    await this.getUserById(id);
    await this.db.delete(users).where(eq(users.id, id));
    return responder(200, null, 'User deleted successfully');
  }

  // Invitation Methods
  async inviteUser(inviteUserDto: InviteUserDto, invitedByUserId: string) {
    const existingUser = await this.db.query.users.findFirst({
      where: eq(users.email, inviteUserDto.email),
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, inviteUserDto.roleId),
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const invitationToken = uuidv4();
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7); // 7 days expiry

    const newUser = await this.db
      .insert(users)
      .values({
        ...inviteUserDto,
        status: UserStatusEnum.INVITED,
        invitationToken,
        invitationExpiresAt,
        invitedBy: invitedByUserId,
      })
      .returning();

    return responder(201, newUser[0], 'User invited successfully');
  }

  async revokeInvitation(userId: string) {
    const user = (await this.getUserById(userId)).data;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatusEnum.INVITED) {
      throw new BadRequestException(
        'Can only revoke invitations for invited users',
      );
    }

    await this.db.delete(users).where(eq(users.id, userId));
    return responder(200, null, 'Invitation revoked successfully');
  }

  async acceptInvitation(acceptInvitationDto: AcceptInvitationDto) {
    const user = await this.db.query.users.findFirst({
      where: and(
        eq(users.invitationToken, acceptInvitationDto.invitationToken),
        eq(users.status, UserStatusEnum.INVITED),
      ),
    });

    if (!user) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    const hashedPassword = await bcrypt.hash(acceptInvitationDto.password, 10);

    const updatedUser = await this.db
      .update(users)
      .set({
        password: hashedPassword,
        status: UserStatusEnum.ACTIVE,
        invitationToken: null,
        invitationExpiresAt: null,
        isEmailVerified: true,
      })
      .where(eq(users.id, user.id))
      .returning();

    return responder(200, updatedUser[0], 'Invitation accepted successfully');
  }

  // Role Methods
  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.db.query.roles.findFirst({
      where: eq(roles.name, createRoleDto.name),
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const newRole = await this.db
      .insert(roles)
      .values(createRoleDto)
      .returning();
    return responder(201, newRole[0], 'Role created successfully');
  }

  async getAllRoles(paginationQuery: PaginationQueryDto) {
    // Get total count for pagination metadata
    const [totalResult] = await this.db.select({ count: count() }).from(roles);
    const totalItems = totalResult.count;

    // Get paginated roles
    const roleData = await this.db.query.roles.findMany({
      limit: paginationQuery.take,
      offset: paginationQuery.skip,
    });

    const meta = new PaginationMetaDto(paginationQuery, totalItems);
    const paginatedData = new PaginatedResponseDto(roleData, meta);
    return responder(200, paginatedData, 'Roles fetched successfully');
  }

  async getRoleById(id: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return responder(200, role, 'Role fetched successfully');
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    await this.getRoleById(id);
    const updatedRole = await this.db
      .update(roles)
      .set(updateRoleDto)
      .where(eq(roles.id, id))
      .returning();
    return responder(200, updatedRole[0], 'Role updated successfully');
  }

  async deleteRole(id: string) {
    const role = (await this.getRoleById(id)).data;

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const usersWithRole = await this.db.query.users.findFirst({
      where: eq(users.roleId, role.id),
    });

    if (usersWithRole) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    await this.db.delete(roles).where(eq(roles.id, id));
    return responder(200, null, 'Role deleted successfully');
  }
}
