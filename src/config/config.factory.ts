import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { strict as assert } from 'assert';
import { join } from 'path';
import { checkRoleMiddleware } from 'src/middlewares';
import { MsalModuleOptions, MsalOptionsFactory } from 'src/msal/interfaces';
import * as winston from 'winston';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import {
  utilities,
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';

@Injectable()
export class ConfigFactory
  implements
    JwtOptionsFactory,
    GqlOptionsFactory,
    MongooseOptionsFactory,
    MsalOptionsFactory,
    WinstonModuleOptionsFactory
{
  constructor(private readonly configService: ConfigService) {}

  createJwtOptions(): JwtModuleOptions | Promise<JwtModuleOptions> {
    const jwtOptions = this.configService.get<JwtModuleOptions>('jwt');
    assert.ok(jwtOptions);
    jwtOptions.signOptions = { expiresIn: '1h', ...jwtOptions.signOptions };

    return jwtOptions;
  }

  createGqlOptions(): GqlModuleOptions | Promise<GqlModuleOptions> {
    const env = this.configService.get<string>('env');
    return {
      debug: env === 'development',
      playground: env === 'development',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      buildSchemaOptions: {
        fieldMiddleware: [checkRoleMiddleware],
      },
    };
  }

  createMongooseOptions():
    | MongooseModuleOptions
    | Promise<MongooseModuleOptions> {
    const mongoOptions = this.configService.get('db.mongo');
    assert.ok(mongoOptions);
    return mongoOptions;
  }

  createMsalOptions(): MsalModuleOptions | Promise<MsalModuleOptions> {
    const msal = this.configService.get<MsalModuleOptions>('msal');
    assert.ok(msal);
    return msal;
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

    assert.ok(logfiles);

    return {
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
        utilities.format.nestLike('Nest'),
      ),
      transports: new Array<winston.transport>().concat(
        new winston.transports.Console(),
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
