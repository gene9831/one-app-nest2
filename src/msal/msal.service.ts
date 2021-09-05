import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MSAL_OPTIONS } from './constants';
import { MsalModuleOptions } from './interfaces';
import { TokenCache } from './models';
import {
  AuthenticationResult,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
  NodeAuthOptions,
  SilentFlowRequest,
  TokenCacheContext,
} from '@azure/msal-node';

@Injectable()
export class MsalService extends ConfidentialClientApplication {
  readonly options: NodeAuthOptions & {
    redirectUri: string;
    scopes: Array<string>;
  };

  constructor(
    @Inject(MSAL_OPTIONS) options: MsalModuleOptions,
    @InjectModel(TokenCache.name)
    readonly tokenCacheModel: Model<TokenCache>,
  ) {
    super({
      auth: options,
      cache: {
        cachePlugin: {
          beforeCacheAccess: async (tokenCacheContext: TokenCacheContext) => {
            // 从数据库加载 token cache
            const tokenCahce = await tokenCacheModel.findOne().exec();
            if (tokenCahce) {
              tokenCacheContext.cache.deserialize(tokenCahce.serializedToken);
            }
          },
          afterCacheAccess: async (tokenCacheContext: TokenCacheContext) => {
            if (tokenCacheContext.hasChanged) {
              // 将 token cache 保存到数据库
              const tokenCache =
                (await tokenCacheModel.findOne().exec()) ||
                new tokenCacheModel();
              tokenCache.serializedToken = tokenCacheContext.cache.serialize();
              tokenCache.save();
            }
          },
        },
      },
      system: {
        // loggerOptions: {
        //   loggerCallback(loglevel, message, containsPii) {
        //     console.log(message);
        //   },
        //   piiLoggingEnabled: false,
        //   logLevel: LogLevel.Info,
        // },
      },
    });
    this.options = options;
  }

  async getAuthCodeUrl(
    request?: Omit<AuthorizationUrlRequest, 'redirectUri' | 'scopes'> & {
      redirectUri?: string;
      scopes?: Array<string>;
    },
  ): Promise<string> {
    return super.getAuthCodeUrl({
      redirectUri: this.options.redirectUri,
      scopes: this.options.scopes,
      ...(request || {}),
    });
  }

  async acquireTokenByCode(
    request: Omit<AuthorizationCodeRequest, 'redirectUri' | 'scopes'> & {
      redirectUri?: string;
      scopes?: Array<string>;
    },
  ): Promise<AuthenticationResult | null> {
    return await super.acquireTokenByCode({
      redirectUri: this.options.redirectUri,
      scopes: this.options.scopes,
      ...request,
    });
  }

  async acquireTokenSilent(
    request: Omit<SilentFlowRequest, 'scopes'> & {
      scopes?: Array<string>;
    },
  ): Promise<AuthenticationResult | null> {
    return await super.acquireTokenSilent({
      scopes: this.options.scopes,
      ...request,
    });
  }
}
