import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateCommunityDto } from './dto/community.dto';

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

  // List all communities
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('collections:read')
  async listCommunities() {
    return this.communitiesService.listCommunities();
  }

  // Create a community (admin and collectors allowed)
  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('collections:create')
  async createCommunity(@Body() dto: CreateCommunityDto, @Request() req) {
    return this.communitiesService.createCommunity(dto, req.user?.id);
  }
} 