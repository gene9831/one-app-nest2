import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'update_tasks', timestamps: true })
@ObjectType({ description: '更新任务完成后，再过5分钟自动删除更新记录' })
export class UpdateTask extends Document {
  @Prop({ required: true })
  @Field()
  name: string;

  @Prop({ default: 0 })
  @Field()
  progress: number;

  @Prop({ default: false })
  @Field()
  completed: boolean;
}

export const UpdateTaskScheme = SchemaFactory.createForClass(UpdateTask);

UpdateTaskScheme.index({ updatedAt: 1 }, { expireAfterSeconds: 300 });
