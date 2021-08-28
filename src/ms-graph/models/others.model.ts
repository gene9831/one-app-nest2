import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

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

@ObjectType()
export class File {
  @Prop({ type: Hashes, required: true })
  @Field(() => Hashes)
  hashes: Hashes;

  @Prop({ required: true })
  @Field()
  mimeType: string;
}

@ObjectType()
export class Folder {
  @Prop({ required: true })
  @Field(() => Int)
  childCount: number;
}

@ObjectType()
export class Identity {
  @Prop({ required: true })
  @Field()
  displayName: string;

  @Prop()
  @Field({ nullable: true })
  id?: string;
}

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

export class Shared {
  @Prop({ required: true })
  owner: IdentitySet;

  @Prop({ required: true })
  scope: string;

  @Prop({ required: true })
  sharedBy: IdentitySet;

  @Prop({ required: true })
  sharedDateTime: Date;
}
