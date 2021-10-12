import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dateFormat from 'dateformat';
import { Model } from 'mongoose';
import { AbsolutePath } from 'src/gql-scalars/absolute-path.scalar';
import { SettingsType } from 'src/models';
import { MsalService } from 'src/msal/msal.service';
import { Pagination } from '../../args';
import { DriveApisService } from '../drive-apis/drive-apis.service';
import { GetDriveItemArgs } from '../inputs';
import {
  AuthenticationError,
  DocumentNotFoundError,
  ForbiddenError,
} from 'src/exceptions';
import {
  AccessRule,
  AccessRuleAction,
  Drive,
  DriveDocument,
  DriveItem,
  DriveItemDocument,
  DriveSettings,
  DriveSettingsDocument,
} from '../models';

@Injectable()
export class DriveItemsService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(DriveItem.name)
    private readonly driveItemModel: Model<DriveItemDocument>,
    @InjectModel(DriveSettings.name)
    private readonly driveSettingsModel: Model<DriveSettingsDocument>,
    private readonly msalService: MsalService,
    private readonly driveApisService: DriveApisService,
  ) {}

  async findOne(args: GetDriveItemArgs) {
    let driveItem: DriveItem | null = null;

    if (args.id) {
      driveItem = await this.findOneById(args.id);
    } else if (args.path && args.driveId) {
      driveItem = await this.findOneByLogicAbsolutePath(
        args.driveId,
        args.path,
      );
    }

    if (driveItem) {
      await this.checkAccessPerm(driveItem, args.password);
    }

    return driveItem;
  }

  private async findOneById(id: string) {
    return await this.driveItemModel.findOne({ id }).exec();
  }

  async findMany(args: GetDriveItemArgs, pagination?: Pagination) {
    let parent: DriveItem | null = null;

    if (args.id) {
      parent = await this.findOneById(args.id);
    } else if (args.path && args.driveId) {
      parent = await this.findOneByLogicAbsolutePath(args.driveId, args.path);
    }

    if (!parent) {
      return null;
    }

    const path = await this.getDriveItemPath(parent.id);
    const accessRules = await this.getAccessRulesByDriveId(
      parent.parentReference.driveId,
    );

    await this.checkPathAccessPerm(path, accessRules, args.password);

    const driveItems = await this.findManyByItem(parent, pagination);

    for (const child of driveItems || []) {
      const childPath = `${path}/${child.name}`;
      const rule = accessRules.get(childPath);
      if (rule?.action === AccessRuleAction.DENY) {
        child.accessDenied = true;
      } else if (rule?.action === AccessRuleAction.PASSWD) {
        child.requiredPassword = true;
      }
    }

    return driveItems;
  }

  private async findManyByItem(parent: DriveItem, pagination?: Pagination) {
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
      throw new DocumentNotFoundError(
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
      throw new DocumentNotFoundError(
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
      throw new DocumentNotFoundError(
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

  private async checkAccessPerm(driveItem: DriveItem, password?: string) {
    const path = await this.getDriveItemPath(driveItem.id);
    const accessRules = await this.getAccessRulesByDriveId(
      driveItem.parentReference.driveId,
    );

    return this.checkPathAccessPerm(path, accessRules, password);
  }

  private async checkPathAccessPerm(
    path: string,
    accessRules: Map<string, Omit<AccessRule, '_id'>>,
    password?: string,
  ) {
    while (path) {
      const rule = accessRules.get(path);

      if (rule) {
        switch (rule.action) {
          case AccessRuleAction.ALLOW:
            return true;
          case AccessRuleAction.DENY:
            throw new ForbiddenError();
          case AccessRuleAction.PASSWD:
            if (rule.password !== password) {
              throw new AuthenticationError(`Authentication failed`);
            }
          default:
            break;
        }
      }

      if (path === '/') {
        break;
      }

      // 去掉 path 最后一级
      path = path.replace(/\/[^\/]+$/, '') || '/';
    }
    // 到根目录了都没有任何 action, 默认 deny
    throw new ForbiddenError();
  }

  /**
   *
   * @param id
   * @returns /path/to/driveItem 保证长度大于0, 左侧有'/', 右侧没有'/', root为'/'
   */
  private async getDriveItemPath(id: string) {
    let path = '';
    let currentId = id;

    while (true) {
      const driveItem = await this.driveItemModel
        .findOne({ id: currentId })
        .exec();

      if (!driveItem) {
        throw new DocumentNotFoundError(
          `Invalid id of driveItem: ${currentId}`,
        );
      }

      const parentId = driveItem.parentReference.id;
      if (!parentId) {
        // 这个就是root节点了
        break;
      }

      path = `/${driveItem.name}${path}`;
      currentId = parentId;
    }

    return path || '/';
  }

  private async getAccessRulesByDriveId(driveId: string) {
    const driveSettings = await this.driveSettingsModel
      .findOne({
        type: SettingsType.DRIVE,
        driveId,
      })
      .exec();

    if (!driveSettings) {
      throw new DocumentNotFoundError(`Invalid id of drive: ${driveId}`);
    }

    const accessRules = new Map<string, Omit<AccessRule, '_id'>>();

    (driveSettings?.accessRules || []).forEach((rule) => {
      accessRules.set(rule.path.toString(), rule);
    });

    if (driveSettings?.rootPathEnabled && driveSettings?.rootPath) {
      accessRules.set(driveSettings.rootPath.toString(), {
        path: driveSettings.rootPath,
        action: AccessRuleAction.ALLOW,
      });
    }

    return accessRules;
  }

  private async findOneByLogicAbsolutePath(
    driveId: string,
    path: AbsolutePath,
  ) {
    let res = await this.driveItemModel
      .findOne({ 'parentReference.driveId': driveId, root: { $exists: true } })
      .exec();

    if (!res) {
      throw new DocumentNotFoundError(`Invalid driveId: ${driveId}`);
    }

    const driveSettings = await this.driveSettingsModel
      .findOne({ driveId: res.parentReference.driveId })
      .exec();

    path = new AbsolutePath((driveSettings?.rootPath || '') + path.toString());

    while (true) {
      // 去掉开头的'/'，然后以 从左至右第一个出现的'/' 为分割符 分割成两个字符串
      const [name, subPath] = path.replace(/^\/+/, '').split(/(?<=^[^/]+)\//);

      if (!name) {
        break;
      }

      const parentId: string = res.id;

      const driveItems = await this.driveItemModel
        .find({ 'parentReference.id': parentId })
        .exec();

      res = driveItems.find((item) => item.name === name) || null;

      if (!res) {
        return null;
      }

      path = subPath || '';
    }

    return res;
  }
}
