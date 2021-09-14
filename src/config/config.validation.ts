import * as Joi from 'joi';

export const validate = (config: Record<string, unknown>) => {
  const schema = Joi.object({
    db: Joi.object({
      mongo: Joi.object({
        uri: Joi.string().required(),
        retryAttempts: Joi.number(),
        retryDelay: Joi.number(),
        connectionName: Joi.string(),
      }).required(),
    }).required(),
    env: Joi.string()
      .valid('development', 'production', 'test', 'provision')
      .default('development'),
    jwt: Joi.object({
      signOptions: Joi.object({
        algorithm: Joi.string(),
        expiresIn: Joi.alternatives().try(Joi.string(), Joi.number()),
      }),
      secret: Joi.string().required(),
    }),
    logfiles: Joi.array()
      .items(
        Joi.object({
          level: Joi.string()
            .valid('error', 'warn', 'info', 'verbose', 'debug')
            .default('info'),
          dirname: Joi.string().default('logs'),
          filename: Joi.string().default(
            Joi.ref('level', { adjust: (value) => `${value}.log` }),
          ),
        }),
      )
      .default([]),
    msal: Joi.object({
      clientId: Joi.string().required(),
      authority: Joi.string(),
      clientSecret: Joi.string().required(),
      redirectUri: Joi.string().required(),
      scopes: Joi.array().items(Joi.string()).default([]),
    }).required(),
  });

  const res = schema.validate(config, {
    stripUnknown: true,
    abortEarly: false,
    // only convert from strings
    convert: true,
  });

  if (res.error) {
    throw new Error(res.error.message);
  }

  return res.value;
};
