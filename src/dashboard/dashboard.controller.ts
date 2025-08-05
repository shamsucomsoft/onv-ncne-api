import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Public() // Make public for now, can be protected later
  async getDashboardStats(@Query() filters: DashboardFiltersDto) {
    try {
      const stats = await this.dashboardService.getDashboardStats(filters);
      return {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: error.message,
      };
    }
  }

  @Get('insights')
  @Public() // Make public for now, can be protected later
  async getDashboardInsights(@Query() filters: DashboardFiltersDto) {
    try {
      const insights = await this.dashboardService.getDashboardInsights(filters);
      return {
        success: true,
        message: 'Dashboard insights retrieved successfully',
        data: insights,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve dashboard insights',
        error: error.message,
      };
    }
  }

  @Get('states')
  @Public() // Make public for now, can be protected later
  async getStatesList(@Query() filters: DashboardFiltersDto) {
    try {
      const stats = await this.dashboardService.getDashboardStats(filters);
      const states = [
        { state: 'All States', code: 'ALL' },
        ...stats.stateStats.map(state => ({
          state: state.state,
          code: state.code,
        }))
      ];
      
      return {
        success: true,
        message: 'States list retrieved successfully',
        data: states,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve states list',
        error: error.message,
      };
    }
  }
}