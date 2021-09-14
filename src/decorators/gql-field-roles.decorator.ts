import { Extensions } from '@nestjs/graphql';
import { Role } from 'src/enums';

/**
 * GraphQL field 可使用此装饰器来添加角色。一般用在整个 Schema 或者单个 Field 上
 * @param roles
 * @returns
 */
export const GqlFieldRoles = (...roles: Role[]) => Extensions({ roles: roles });
