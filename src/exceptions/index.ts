import { UserInputError } from 'apollo-server-errors';

export class MsGraphExceptopn extends UserInputError {
  constructor(message?: string) {
    super(message || 'MsGraph service error');
  }
}

export class MsalException extends UserInputError {
  constructor(message?: string) {
    super(message || 'Msal service error');
  }
}

export class DocumentNotFoundError extends UserInputError {
  constructor(message?: string) {
    super(message || 'Document not found');
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
