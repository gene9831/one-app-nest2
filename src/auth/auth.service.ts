import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ICurrentUser } from './interfaces';
import { AuthResult } from './models';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...others } = user.toJSON();
      return others;
    }
    return null;
  }

  async jwtSign(user: ICurrentUser): Promise<AuthResult> {
    // user可能含有其他未知字段，所以不直接 sign(user)，而是显示的构造一个payload
    const payload = {
      username: user.username,
      _id: user._id,
      roles: user.roles,
    };
    const accessToken = this.jwtService.sign(payload);
    const { exp } = this.jwtService.decode(accessToken) as any;

    return {
      accessToken,
      expiresAt: exp,
    };
  }
}
