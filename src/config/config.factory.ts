import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { join } from 'path';
import { MsalModuleOptions, MsalOptionsFactory } from 'src/msal/interfaces';
import * as winston from 'winston';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import {
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';

@Injectable()
export class ConfigFactory
  implements
    GqlOptionsFactory,
    MongooseOptionsFactory,
    MsalOptionsFactory,
    WinstonModuleOptionsFactory
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
    return this.configService.get('msal');
  }

  createWinstonModuleOptions():
    | Promise<WinstonModuleOptions>
    | WinstonModuleOptions {
    const logfiles = this.configService.get<
      Array<{
        level: string;
        dirname: string;
        filename: string;
      }>
    >('logfiles');
    const config = this.configService.get<WinstonModuleOptions>('winston');
    const transports = Array.isArray(config.transports)
      ? config.transports || []
      : [config.transports];
    return {
      ...config,
      transports: transports.concat(
        logfiles.map(
          ({ level, dirname, filename }) =>
            new winston.transports.File({
              level,
              dirname,
              filename,
              format: winston.format.uncolorize(),
            }),
        ),
      ),
    };
  }
}
