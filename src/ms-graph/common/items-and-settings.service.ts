import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
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
}
