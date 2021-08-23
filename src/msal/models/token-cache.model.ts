import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'token_cache', timestamps: true })
export class TokenCache {
  @Prop({ required: true })
  serializedToken: string;
}

export type TokenCacheDocument = TokenCache & Document;
export const TokenCacheScheme = SchemaFactory.createForClass(TokenCache);
