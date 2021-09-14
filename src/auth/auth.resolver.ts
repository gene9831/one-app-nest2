import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard, AuthLocalGuard } from 'src/guards';
import { AuthService } from './auth.service';
import { ICurrentUser } from './interfaces';
import { AuthResult } from './models';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResult)
  @UseGuards(AuthLocalGuard)
  async login(
    @Args('username') _u: string,
    @Args('password') _p: string,
    @CurrentUser() user: ICurrentUser,
  ): Promise<AuthResult> {
    return await this.authService.jwtSign(user);
  }

  @Mutation(() => AuthResult, { description: `Roles: ${Role.User}` })
  @Roles(Role.User)
  @UseGuards(AuthJwtGuard)
  async auth(@CurrentUser() user: ICurrentUser): Promise<AuthResult> {
    return await this.authService.jwtSign(user);
  }
}
