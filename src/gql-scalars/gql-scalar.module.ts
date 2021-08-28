import { Module } from '@nestjs/common';
import { ObjectIdScalar } from './object-id.scalar';

@Module({
  providers: [ObjectIdScalar],
})
export class GqlScalarsModule {}
