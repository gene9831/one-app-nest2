import { HttpService, Injectable } from '@nestjs/common';
import { Drive, DriveItem } from '../models';

const MS_GRAPH_API = 'https://graph.microsoft.com/v1.0';

export type DriveResult = Drive;

export type DeltaResult = {
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
  value: Array<DriveItem & { '@odata.type': string }>;
};

@Injectable()
export class DriveApisService {
  readonly urls = {
    drive: `${MS_GRAPH_API}/me/drive`,
    driveRoot: `${MS_GRAPH_API}/me/drive/root`,
    delta: `${MS_GRAPH_API}/me/drive/root/delta`,
  };

  constructor(private readonly httpService: HttpService) {}

  async drive(accessToken: string) {
    return await this.httpService
      .get<DriveResult>(this.urls.drive, {
        headers: this.authorizationHeader(accessToken),
      })
      .toPromise();
  }

  async delta(accessToken: string, url?: string) {
    return await this.httpService
      .get<DeltaResult>(url || this.urls.delta, {
        headers: this.authorizationHeader(accessToken),
      })
      .toPromise();
  }

  private authorizationHeader(accessToken: string) {
    return { Authorization: `Bearer ${accessToken}` };
  }
}
