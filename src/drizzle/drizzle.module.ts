import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export const DRIZZLE_ORM = 'DRIZZLE_ORM';
@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_ORM,
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.get<string>('DATABASE_URL'),
        });

        return drizzle(pool, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE_ORM'],
})
export class DrizzleModule {}
export type DrizzleORM = NodePgDatabase<typeof schema>;
