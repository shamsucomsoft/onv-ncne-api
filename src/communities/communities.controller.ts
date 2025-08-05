import { Controller, Get, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get('data')
  @Public() // Make public for now, can be protected later
  async getCommunitiesData() {
    try {
      const data = await this.communitiesService.getCommunitiesData();
      return {
        success: true,
        message: 'Communities data retrieved successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve communities data',
        error: error.message,
      };
    }
  }

  @Get('educational-programs')
  @Public() // Make public for now, can be protected later
  async getEducationalProgramsData() {
    try {
      const data = await this.communitiesService.getEducationalProgramsData();
      return {
        success: true,
        message: 'Educational programs data retrieved successfully',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve educational programs data',
        error: error.message,
      };
    }
  }
} 