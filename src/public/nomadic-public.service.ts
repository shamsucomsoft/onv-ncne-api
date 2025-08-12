import { Injectable, Inject } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import {
  basicInformation,
  demographicInformation,
  skillsSurveySubmissions,
  desiredSkills,
  currentSkills,
  perceptionOfSkills,
  communities,
} from '../drizzle/schema';
import { DRIZZLE_ORM, DrizzleORM } from '../drizzle/drizzle.module';

@Injectable()
export class NomadicPublicService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleORM) {}

  async getSummary() {
    const [submissions, completed, states, comms] = await Promise.all([
      this.db.select({ count: count() }).from(skillsSurveySubmissions),
      this.db
        .select({ count: count() })
        .from(skillsSurveySubmissions)
        .where(eq(skillsSurveySubmissions.isComplete, true)),
      this.db
        .select({ count: sql<number>`COUNT(DISTINCT ${basicInformation.state})` })
        .from(basicInformation),
      this.db.select({ count: count() }).from(communities),
    ]);

    return {
      submissions: submissions[0]?.count || 0,
      completed: completed[0]?.count || 0,
      states: states[0]?.count || 0,
      communities: comms[0]?.count || 0,
    };
  }

  async getDemographics() {
    const [gender, ageRanges, nomadism, education, occupations] = await Promise.all([
      this.db
        .select({ sex: demographicInformation.sex, count: count() })
        .from(demographicInformation)
        .groupBy(demographicInformation.sex),

      this.db
        .select({ ageRange: demographicInformation.ageRange, count: count() })
        .from(demographicInformation)
        .groupBy(demographicInformation.ageRange),

      this.db
        .select({ type: demographicInformation.typeOfNomadism, count: count() })
        .from(demographicInformation)
        .groupBy(demographicInformation.typeOfNomadism),

      this.db
        .select({ level: demographicInformation.levelOfEducation, count: count() })
        .from(demographicInformation)
        .groupBy(demographicInformation.levelOfEducation),

      this.getOccupationCounts(),
    ]);

    const res = { gender, ageRanges, nomadism, education, occupations };
    console.log(res);
    return res;
  }

  private async getOccupationCounts(): Promise<Array<{ occupation: string; count: number }>> {
    const fields = [
      'occupationHerding',
      'occupationFarming',
      'occupationFishing',
      'occupationTrading',
      'occupationArtisan',
      'occupationOthers',
    ];
    const results: Array<{ occupation: string; count: number }> = [];
    for (const field of fields) {
      const r = await this.db
        .select({ count: sql<number>`COUNT(CASE WHEN ${demographicInformation[field]} = true THEN 1 END)` })
        .from(demographicInformation)
      results.push({ occupation: field.replace('occupation', '').replace(/([A-Z])/g, ' $1').trim(), count: r[0]?.count || 0 });
    }
    return results;
  }

  async getSkills() {
    const [mostPreferred, confidenceLevels, learningMethod] = await Promise.all([
      this.db
        .select({ skill: desiredSkills.mostPreferredSkill, count: count() })
        .from(desiredSkills)
        .groupBy(desiredSkills.mostPreferredSkill)
        .orderBy(desc(count()))
        .limit(10),

      this.db
        .select({ level: currentSkills.confidenceLevel, count: count() })
        .from(currentSkills)
        .groupBy(currentSkills.confidenceLevel),

      this.db
        .select({ value: desiredSkills.learningMethod, count: count() })
        .from(desiredSkills)
        .groupBy(desiredSkills.learningMethod),
    ]);

    return { mostPreferred, confidenceLevels, learningMethod };
  }

  async getBarriers() {
    const fields = [
      'barrierFinancialCost',
      'barrierTimeConstraint',
      'barrierLackOfInformation',
      'barrierInaccessibility',
      'barrierInsecurity',
      'barrierHealthChallenges',
      'barrierOthers',
    ];
    const totalRes = await this.db.select({ count: count() }).from(skillsSurveySubmissions);
    const total = totalRes[0]?.count || 1;
    const data: Array<{ barrier: string; count: number; percentage: number }> = [];
    for (const f of fields) {
      const r = await this.db
        .select({ count: sql<number>`COUNT(CASE WHEN ${desiredSkills[f]} = true THEN 1 END)` })
        .from(skillsSurveySubmissions)
        .leftJoin(basicInformation, eq(skillsSurveySubmissions.id, basicInformation.submissionId))
        .leftJoin(desiredSkills, eq(skillsSurveySubmissions.id, desiredSkills.submissionId));
      const countValue = r[0]?.count || 0;
      if (countValue > 0) data.push({ barrier: f.replace('barrier', '').replace(/([A-Z])/g, ' $1').trim(), count: countValue, percentage: Math.round((countValue / total) * 100) });
    }
    return data.sort((a, b) => b.count - a.count);
  }
}


