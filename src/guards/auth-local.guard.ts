import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthLocalGuard extends AuthGuard('local') {
  // IAuthGuard 接口没有 getRequest 方法，看起来不能重写，但实际上还是可以的
  // 为了实现纯 graphql 的用户认证，暂时就用这个骚操作吧
  getRequest(context: ExecutionContext) {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const args = gqlContext.getArgs();
      const req = gqlContext.getContext().req;
      // 要放在body对象中的原因 https://github.com/jaredhanson/passport-local/blob/v1.0.0/lib/strategy.js#L71-L72
      req.body.username = args.username;
      req.body.password = args.password;
      // 返回req目的是，LocalStrategy验证成功后会设置req的user属性，从而让user附着在上下文中。
      // 之后用到的 GqlUser 装饰器就要用到
      return req;
    }
    return context.switchToHttp().getRequest();
  }
}
