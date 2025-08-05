import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import {
  CreateSkillsSurveyDto,
  UpdateSkillsSurveyDto,
  SkillsSurveyQueryDto,
} from './dto/skills-survey.dto';
import { SkillsSurveyService } from './skills-survey.service';

@Controller('skills-survey')
@UseGuards(PermissionsGuard)
export class SkillsSurveyController {
  constructor(private readonly skillsSurveyService: SkillsSurveyService) {}

  @Post()
  @Permissions('collections:create')
  createSurvey(@Body() createSurveyDto: CreateSkillsSurveyDto, @Request() req) {
    return this.skillsSurveyService.createSurvey(createSurveyDto, req.user?.id);
  }

  @Get()
  @Permissions('collections:read')
  getAllSurveys(@Query() query: SkillsSurveyQueryDto) {
    return this.skillsSurveyService.getAllSurveys(query);
  }

  @Get('stats')
  @Permissions('collections:read')
  getSurveyStats() {
    return this.skillsSurveyService.getSurveyStats();
  }

  @Get(':id')
  @Permissions('collections:read')
  getSurveyById(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsSurveyService.getSurveyById(id);
  }

  @Patch(':id')
  @Permissions('collections:update')
  updateSurvey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSurveyDto: UpdateSkillsSurveyDto,
    @Request() req,
  ) {
    return this.skillsSurveyService.updateSurvey(
      id,
      updateSurveyDto,
      req.user?.id,
    );
  }

  @Delete(':id')
  @Permissions('collections:delete')
  deleteSurvey(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillsSurveyService.deleteSurvey(id);
  }
}
