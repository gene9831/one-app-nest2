import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MSAL_OPTIONS } from './constants';
import { MsalModuleAsyncOptions, MsalOptionsFactory } from './interfaces';
import { MsalService } from './msal.service';
import { MsalController } from './msal.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenCache, TokenCacheScheme } from './models';
import { MsalResolver } from './msal.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenCache.name, schema: TokenCacheScheme },
    ]),
  ],
  providers: [MsalService, MsalResolver],
  controllers: [MsalController],
})
export class MsalModule {
  public static registerAsync(options: MsalModuleAsyncOptions): DynamicModule {
    return {
      module: MsalModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options)],
    };
  }

  private static createAsyncProviders(
    options: MsalModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsycOptionsProvider(options)];
    }

    // for useClass
    return [
      this.createAsycOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsycOptionsProvider(
    options: MsalModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      // for useFactory
      return {
        provide: MSAL_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    // For useExisting...
    return {
      provide: MSAL_OPTIONS,
      useFactory: async (optionsFactory: MsalOptionsFactory) =>
        await optionsFactory.createMsalOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
