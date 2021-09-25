import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

enum UpdateTaskCompleted {
  SUCCESS = 'success',
  FAIL = 'fail',
}

registerEnumType(registerEnumType, { name: 'registerEnumType' });

@Schema({ collection: 'update_tasks', timestamps: true })
@ObjectType({ description: '更新任务完成后，再过10分钟自动删除更新记录' })
export class UpdateTask {
  @Prop({ required: true })
  @Field()
  name: string;

  @Prop({ required: true, default: 0 })
  @Field()
  progress: number;

  @Prop()
  @Field({ nullable: true })
  completed?: string;

  static readonly Completed = UpdateTaskCompleted;
}

export type UpdateTaskDocument = UpdateTask & Document;
export const UpdateTaskScheme = SchemaFactory.createForClass(UpdateTask);

UpdateTaskScheme.index({ updatedAt: 1 }, { expireAfterSeconds: 600 });
