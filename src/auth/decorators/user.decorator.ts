import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { roles, users } from 'src/drizzle/schema';

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export type UserDecoratorType = Omit<typeof users.$inferSelect, 'password'> & {
  role: typeof roles.$inferSelect | null;
};
