import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { Types } from 'mongoose';

@Scalar('ObjectId', () => Types.ObjectId)
export class ObjectIdScalar implements CustomScalar<string, Types.ObjectId> {
  description = 'Mongodb ObjectId custom scalar type';

  parseValue(value: string) {
    return new Types.ObjectId(value);
  }

  serialize(value: Types.ObjectId) {
    return value.toHexString();
  }

  parseLiteral(valueNode: ValueNode) {
    if (valueNode.kind === Kind.STRING) {
      return new Types.ObjectId(valueNode.value);
    }
    return null;
  }
}
