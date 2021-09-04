import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { utilities, WinstonModuleOptions } from 'nest-winston';
import { dirname, join } from 'path';
import * as winston from 'winston';
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

const winstonConfig = registerAs(
  'winston',
  (): WinstonModuleOptions => ({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
      utilities.format.nestLike('Nest'),
    ),
    transports: [new winston.transports.Console()],
  }),
);

export const configurations = [yamlConfig, winstonConfig];
