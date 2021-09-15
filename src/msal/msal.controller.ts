import { Account } from './models';
import { MsalService } from './msal.service';
import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  UnauthorizedException,
} from '@nestjs/common';

@Controller('msal')
export class MsalController {
  constructor(private readonly msalService: MsalService) {}

  @Get('authCallback')
  async authCallback(@Query('code') code: string): Promise<Account> {
    const res = await this.msalService.acquireTokenByCode({ code: code });

    if (!res) {
      throw new UnauthorizedException();
    }

    if (!res.account) {
      throw new InternalServerErrorException('Msal account is null');
    }

    const { idTokenClaims, ...others } = res.account;
    return others;
  }
}
