import { Module } from '@nestjs/common';
import { SkillsSurveyController } from './skills-survey.controller';
import { SkillsSurveyService } from './skills-survey.service';

@Module({
  controllers: [SkillsSurveyController],
  providers: [SkillsSurveyService],
})
export class SkillsSurveyModule {}