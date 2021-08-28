import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'test', timestamps: true })
export class Test extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  a?: number;

  @Prop()
  b?: number;

  @Prop()
  c?: number;
}

export const TestSchema = SchemaFactory.createForClass(Test);

TestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
