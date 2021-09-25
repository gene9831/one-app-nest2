import { Module } from '@nestjs/common';
import { AbsolutePathScalar } from './absolute-path.scalar';
import { ObjectIdScalar } from './object-id.scalar';

@Module({
  providers: [AbsolutePathScalar, ObjectIdScalar],
})
export class GqlScalarsModule {}
