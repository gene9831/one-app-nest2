import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IdentitySet, Quota } from './others.model';

/**
 * https://docs.microsoft.com/en-us/graph/api/resources/drive?view=graph-rest-1.0#properties
 */
@Schema({ timestamps: true })
@ObjectType()
export class Drive extends Document {
  @Prop({ required: true })
  @Field()
  id: string;

  @Prop({ required: true, type: IdentitySet })
  @Field(() => IdentitySet)
  createdBy: IdentitySet;

  @Prop({ required: true })
  @Field()
  createdDateTime: Date;

  @Prop({ default: '' }) //! required为true，空字符串（‘’）不会通过验证。用default替代
  @Field()
  description: string;

  @Prop({ required: true })
  @Field()
  driveType: string;

  @Prop({ required: true, type: IdentitySet })
  @Field(() => IdentitySet)
  lastModifiedBy: IdentitySet;

  @Prop({ required: true })
  @Field()
  lastModifiedDateTime: Date;

  @Prop({ required: true })
  @Field()
  name: string;

  @Prop(IdentitySet)
  @Field(() => IdentitySet, { nullable: true })
  owner?: IdentitySet;

  @Prop(Quota)
  @Field(() => Quota, { nullable: true })
  quota?: Quota;

  @Prop({ required: true })
  @Field()
  webUrl: string;

  @Prop()
  deltaLink?: string;

  @Prop()
  shareBaseUrl?: string;

  @Prop()
  entireUpdateTag?: string;
}

export const DriveScheme = SchemaFactory.createForClass(Drive);
