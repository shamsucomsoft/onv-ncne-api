import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Module({
  imports: [DrizzleModule],
  controllers: [CommunitiesController],
  providers: [CommunitiesService, PermissionsGuard],
  exports: [CommunitiesService],
})
export class CommunitiesModule {} 