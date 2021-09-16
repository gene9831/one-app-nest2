import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

// ! SubDocument 的 Prop 中的 required 属性为 true 的生效条件
// ! 1. class 添加 Schema 装饰器  2. 在任何 update 操作中禁用 upsert
// ! 插入文档只能用以下方法: create, save, bulkWrite 中的 insertOne

@Schema({ _id: false })
@ObjectType()
export class Hashes {
  @Prop()
  @Field({ nullable: true })
  sha1Hash?: string;

  @Prop()
  @Field({ nullable: true })
  sha256Hash?: string;

  @Prop()
  @Field({ nullable: true })
  crc32Hash?: string;

  @Prop()
  @Field({ nullable: true })
  quickXorHash?: string;
}

@Schema({ _id: false })
@ObjectType()
export class File {
  @Prop({ type: Hashes, required: true })
  @Field(() => Hashes)
  hashes: Hashes;

  @Prop({ required: true })
  @Field()
  mimeType: string;
}

@Schema({ _id: false })
@ObjectType()
export class Folder {
  @Prop({ required: true })
  @Field(() => Int)
  childCount: number;
}

@Schema({ _id: false })
@ObjectType()
export class Identity {
  @Prop({ required: true })
  @Field()
  displayName: string;

  @Prop()
  @Field({ nullable: true })
  id?: string;
}

@Schema({ _id: false })
@ObjectType()
export class IdentitySet {
  @Prop(Identity)
  @Field(() => Identity, { nullable: true })
  application?: Identity;

  @Prop(Identity)
  @Field(() => Identity, { nullable: true })
  device?: Identity;

  @Prop(Identity)
  @Field(() => Identity, { nullable: true })
  user?: Identity;
}

@Schema({ _id: false })
export class ItemReference {
  @Prop({ required: true })
  driveId: string;

  @Prop({ required: true })
  driveType: string;

  @Prop()
  id?: string;

  @Prop()
  path?: string;
}

@Schema({ _id: false })
@ObjectType()
export class Quota {
  @Prop({ required: true })
  @Field()
  total: number;

  @Prop({ required: true })
  @Field()
  used: number;

  @Prop({ required: true })
  @Field()
  remaining: number;

  @Prop({ required: true })
  @Field()
  deleted: number;

  @Prop({ required: true })
  @Field()
  state: string;
}

@Schema({ _id: false })
export class SharePermission {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  roles: string[];

  @Prop()
  expirationDateTime?: string;

  @Prop()
  hasPassword?: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  link: {
    scope: string;
    type: string;
    webUrl: string;
    preventsDownload: boolean;
  };
}

export enum AccessRuleAction {
  ALLOW = 'allow',
  DENY = 'deny',
}

registerEnumType(AccessRuleAction, { name: 'AccessRuleAction' });

@Schema({ _id: false })
@ObjectType()
export class AccessRule {
  @Prop({ required: true })
  @Field()
  path: string;

  @Prop({ required: true, enum: AccessRuleAction })
  @Field(() => AccessRuleAction)
  action: AccessRuleAction;
}

@Schema({ _id: false })
@ObjectType()
export class AppSettingsOfDrive {
  @Prop({ default: '/' })
  @Field({ nullable: true, defaultValue: '/' })
  rootPath?: string;

  @Prop([AccessRule])
  @Field(() => [AccessRule], { nullable: true })
  acessRules?: AccessRule[];
}
