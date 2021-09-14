import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/enums';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().req;
    }
    return context.switchToHttp().getRequest();
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ) {
    if (!user) {
      // 没有 user 就是 guest
      user = { username: Role.Guest, roles: [Role.Guest] };
    }

    const userRoles: string[] = user.roles || [];

    const rolesSet = new Set<string>(
      this.reflector.getAllAndMerge('roles', [
        context.getClass(),
        context.getHandler(),
      ]),
    );

    if (
      rolesSet.size > 0 &&
      new Set<string>(userRoles.filter((role) => rolesSet.has(role))).size === 0
    ) {
      if (userRoles.length === 0 || userRoles[0] === Role.Guest) {
        throw new UnauthorizedException();
      }
      throw new ForbiddenException(
        `User does not have permissions to access "${info.fieldName}" field.`,
      );
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
