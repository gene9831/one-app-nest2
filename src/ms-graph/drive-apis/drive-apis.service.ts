import { HttpService, Inject, Injectable, Logger } from '@nestjs/common';
import { strict as assert } from 'assert';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Drive, DriveItem, SharePermission } from '../models';

const MS_GRAPH_API = 'https://graph.microsoft.com/v1.0';

export type DriveResult = Drive;

export type DeltaResult = {
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
  value: Array<DriveItem & { '@odata.type': string }>;
};

export type SharePermissionResult = SharePermission;

@Injectable()
export class DriveApisService {
  readonly urls = {
    drive: `${MS_GRAPH_API}/me/drive`,
    driveRoot: `${MS_GRAPH_API}/me/drive/root`,
    delta: `${MS_GRAPH_API}/me/drive/root/delta`,
    driveItems: `${MS_GRAPH_API}/me/drive/items`,
  };

  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  async drive(accessToken: string) {
    return await this.httpRequest<DriveResult>(
      {
        url: this.urls.drive,
      },
      accessToken,
    );
  }

  async delta(accessToken: string, url?: string) {
    return await this.httpRequest<DeltaResult>(
      {
        url: url || this.urls.delta,
      },
      accessToken,
    );
  }

  /**
   * 创建共享连接
   * @param itemId
   * @param expirationDateTime 格式：yyyy-MM-ddTHH:mm:ssZ
   */
  async createLink(
    accessToken: string,
    itemId: string,
    expirationDateTime?: string,
  ) {
    if (expirationDateTime) {
      assert.ok(
        Boolean(
          expirationDateTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
        ),
        'Datetime format: yyyy-MM-ddTHH:mm:ssZ',
      );
    }

    return await this.httpRequest<SharePermissionResult>(
      {
        url: `${this.urls.driveItems}/${itemId}/createLink`,
        method: 'POST',
        data: { type: 'view', scope: 'anonymous', expirationDateTime },
      },
      accessToken,
    );
  }

  async contentUrl(accessToken: string, itemId: string) {
    try {
      const res = await this.httpRequest(
        {
          url: `${this.urls.driveItems}/${itemId}/content`,
          maxRedirects: 0,
        },
        accessToken,
      );
      return res.headers.location as string;
    } catch (err) {
      if (err?.isAxiosError) {
        const axiosError: AxiosError = err;

        if (axiosError.response) {
          const statusCode = axiosError.response.status;

          if (statusCode >= 300 && statusCode < 400) {
            return axiosError.response.headers.location as string;
          }
        }
      }
      throw err;
    }
  }

  async deletePerm(accessToken: string, itemId: string, permId: string) {
    return await this.httpRequest(
      {
        url: `${this.urls.driveItems}/${itemId}/permissions/${permId}`,
        method: 'DELETE',
      },
      accessToken,
    );
  }

  private async httpRequest<T>(
    config: AxiosRequestConfig,
    accessToken: string,
  ): Promise<AxiosResponse<T>> {
    const { headers, ...others } = config;

    try {
      return await this.httpService
        .request<T>({
          headers: { Authorization: `Bearer ${accessToken}`, ...headers },
          ...others,
        })
        .toPromise();
    } catch (err) {
      if (err?.isAxiosError) {
        const axiosError: AxiosError = err;

        if (axiosError.response) {
          const statusCode = axiosError.response.status;

          if (statusCode >= 400 && statusCode < 500) {
            this.logger.error(
              axiosError.response.data.error,
              void 0,
              'DriveApisService',
            );
          }
        }
      }
      throw err;
    }
  }
}
