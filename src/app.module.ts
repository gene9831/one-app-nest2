import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigFactory, configurations } from './config';
import { GqlScalarsModule } from './gql-scalars/gql-scalar.module';
import { MsGraphModule } from './ms-graph/ms-graph.module';
import { MsalModule } from './msal/msal.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configurations,
      isGlobal: true,
    }),
    WinstonModule.forRootAsync({
      useClass: ConfigFactory,
    }),
    GraphQLModule.forRootAsync({
      useClass: ConfigFactory,
    }),
    GqlScalarsModule,
    MongooseModule.forRootAsync({
      useClass: ConfigFactory,
    }),
    MsalModule.registerAsync({
      useClass: ConfigFactory,
    }),
    MsGraphModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
