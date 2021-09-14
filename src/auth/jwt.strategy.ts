import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ICurrentUser } from './interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  // passport-jwt 会验证headers里面的Authorization字段, 验证成功后会解密成payload对象
  // validate 参数来源于 https://github.com/mikenicholson/passport-jwt/blob/v4.0.0/lib/strategy.js#L123
  async validate(
    payload: ICurrentUser & { iat: number; exp: number },
  ): Promise<ICurrentUser> {
    // 返回值会赋值给req.user，使用装饰器获取req.user
    const { exp, iat, ...others } = payload;
    return others;
  }
}
