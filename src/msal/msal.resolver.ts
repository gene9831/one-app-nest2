import { TokenCache } from '@azure/msal-node';
import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Account } from './models';
import { MsalService } from './msal.service';

@Resolver()
export class MsalResolver {
  constructor(private readonly msalService: MsalService) {}

  @Query(() => String)
  async authCodeUrl(): Promise<string> {
    return await this.msalService.getAuthCodeUrl();
  }

  @Query(() => [Account])
  async accounts(): Promise<Account[]> {
    return await this.msalService.getTokenCache().getAllAccounts();
  }

  @Query(() => Account)
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

  @Mutation(() => Boolean)
  async removeAccount(
    @Args('localAccountId') localAccountId: string,
  ): Promise<boolean> {
    const tokenCache = this.msalService.getTokenCache();
    const account = await this.account(localAccountId, tokenCache);

    await tokenCache.removeAccount(account);
    return true;
  }
}
