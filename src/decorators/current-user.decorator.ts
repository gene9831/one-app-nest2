import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().req.user;
    }
    return context.switchToHttp().getRequest().user;
  },
);
