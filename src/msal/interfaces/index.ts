import { NodeAuthOptions } from '@azure/msal-node';
import { ModuleMetadata, Type } from '@nestjs/common';

export type MsalModuleOptions = NodeAuthOptions & {
  redirectUri: string;
  scopes: Array<string>;
};

export interface MsalOptionsFactory {
  createMsalOptions(): Promise<MsalModuleOptions> | MsalModuleOptions;
}

export interface MsalModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<MsalOptionsFactory>;
  useClass?: Type<MsalOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<MsalModuleOptions> | MsalModuleOptions;
  inject?: any[];
}
