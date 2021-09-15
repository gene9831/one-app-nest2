import { BaseException } from './base-exception';

export class MsGraphExceptopn extends BaseException {
  constructor(message?: string) {
    super(message || 'MsGraph service error');
  }
}
