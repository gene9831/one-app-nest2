import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super();
  }

  // validate 就是实现了这个抽象方法 https://github.com/nestjs/passport/blob/8.0.1/lib/passport/passport.strategy.ts#L11
  // validate 参数来源于 https://github.com/jaredhanson/passport-local/blob/v1.0.0/lib/strategy.js#L90
  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);
    // 这里也可以直接返回user，后面的AuthGuard.handleRequest()函数里面会判断user是否为空
    if (!user) {
      throw new UnauthorizedException();
    }
    // user会赋值给req.user
    return user;
  }
}
