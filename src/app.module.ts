import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configurations } from './config';
import { ConfigFactory } from './config/config.factory';
import { MsalModule } from './msal/msal.module';
import { MsGraphModule } from './ms-graph/ms-graph.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync({
      useClass: ConfigFactory,
    }),
    MongooseModule.forRootAsync({
      useClass: ConfigFactory,
    }),
    MsalModule.registerAsync({
      useClass: ConfigFactory,
    }),
    MsGraphModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
