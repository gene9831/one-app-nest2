import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentNotFoundError } from 'src/exceptions';
import { SettingsType } from 'src/models';
import {
  AccessRule,
  AccessRuleAction,
  DriveItem,
  DriveItemDocument,
  DriveSettings,
  DriveSettingsDocument,
} from '../models';

@Injectable()
export class ItemsAndSettingsService {
  constructor(
    @InjectModel(DriveItem.name)
    private readonly driveItemModel: Model<DriveItemDocument>,
    @InjectModel(DriveSettings.name)
    private readonly driveSettingsModel: Model<DriveSettingsDocument>,
  ) {}

  async findOneByPath(path: string, driveId: string, root = false) {
    let res = await this.driveItemModel
      .findOne({ 'parentReference.driveId': driveId, root: { $exists: true } })
      .exec();

    if (!root) {
      const driveSettings = await this.driveSettingsModel
        .findOne({ driveId: res?.parentReference.driveId })
        .exec();

      const rootPath = driveSettings?.rootPath || '/';

      path = rootPath + path;
    }

    while (true) {
      // 去掉开头的'/'，然后以 从左至右第一个出现的'/' 为分割符 分割成两个字符串
      const [name, subPath] = path.replace(/^\/+/, '').split(/(?<=^[^/]+)\//);

      if (!name) {
        break;
      }

      const driveItems = await this.driveItemModel
        .find({ 'parentReference.id': res?.id })
        .exec();

      res = driveItems.find((item) => item.name === name) || null;

      if (!res) {
        return null;
      }

      path = subPath || '';
    }

    return res;
  }

  // TODO 判断是 file 还是 folder; 如果允许访问且是 folder, 就把所有子节点都判断是否能访问
  // TODO 是否加入密码
  async checkAccessPerm(id: string, driveId: string, password?: string) {
    let path = await this.getDriveItemPath(id);
    const accessRules = await this.getAccessRulesByDriveId(driveId);

    while (path) {
      const rule = accessRules.get(path);

      if (rule) {
        switch (rule.action) {
          case AccessRuleAction.ALLOW:
            return true;
          case AccessRuleAction.DENY:
            return false;
          case AccessRuleAction.PASSWD:
            return rule.password === password;
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
    return false;
  }

  /**
   *
   * @param id
   * @returns /path/to/driveItem 保证长度大于0, 左侧有'/', 右侧没有'/', root为'/'
   */
  async getDriveItemPath(id: string) {
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

  async getAccessRulesByDriveId(driveId: string) {
    const driveSettings = await this.driveSettingsModel
      .findOne({
        type: SettingsType.DRIVE,
        driveId,
      })
      .exec();

    if (!driveSettings) {
      throw new DocumentNotFoundError(`Invalid id of drive: ${driveId}`);
    }

    return this.getAccessRulesByDriveSettings(driveSettings);
  }

  async getAccessRulesByDriveSettings(driveSettings: DriveSettings) {
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
}
