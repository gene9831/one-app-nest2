import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GqlFieldRoles } from 'src/decorators';
import { Role } from 'src/enums';
import { IdentitySet, Quota } from './others.model';

/**
 * https://docs.microsoft.com/en-us/graph/api/resources/drive?view=graph-rest-1.0#properties
 */
@Schema({ collection: 'drives', timestamps: true })
@ObjectType({ description: `Roles: ${Role.Admin}` })
@GqlFieldRoles(Role.Admin)
export class Drive {
  @Prop({ required: true })
  @Field({ description: `Roles: ${Role.Guest}` })
  @GqlFieldRoles(Role.Guest)
  id: string;

  @Prop({ required: true, type: IdentitySet })
  @Field(() => IdentitySet)
  createdBy: IdentitySet;

  @Prop({ required: true })
  @Field()
  createdDateTime: Date;

  @Prop()
  @Field({ nullable: true })
  description?: string;

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

  @Prop({ type: Quota, required: true })
  @Field(() => Quota)
  quota: Quota;

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

export type DriveDocument = Drive & Document;
export const DriveScheme = SchemaFactory.createForClass(Drive);
