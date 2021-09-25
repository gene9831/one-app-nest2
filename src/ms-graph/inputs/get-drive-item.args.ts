import { ArgsType, Field } from '@nestjs/graphql';
import { AbsolutePath } from 'src/gql-scalars/absolute-path.scalar';

@ArgsType()
export class getDriveItemArgs {
  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  path?: AbsolutePath;

  @Field({ nullable: true })
  driveId?: string;

  @Field({ nullable: true })
  password?: string;
}
