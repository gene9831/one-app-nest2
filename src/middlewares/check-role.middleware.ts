import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';
import { Role } from 'src/enums';

export const checkRoleMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const { info } = ctx;
  const userRoles: string[] = ctx.context.req.user?.roles || [];

  // 使用concat是因为roles可能为undefined
  const rolesSet = new Set<string>(
    []
      .concat(info.parentType.extensions?.roles)
      .concat(info.parentType.getFields()[info.fieldName].extensions?.roles)
      .filter((role) => Boolean(role)),
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

  return next();
};
