import { AccountInfo } from '@azure/msal-node';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Account implements AccountInfo {
  @Field()
  homeAccountId: string;

  @Field()
  environment: string;

  @Field()
  tenantId: string;

  @Field()
  username: string;

  @Field()
  localAccountId: string;

  @Field({ nullable: true })
  name?: string;

  idTokenClaims?: any;
}
