import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SyncService } from './sync.service';
import { UserDecorator, UserDecoratorType } from 'src/auth/decorators/user.decorator';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async syncData(
    @Body() body: { transaction: string } | any,
    @UserDecorator() user: UserDecoratorType,
    @UploadedFiles() files: Array<any>,
  ) {
    const transaction = typeof body?.transaction === 'string' ? JSON.parse(body.transaction) : body?.transaction ?? body;
    return this.syncService.handleSync(transaction, user, files || []);
  }
}


