import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { roles, users } from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { responder } from 'src/utils/response.utils';
import { permissions } from 'src/utils/permissions.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE_ORM) private db: DrizzleORM,
  ) {
    console.log('Seeding super admin and collector');
    this.seedSuperAdmin();
    this.seedCollector();
  }

  async validateUser(email: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        role: true,
      },
    });
    if (user && user.isEmailVerified) {
      return user;
    }
    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.email, sub: user.id };
    return responder(200, {
      accessToken: this.jwtService.sign(payload),
      user,
    });
  }

  async seedSuperAdmin() {
    let role = await this.db.query.roles.findFirst({
      where: eq(roles.name, 'super_admin'),
    });
    if (role) {
      this.db.update(roles).set({
        permissions: Object.values(permissions.admin).flat(),
        type: 'admin',
      }).where(eq(roles.name, 'super_admin'));
    } else {
    role = await this.db.insert(roles).values({
      name: 'super_admin',
        permissions: Object.values(permissions.admin).flat(),
        type: 'super_admin',
      }).returning();
    }
    const createdUser = await this.db.insert(users).values({
      email: 'superadmin@yopmail.com',
      password: await bcrypt.hash('Superpass', 10),
      fullName: 'Super Admin',
      roleId: role!.id,
      isEmailVerified: true,
    });

    console.log('Super admin seeded');
  }

  async seedCollector() {
    let role = await this.db.query.roles.findFirst({
      where: eq(roles.name, 'collector'),
    }); 
    if (role) {
      this.db.update(roles).set({
        permissions: Object.values(permissions.collector).flat(),
        type: 'collector',
      }).where(eq(roles.name, 'collector'));
    } else {
    role = await this.db.insert(roles).values({
      name: 'collector',
      permissions: Object.values(permissions.collector).flat(),
      type: 'collector',
    }).returning();
     
  }

    const collector = await this.db.query.users.findFirst({
      where: eq(users.email, 'collector@yopmail.com'),
    });
    if (collector) {
      return;
    }
    const createdUser = await this.db.insert(users).values({
      email: 'collector@yopmail.com',
      password: await bcrypt.hash('Collectorpass', 10),
      fullName: 'Abu Isah',
        roleId: role!.id,
      isEmailVerified: true,
    });

    console.log('Collector seeded');
  }
}
