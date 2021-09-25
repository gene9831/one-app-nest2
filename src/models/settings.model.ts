import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

export enum SettingsType {
  ONE_APP = 'one-app',
  DRIVE = 'drive',
}

registerEnumType(SettingsType, { name: 'SettingsType' });

// 类被继承后Schema装饰器里options会被完全覆盖，这里没必要添加options
@Schema()
@ObjectType()
export class Settings {
  @Prop({ type: String, required: true, enum: SettingsType })
  @Field(() => SettingsType)
  type: SettingsType;
}
