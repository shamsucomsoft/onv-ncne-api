import { Controller, Get, Param, Query } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  // GET /storage/public-url?path=adulted/oosc-surveys/{id}.jpg
  @Get('public-url')
  getPublicUrl(@Query('path') path: string) {
    const url = this.storage.getPublicFileUrl(path);
    return { url };
  }
}


