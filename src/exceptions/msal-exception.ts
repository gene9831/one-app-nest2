import { BaseException } from './base-exception';

export class MsalException extends BaseException {
  constructor(message?: string) {
    super(message || 'Msal service error');
  }
}
