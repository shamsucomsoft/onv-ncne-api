import { Controller, Get } from '@nestjs/common';
import { NomadicPublicService } from './nomadic-public.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public/nomadic')
export class NomadicPublicController {
  constructor(private readonly service: NomadicPublicService) {}

  @Get('summary')
  @Public()
  async getSummary() {
    const data = await this.service.getSummary();
    return { success: true, data };
  }

  @Get('demographics')
  @Public()
  async getDemographics() {
    const data = await this.service.getDemographics();
    return { success: true, data };
  }

  @Get('skills')
  @Public()
  async getSkills() {
    const data = await this.service.getSkills();
    return { success: true, data };
  }

  @Get('barriers')
  @Public()
  async getBarriers() {
    const data = await this.service.getBarriers();
    return { success: true, data };
  }
}


