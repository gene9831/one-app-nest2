import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  File,
  Folder,
  IdentitySet,
  ItemReference,
  SharePermission,
} from './others.model';

/**
 * https://docs.microsoft.com/en-us/graph/api/resources/driveitem?view=graph-rest-1.0#properties
 */
@Schema({ collection: 'drive_items' })
@ObjectType()
export class DriveItem extends Document {
  @Prop({ required: true })
  @Field()
  id: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  audio?: Record<string, any>;

  // @Prop()
  // content?: any;

  @Prop({ type: IdentitySet })
  createdBy?: IdentitySet;

  @Prop({ required: true })
  @Field()
  createdDateTime: Date;

  @Prop()
  cTag?: string;

  @Prop(raw({ state: { type: String } }))
  deleted?: { state: string };

  @Prop()
  @Field({ nullable: true })
  description?: string;

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

  @Prop({ type: IdentitySet })
  lastModifiedBy?: IdentitySet;

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

  /** 这个属性好像没什么用 */
  @Prop({ type: MongooseSchema.Types.Mixed })
  shared?: Record<string, any>;

  @Prop({ required: true })
  @Field()
  size: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  video?: Record<string, any>;

  @Prop({ required: true })
  webUrl: string;

  @Prop(SharePermission)
  sharePermission?: SharePermission;

  @Field({ nullable: true })
  shareLink?: string;

  /**
   * 全量更新的标签。全量更新后标签不是最新标签，则表示这个driveItem数据已失效
   */
  @Prop()
  entireUpdateTag?: string;
}

export const DriveItemScheme = SchemaFactory.createForClass(DriveItem);
