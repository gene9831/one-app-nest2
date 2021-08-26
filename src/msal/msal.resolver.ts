import { TokenCache } from '@azure/msal-node';
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
    // TODO 用过滤器过滤 httpCode 为 200 且响应内容为空 (null 或者 undefined) 的 Response，然后响应 404
    // ! 这是GraphQL，不是普通的Response，不知道过滤器能不能实现
    return await (
      tokenCache || this.msalService.getTokenCache()
    ).getAccountByLocalId(localAccountId);
  }

  @Mutation(() => Boolean)
  async removeAccount(
    @Args('localAccountId') localAccountId: string,
  ): Promise<boolean> {
    const tokenCache = this.msalService.getTokenCache();
    const account = await this.account(localAccountId, tokenCache);
    return (
      Boolean(account) && !Boolean(await tokenCache.removeAccount(account))
    );
  }
}
