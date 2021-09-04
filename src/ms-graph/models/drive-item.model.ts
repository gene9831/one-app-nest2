import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  File,
  Folder,
  IdentitySet,
  ItemReference,
  Shared,
} from './others.model';

/**
 * https://docs.microsoft.com/en-us/graph/api/resources/driveitem?view=graph-rest-1.0#properties
 */
@Schema()
@ObjectType()
export class DriveItem extends Document {
  @Prop({ required: true })
  @Field()
  id: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  audio?: Record<string, any>;

  // @Prop()
  // content?: any;

  @Prop({ type: IdentitySet, required: true })
  @Field(() => IdentitySet)
  createdBy: IdentitySet;

  @Prop({ required: true })
  @Field()
  createdDateTime: Date;

  @Prop()
  cTag?: string;

  @Prop(raw({ state: { type: String } }))
  deleted?: { state: string };

  @Prop({ default: '' })
  @Field()
  description: string;

  @Prop()
  eTag?: string;

  @Prop({ type: File })
  @Field(() => File, { nullable: true })
  file?: File;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  fileSystemInfo: Record<string, any>;

  @Prop({ type: Folder })
  @Field(() => Folder, { nullable: true })
  folder?: Folder;

  @Prop(raw({ height: { type: Number }, width: { type: Number } }))
  image?: { height: number; width: number };

  @Prop({ type: IdentitySet, required: true })
  lastModifiedBy: IdentitySet;

  @Prop({ required: true })
  @Field()
  lastModifiedDateTime: Date;

  @Prop({ required: true })
  @Field()
  name: string;

  @Prop({ type: ItemReference, required: true })
  parentReference: ItemReference;

  @Prop({ type: MongooseSchema.Types.Mixed })
  photo?: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.Mixed })
  root?: Record<string, any>;

  @Prop(Shared)
  shared?: Shared;

  @Prop({ required: true })
  @Field()
  size: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  video?: Record<string, any>;

  @Prop({ required: true })
  webUrl: string;

  /**
   * 全量更新的标签。全量更新后标签不是最新标签，则表示这个driveItem数据已失效
   */
  @Prop()
  entireUpdateTag?: string;
}

export const DriveItemScheme = SchemaFactory.createForClass(DriveItem);
