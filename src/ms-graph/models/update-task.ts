import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'update_tasks', timestamps: true })
export class UpdateTask extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  finished: boolean;
}

export const UpdateTaskScheme = SchemaFactory.createForClass(UpdateTask);

UpdateTaskScheme.index({ updatedAt: 1 }, { expireAfterSeconds: 300 });
