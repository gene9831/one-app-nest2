import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dateFormat from 'dateformat';
import { Model } from 'mongoose';
import { MsGraphExceptopn } from 'src/exceptions';
import { MsalService } from 'src/msal/msal.service';
import { Pagination } from '../../args';
import { ItemsAndSettingsService } from '../common';
import { DriveApisService } from '../drive-apis/drive-apis.service';
import { getDriveItemArgs } from '../inputs';
import { Drive, DriveDocument, DriveItem, DriveItemDocument } from '../models';

@Injectable()
export class DriveItemsService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(DriveItem.name)
    private readonly driveItemModel: Model<DriveItemDocument>,
    private readonly itemsAndSettingsService: ItemsAndSettingsService,
    private readonly msalService: MsalService,
    private readonly driveApisService: DriveApisService,
  ) {}

  async findOne(args: getDriveItemArgs) {
    if (args.id) {
      return await this.findOneById(args.id);
    } else if (args.path && args.driveId) {
      return await this.itemsAndSettingsService.findOneByPath(
        args.path.toString(),
        args.driveId,
      );
    } else {
      return null;
    }
  }

  async findOneById(id: string) {
    return await this.driveItemModel.findOne({ id }).exec();
  }

  async findMany(args: getDriveItemArgs, pagination?: Pagination) {
    let parent: DriveItem | null = null;

    if (args.id) {
      parent = await this.findOneById(args.id);
    } else if (args.path && args.driveId) {
      parent = await this.itemsAndSettingsService.findOneByPath(
        args.path.toString(),
        args.driveId,
      );
    }

    if (!parent) {
      return null;
    }

    return await this.findManyByItem(parent, pagination);
  }

  async findManyByItem(parent: DriveItem, pagination?: Pagination) {
    if (!parent.folder) {
      return null;
    }

    return await this.driveItemModel
      .find({ 'parentReference.id': parent.id }, null, {
        skip: pagination?.skip,
        limit: Math.min(pagination?.limit || 20, 25),
        sort: { [pagination?.sortKey || 'name']: pagination?.order },
      })
      .exec();
  }

  async getShareLink(driveItem: DriveItem, shareBaseUrl?: string) {
    if (driveItem.file && driveItem.sharePermission) {
      // 检查 link 是否过期
      const expirationDateTime = driveItem.sharePermission.expirationDateTime;
      if (
        !expirationDateTime ||
        (expirationDateTime &&
          new Date(expirationDateTime).getTime() > Date.now())
      ) {
        return this.convertToShareLink(
          driveItem.name,
          shareBaseUrl || (await this.getOrCreateShareBaseUrl(driveItem)),
          driveItem.sharePermission.link.webUrl,
        );
      }
    }

    return null;
  }

  async createShareLink(id: string) {
    const driveItem = await this.findDriveItemWithDrive(id);
    const localId = driveItem?.drive.owner?.user?.id;

    // 限制只有文件才能创建共享连接
    if (!driveItem?.file) {
      return null;
    }

    if (!localId) {
      throw new MsGraphExceptopn(
        `AccountLocalId of driveItem[${driveItem?.id}] is null`,
      );
    }

    const shareBaseUrl = await this.getOrCreateShareBaseUrl(driveItem);

    const shareLink = await this.getShareLink(driveItem, shareBaseUrl);
    if (shareLink) {
      return shareLink;
    }

    const accessToken = await this.msalService.acquireAccessTokenByLocalId(
      localId,
    );
    const now = new Date();
    now.setDate(now.getDate() + 7);
    const expirationDateTime = dateFormat(now, 'isoUtcDateTime');

    // 如果旧的 shareLinnk 快过期了，createLink 操作可以续期，shareLink不会变
    const sharePermission = (
      await this.driveApisService.createLink(
        accessToken,
        id,
        expirationDateTime,
      )
    ).data;

    await this.driveItemModel.updateOne(
      { id: driveItem.id },
      { $set: { sharePermission } },
    );

    return this.convertToShareLink(
      driveItem.name,
      shareBaseUrl,
      sharePermission.link.webUrl,
    );
  }

  async deleteSharePerm(id: string) {
    const driveItem = await this.findDriveItemWithDrive(id);
    const sharePermId = driveItem?.sharePermission?.id;
    const localId = driveItem?.drive.owner?.user?.id;

    if (!driveItem || !sharePermId) {
      return null;
    }

    if (!localId) {
      throw new MsGraphExceptopn(
        `AccountLocalId of driveItem[${driveItem?.id}] is null`,
      );
    }

    await this.driveItemModel
      .updateOne({ id }, { $unset: { sharePermission: '' } })
      .exec();

    const accessToken = await this.msalService.acquireAccessTokenByLocalId(
      localId,
    );

    // 204 no content
    await this.driveApisService.deletePerm(accessToken, id, sharePermId);

    return true;
  }

  private convertToShareLink(
    name: string,
    shareBaseUrl: string,
    shareWebUrl: string,
  ) {
    const share = shareWebUrl.replace(/^.+\//, '');
    // shareBaseUrl 中的download.aspx 加上 '/' 再在后面加任意字符串都行，这里加个文件名方便识别
    return shareBaseUrl.replace('?share=', `/${name}?share=${share}`);
  }

  private async getOrCreateShareBaseUrl(driveItem: DriveItem) {
    const driveId = driveItem.parentReference.driveId;

    const drive = await this.driveModel.findOne({ id: driveId }).exec();
    const localId = drive?.owner?.user?.id;

    if (!localId) {
      throw new MsGraphExceptopn(
        `AccountLocalId of drive[${drive?.id}] is null`,
      );
    }

    let shareBaseUrl = drive?.shareBaseUrl;

    if (shareBaseUrl) {
      return shareBaseUrl;
    }

    const accessToken = await this.msalService.acquireAccessTokenByLocalId(
      localId,
    );

    const contentUrl = await this.driveApisService.contentUrl(
      accessToken,
      driveItem.id,
    );
    const separator = 'download.aspx';
    shareBaseUrl = contentUrl.split(separator)[0] + separator + '?share=';

    await this.driveModel
      .updateOne({ id: driveId }, { $set: { shareBaseUrl } })
      .exec();

    return shareBaseUrl;
  }

  private async findDriveItemWithDrive(id: string) {
    const driveItems = await this.driveItemModel
      .aggregate<DriveItem & { drive: Drive }>([
        { $match: { id } },
        {
          $lookup: {
            from: 'drives',
            localField: 'parentReference.driveId',
            foreignField: 'id',
            as: 'drive',
          },
        },
        { $unwind: '$drive' },
      ])
      .exec();

    return driveItems.length > 0 ? driveItems[0] : null;
  }
}
