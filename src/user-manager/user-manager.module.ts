import { Module } from '@nestjs/common';
import { UserManagerController } from './user-manager.controller';
import { UserManagerService } from './user-manager.service';

@Module({
  controllers: [UserManagerController],
  providers: [UserManagerService],
})
export class UserManagerModule {}
