import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';
import { MailHandlerModule } from './mail-handler/mail-handler.module';
import { UserManagerModule } from './user-manager/user-manager.module';
import { SkillsSurveyModule } from './skills-survey/skills-survey.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommunitiesModule } from './communities/communities.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StorageModule } from './storage/storage.module';
import { NomadicPublicModule } from './public/nomadic-public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DrizzleModule,
    AuthModule,
    SyncModule,
    MailHandlerModule,
    UserManagerModule,
    SkillsSurveyModule,
    DashboardModule,
    CommunitiesModule,
    StorageModule,
    NomadicPublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
