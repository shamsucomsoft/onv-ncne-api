import { Module } from '@nestjs/common';
import { NomadicPublicController } from './nomadic-public.controller';
import { NomadicPublicService } from './nomadic-public.service';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [NomadicPublicController],
  providers: [NomadicPublicService],
})
export class NomadicPublicModule {}


