import {
  Injectable,
  OnModuleInit,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';
import { DRIZZLE_ORM, DrizzleORM } from 'src/drizzle/drizzle.module';
import { users } from 'src/drizzle/schema';
@Injectable()
export class PowerSyncService implements OnModuleInit {
  private readonly logger = new Logger(PowerSyncService.name);
  private privateKey: any = null;
  private publicKey: Record<string, any> | null = null;
  private kid: string | null = null;
  private alg = 'RS256';

  constructor(
    private configService: ConfigService,
    @Inject(DRIZZLE_ORM)
    private readonly db: DrizzleORM,
  ) {}

  async onModuleInit() {
    // Dynamically import jose ESM module
    await this.ensureKeys();
  }

  private async generateKeyPair() {
    this.kid = `powersync-${crypto.randomBytes(5).toString('hex')}`;

    const { publicKey, privateKey } = await jose.generateKeyPair(this.alg, {
      extractable: true,
    });

    const privateJwk = {
      ...(await jose.exportJWK(privateKey)),
      alg: this.alg,
      kid: this.kid,
    };
    const publicJwk = {
      ...(await jose.exportJWK(publicKey)),
      alg: this.alg,
      kid: this.kid,
    };

    const privateBase64 = Buffer.from(JSON.stringify(privateJwk)).toString(
      'base64',
    );
    const publicBase64 = Buffer.from(JSON.stringify(publicJwk)).toString(
      'base64',
    );

    return { privateBase64, publicBase64 };
  }

  private async ensureKeys() {
    if (this.privateKey) {
      return;
    }

    let privateKeyBase64 = this.configService
      .get<string>('POWERSYNC_PRIVATE_KEY')
      ?.trim();
    let publicKeyBase64 = this.configService
      .get<string>('POWERSYNC_PUBLIC_KEY')
      ?.trim();

    if (!privateKeyBase64) {
      this.logger.warn(
        'Private key not found in environment variables. Generating a temporary key pair for development.',
      );
      const { privateBase64, publicBase64 } = await this.generateKeyPair();
      privateKeyBase64 = privateBase64;
      publicKeyBase64 = publicBase64;
      console.log('Private Key:', privateKeyBase64);
      console.log('Public Key:', publicKeyBase64);
    }

    const decodedPrivateKey = Buffer.from(privateKeyBase64, 'base64').toString(
      'utf-8',
    );
    const privateJwk = JSON.parse(decodedPrivateKey);
    this.privateKey = await jose.importJWK(privateJwk);
    this.kid = privateJwk.kid;
    this.alg = privateJwk.alg;

    const decodedPublicKey = Buffer.from(publicKeyBase64!, 'base64').toString(
      'utf-8',
    );
    this.publicKey = JSON.parse(decodedPublicKey);
  }

  async generateToken(
    userId: string,
  ): Promise<{ token: string; powersync_url: string }> {
    const powersyncUrl = this.configService.get<string>('POWERSYNC_URL');
    const jwtIssuer = this.configService.get<string>('JWT_ISSUER');

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: userId,
      name: user.fullName,
      email: user.email,
      role: user.role,
      type: user.role?.type,
      permissions: user.role?.permissions,
      agency: 'nmec',
    };

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({
        alg: this.alg,
        kid: this.kid!,
      })
      .setSubject(userId)
      .setIssuedAt()
      .setIssuer(jwtIssuer!)
      .setAudience(powersyncUrl!)
      .setExpirationTime('15m')
      .sign(this.privateKey!);

    return {
      token,
      powersync_url: powersyncUrl!,
    };
  }

  getJwks() {
    return {
      keys: [this.publicKey],
    };
  }
}
