import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

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
