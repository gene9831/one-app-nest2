import { Types as MongooseTypes } from 'mongoose';
import { AbsolutePath } from 'src/gql-scalars/absolute-path.scalar';
import { AccessRuleAction } from '../models';
import {
  ArgsType,
  Field,
  OmitType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';

@ArgsType()
export class AddAccessRule {
  @Field()
  driveId: string;

  @Field(() => AccessRuleAction)
  action: AccessRuleAction;

  @Field()
  path: AbsolutePath;

  @Field({ nullable: true })
  password?: string;
}

@ArgsType()
export class UpdateAccessRule extends PartialType(
  OmitType(AddAccessRule, ['driveId']),
) {
  @Field()
  driveId: string;

  @Field()
  _id: MongooseTypes.ObjectId;
}

@ArgsType()
export class DeleteAccessRule {
  @Field()
  driveId: string;

  @Field()
  _id: MongooseTypes.ObjectId;
}

export enum AccessRuleOps {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
}

registerEnumType(AccessRuleOps, { name: 'AccessRuleOps' });

@ArgsType()
export class MutateAccessRule {
  @Field()
  driveId: string;

  @Field(() => AccessRuleOps)
  op: AccessRuleOps;

  @Field({ nullable: true })
  _id?: MongooseTypes.ObjectId;

  @Field({ nullable: true })
  path?: AbsolutePath;

  @Field(() => AccessRuleAction, { nullable: true })
  action?: AccessRuleAction;

  @Field({ nullable: true })
  password?: string;
}

@ArgsType()
export class UpdateDriveSettings {
  @Field()
  driveId: string;

  @Field({ nullable: true })
  rootPathEnabled?: boolean;

  @Field({ nullable: true })
  rootPath?: AbsolutePath;
}
