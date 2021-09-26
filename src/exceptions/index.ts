import * as apollo_server_errors from 'apollo-server-errors';

export class MsalException extends Error {
  constructor(message?: string) {
    super(message || 'Msal service error');
  }
}

export class UserInputError extends apollo_server_errors.UserInputError {}

export class ForbiddenError extends apollo_server_errors.ForbiddenError {
  constructor(message?: string) {
    super(message || 'Forbidden');
  }
}

export class AuthenticationError extends apollo_server_errors.AuthenticationError {
  constructor(message?: string) {
    super(message || 'Authentication failed');
  }
}

export class DocumentNotFoundError extends apollo_server_errors.ApolloError {
  constructor(message?: string) {
    super(message || 'Document not found', 'NOT_FOUND');

    Object.defineProperty(this, 'name', { value: 'DocumentNotFoundError' });
  }
}

export class MissingPropertiesError extends UserInputError {
  constructor(...MissingProps: string[]) {
    super(`Missing properties: ${MissingProps}`);
  }
}

export class ConflicError extends UserInputError {
  constructor(message?: string) {
    super(message || 'Conflic');
  }
}

export class OperationNotSupportedError extends UserInputError {
  constructor(message?: string) {
    super(message || 'Operation not supported');
  }
}
