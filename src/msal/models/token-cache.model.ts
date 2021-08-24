import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'token_cache', timestamps: true })
export class TokenCache extends Document {
  @Prop({ required: true })
  serializedToken: string;
}

export const TokenCacheScheme = SchemaFactory.createForClass(TokenCache);
