import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { dirname, join } from 'path';
import { validate } from './config.validation';

const YAML_CONFIG_FILENAME = 'config.yaml';

const yamlConfig = () => {
  // 在这里进行验证
  return validate(
    yaml.load(
      readFileSync(join(dirname(__dirname), YAML_CONFIG_FILENAME), 'utf8'),
    ) as Record<string, any>,
  );
};

export const configurations = [yamlConfig];
