import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { MsalService } from './msal.service';

@Controller('msal')
export class MsalController {
  constructor(private readonly msalService: MsalService) {}

  @Get('authCallback')
  async authCallback(@Query('code') code: string) {
    const res = await this.msalService.acquireTokenByCode({ code: code });
    if (!res) {
      throw new UnauthorizedException();
    }
    return {
      accessToken: res.accessToken,
      expiresOn: res.expiresOn,
    };
  }
}
