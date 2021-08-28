import { ArgsType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum Order {
  ASC = 1,
  DESC = -1,
}

registerEnumType(Order, {
  name: 'Order',
});

@ArgsType()
export class Pagination {
  @Field(() => Int, { defaultValue: 0 })
  skip?: number;

  @Field(() => Int, { defaultValue: 20 })
  limit?: number;

  @Field({ nullable: true })
  sortKey?: string;

  @Field(() => Order, { defaultValue: Order.ASC })
  order?: number;
}
