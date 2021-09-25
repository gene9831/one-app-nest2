import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { Types as MongooseTypes } from 'mongoose';

@Scalar('ObjectId', () => MongooseTypes.ObjectId)
export class ObjectIdScalar
  implements CustomScalar<string, MongooseTypes.ObjectId>
{
  description = 'Mongodb ObjectId custom scalar type';

  parseValue(value: string) {
    return new MongooseTypes.ObjectId(value);
  }

  serialize(value: MongooseTypes.ObjectId) {
    return value.toHexString();
  }

  parseLiteral(valueNode: ValueNode) {
    if (valueNode.kind === Kind.STRING) {
      return new MongooseTypes.ObjectId(valueNode.value);
    }
    throw new Error(`Expected type: ${Kind.STRING}`);
  }
}
