import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

/**
 * 绝对路径，以'/'开头。例如
 * 1. '/', 根目录
 * 2. '/path/to/file', 末尾不带'/'
 * 3. '/path/to/folder/', 末尾带'/'
 */
export class AbsolutePath extends String {
  /**
   * 1. 先将连续的'/'全部替换成单个'/'
   * 2. 匹配以下几种情况
   *   - '/', 根目录
   *   - '/path/to/file', 末尾不带'/'
   *   - '/path/to/folder/', 末尾带'/'
   *
   *   最终会将末尾的'/'去掉
   * @param value
   */
  constructor(value = '/') {
    if (!new RegExp(/^\/([^\/]+\/)*[^\/]*$/).test(value.replace(/\/+/g, '/'))) {
      throw new Error(`Regex: '^/([^/]+/)*[^/]*$'`);
    }
    // 去掉尾部的'/'
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
