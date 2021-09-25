import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

/**
 * 绝对路径，以'/'开头。例如
 * 1. '/'
 * 2. '/path/to/file'
 * 3. '/path/to/folder/'
 */
export class AbsolutePath extends String {
  constructor(value?: any) {
    if (!new RegExp(/^\/([^\/]+\/)*[^\/]*$/).test(value)) {
      throw new Error(`Regex: '^/([^/]+/)*[^/]*$'`);
    }
    super(value.replace(/(?<=.+)\/$/, ''));
  }
}

@Scalar('AbsolutePath', () => AbsolutePath)
export class AbsolutePathScalar implements CustomScalar<string, AbsolutePath> {
  description = 'Absolte path must starts with "/"';

  parseValue(value: string) {
    return new AbsolutePath(value);
  }

  serialize(value: AbsolutePath) {
    return value.toString();
  }

  parseLiteral(valueNode: ValueNode) {
    if (valueNode.kind === Kind.STRING) {
      return new AbsolutePath(valueNode.value);
    }
    throw new Error(`Expected type: ${Kind.STRING}`);
  }
}
