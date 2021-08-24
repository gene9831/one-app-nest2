import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';

@ObjectType()
export class Identity {
  @Prop({ required: true })
  @Field()
  displayName: string;

  @Prop()
  @Field({ nullable: true })
  id: string;

  // ! 并不会验证subdoc，字符串为null也写入了数据库
  @Prop({ required: true })
  noExistField: string;
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
