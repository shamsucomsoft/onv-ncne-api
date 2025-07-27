import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schema';
import { roles, users } from 'src/drizzle/schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { eq } from 'drizzle-orm';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserManagerService {
  constructor(@Inject('DRIZZLE_ORM') private db: NodePgDatabase<typeof schema>) {}

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
    return newUser[0];
  }

  async getAllUsers() {
    return this.db.query.users.findMany({
      with: {
        role: true,
      },
    });
  }

  async getUserById(id: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
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

    return updatedUser[0];
  }

  async deleteUser(id: number) {
    await this.getUserById(id);
    await this.db.delete(users).where(eq(users.id, id));
    return { message: 'User deleted successfully' };
  }

  // Role Methods
  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.db.query.roles.findFirst({
      where: eq(roles.name, createRoleDto.name),
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const newRole = await this.db.insert(roles).values(createRoleDto).returning();
    return newRole[0];
  }

  async getAllRoles() {
    return this.db.query.roles.findMany();
  }

  async getRoleById(id: number) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, id),
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    await this.getRoleById(id);
    const updatedRole = await this.db
      .update(roles)
      .set(updateRoleDto)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole[0];
  }

  async deleteRole(id: number) {
    const role = await this.getRoleById(id);

    const usersWithRole = await this.db.query.users.findFirst({
      where: eq(users.roleId, role.id),
    });

    if (usersWithRole) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    await this.db.delete(roles).where(eq(roles.id, id));
    return { message: 'Role deleted successfully' };
  }
}
