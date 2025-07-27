import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { users } from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { responder } from 'src/utils/response.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE_ORM) private db: DrizzleORM,
  ) {}

  async validateUser(email: string): Promise<typeof users.$inferSelect | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
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
      access_token: this.jwtService.sign(payload),
      user,
    });
  }
}
