import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigFactory } from 'src/config';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({ useClass: ConfigFactory }),
  ],
  providers: [AuthService, AuthResolver, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
