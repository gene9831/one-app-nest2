import { TokenCache } from '@azure/msal-node';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
import { Account } from './models';
import { MsalService } from './msal.service';

@Resolver()
@Roles(Role.Admin)
@UseGuards(AuthJwtGuard)
export class MsalResolver {
  constructor(private readonly msalService: MsalService) {}

  @Mutation(() => String, { description: `Roles: ${Role.Admin}` })
  async generateAuthCodeUrl(): Promise<string> {
    return await this.msalService.getAuthCodeUrl();
  }

  @Query(() => [Account], { description: `Roles: ${Role.Admin}` })
  async accounts(): Promise<Account[]> {
    return await this.msalService.getTokenCache().getAllAccounts();
  }

  @Query(() => Account, { description: `Roles: ${Role.Admin}` })
  async account(
    @Args('localAccountId') localAccountId: string,
    tokenCache?: TokenCache,
  ): Promise<Account> {
    const accout = await (
      tokenCache || this.msalService.getTokenCache()
    ).getAccountByLocalId(localAccountId);

    if (!accout) {
      throw new NotFoundException();
    }

    return accout;
  }

  @Mutation(() => Boolean, { description: `Roles: ${Role.Admin}` })
  async removeAccount(
    @Args('localAccountId') localAccountId: string,
  ): Promise<boolean> {
    const tokenCache = this.msalService.getTokenCache();
    const account = await this.account(localAccountId, tokenCache);

    await tokenCache.removeAccount(account);
    return true;
  }
}
