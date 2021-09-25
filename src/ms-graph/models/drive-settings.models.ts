import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types as MongooseTypes } from 'mongoose';
import { AbsolutePath } from 'src/gql-scalars/absolute-path.scalar';
import { Settings } from 'src/models';

export enum AccessRuleAction {
  ALLOW = 'allow',
  DENY = 'deny',
  PASSWD = 'passwd',
}

registerEnumType(AccessRuleAction, { name: 'AccessRuleAction' });

@Schema()
@ObjectType()
export class AccessRule {
  @Prop({ type: MongooseTypes.ObjectId, required: true })
  @Field()
  _id: MongooseTypes.ObjectId;

  @Prop({ required: true })
  @Field()
  path: AbsolutePath;

  @Prop({ required: true, enum: AccessRuleAction })
  @Field(() => AccessRuleAction)
  action: AccessRuleAction;

  @Prop()
  @Field({ nullable: true })
  password?: string;
}

@Schema({ collection: 'settings', timestamps: true })
@ObjectType()
export class DriveSettings extends Settings {
  @Prop({ required: true })
  @Field()
  driveId: string;

  @Prop({ default: false })
  @Field({ nullable: true, defaultValue: false })
  rootPathEnabled?: boolean;

  @Prop({ default: '/' })
  @Field({ nullable: true, defaultValue: '/' })
  rootPath?: AbsolutePath;

  @Prop([AccessRule])
  @Field(() => [AccessRule], { nullable: true })
  accessRules?: AccessRule[];
}

export type DriveSettingsDocument = DriveSettings & Document;
export const DriveSettingsSchema = SchemaFactory.createForClass(DriveSettings);
