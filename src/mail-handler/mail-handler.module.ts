import { Module } from '@nestjs/common';
import { MailHandlerService } from './mail-handler.service';

@Module({
  providers: [MailHandlerService],
  exports: [MailHandlerService],
})
export class MailHandlerModule {}
