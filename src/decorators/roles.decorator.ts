import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/enums';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
