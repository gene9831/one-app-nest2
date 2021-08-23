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
