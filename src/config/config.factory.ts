import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { join } from 'path';
import { MsalModuleOptions, MsalOptionsFactory } from 'src/msal/interfaces';

@Injectable()
export class ConfigFactory
  implements GqlOptionsFactory, MongooseOptionsFactory, MsalOptionsFactory
{
  constructor(private readonly configService: ConfigService) {}

  createGqlOptions(): GqlModuleOptions | Promise<GqlModuleOptions> {
    const env = this.configService.get<string>('env');
    return {
      debug: env === 'development',
      playground: env === 'development',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    };
  }

  createMongooseOptions():
    | MongooseModuleOptions
    | Promise<MongooseModuleOptions> {
    return this.configService.get('db.mongo');
  }

  createMsalOptions(): MsalModuleOptions | Promise<MsalModuleOptions> {
    // console.log(this.configService);
    return this.configService.get('msal');
  }
}
