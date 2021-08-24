import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Account } from './models';
import { MsalService } from './msal.service';

@Controller('msal')
export class MsalController {
  constructor(private readonly msalService: MsalService) {}

  @Get('authCallback')
  async authCallback(@Query('code') code: string): Promise<Account> {
    const res = await this.msalService.acquireTokenByCode({ code: code });
    if (!res) {
      throw new UnauthorizedException();
    }
    const { idTokenClaims, ...others } = res.account;
    return others;
  }
}
