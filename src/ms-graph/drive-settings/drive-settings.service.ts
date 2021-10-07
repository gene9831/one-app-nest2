import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types as MongooseTypes } from 'mongoose';
import { AbsolutePath } from 'src/gql-scalars/absolute-path.scalar';
import { SettingsType } from 'src/models';
import { UpdateDriveSettings } from '../inputs';
import {
  ConflicError,
  DocumentNotFoundError,
  MissingPropertiesError,
} from 'src/exceptions';
import {
  AccessRuleAction,
  Drive,
  DriveDocument,
  DriveItem,
  DriveItemDocument,
  DriveSettings,
  DriveSettingsDocument,
} from '../models';

@Injectable()
export class DriveSettingsService {
  constructor(
    @InjectModel(DriveSettings.name)
    private readonly driveSettingsModel: Model<DriveSettingsDocument>,
    @InjectModel(Drive.name)
    private readonly driveModel: Model<DriveDocument>,
    @InjectModel(DriveItem.name)
    private readonly driveItemModel: Model<DriveItemDocument>,
  ) {}

  private async create(driveId: string) {
    return await this.driveSettingsModel.create({
      type: SettingsType.DRIVE,
      driveId,
    });
  }

  async findOne(driveId: string) {
    return await this.driveSettingsModel
      .findOne({ type: SettingsType.DRIVE, driveId })
      .exec();
  }

  async findOneOrCreate(driveId: string) {
    let driveSettings = await this.findOne(driveId);

    if (!driveSettings) {
      const count = await this.driveModel
        .countDocuments({ id: driveId })
        .exec();

      if (count === 0) {
        throw new DocumentNotFoundError(
          `Creation of driveSettings failed of driveId: ${driveId}`,
        );
      }

      driveSettings = await this.create(driveId);
    }

    return driveSettings;
  }

  async update(dto: UpdateDriveSettings) {
    const { driveId, ...others } = dto;

    await this.findOneOrCreate(driveId);

    if (others.rootPath) {
      await this.validatePath(driveId, others.rootPath);
    }

    const result = await this.driveSettingsModel.updateOne(
      { type: SettingsType.DRIVE, driveId },
      { $set: others },
    );

    return result.modifiedCount;
  }

  async addAccessRule(
    driveId: string,
    action: AccessRuleAction,
    path: AbsolutePath,
    password?: string,
  ) {
    await this.validateAccessRule(driveId, action, path, password);

    const result = await this.driveSettingsModel.updateOne(
      { type: SettingsType.DRIVE, driveId, 'accessRules.path': { $ne: path } },
      {
        $push: {
          accessRules: {
            $each: [
              { _id: new MongooseTypes.ObjectId(), action, path, password },
            ],
            $sort: { path: 1 },
          },
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new ConflicError(`Path conflic with '${path}'`);
    }

    return result.matchedCount;
  }

  async updateAccessRule(
    driveId: string,
    _id: MongooseTypes.ObjectId,
    action?: AccessRuleAction,
    path?: AbsolutePath,
    password?: string,
  ) {
    await this.validateAccessRule(driveId, action, path, password);

    const result = await this.driveSettingsModel.updateOne(
      { type: SettingsType.DRIVE, driveId, 'accessRules._id': _id },
      {
        $set: {
          'accessRules.$.action': action,
          'accessRules.$.path': path,
          'accessRules.$.password': password,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new DocumentNotFoundError(`Invalid _id of accessRule: ${_id}`);
    }

    return result.matchedCount;
  }

  async deleteAccessRule(driveId: string, _id: MongooseTypes.ObjectId) {
    const result = await this.driveSettingsModel.updateOne(
      { type: SettingsType.DRIVE, driveId, 'accessRules._id': _id },
      { $pull: { accessRules: { _id } } },
    );

    if (result.matchedCount === 0) {
      throw new DocumentNotFoundError(`Invalid _id of accessRule: ${_id}`);
    }

    return result.matchedCount;
  }

  private async validateAccessRule(
    driveId: string,
    action?: AccessRuleAction,
    path?: AbsolutePath,
    password?: string,
  ) {
    if (action === AccessRuleAction.PASSWD && !password) {
      throw new MissingPropertiesError('password');
    }

    if (path) {
      await this.validatePath(driveId, path);
    }

    return true;
  }

  private async validatePath(driveId: string, path: AbsolutePath) {
    const driveItem = await this.findOneByAbsolutePath(driveId, path);

    if (!driveItem) {
      throw new DocumentNotFoundError(
        `Invalid driveId or path, driveId: ${driveId}, path: ${path}`,
      );
    }

    return true;
  }

  private async findOneByAbsolutePath(driveId: string, path: AbsolutePath) {
    let res = await this.driveItemModel
      .findOne({ 'parentReference.driveId': driveId, root: { $exists: true } })
      .exec();

    if (!res) {
      throw new DocumentNotFoundError(`Invalid driveId: ${driveId}`);
    }

    while (true) {
      // 去掉开头的'/'，然后以 从左至右第一个出现的'/' 为分割符 分割成两个字符串
      const [name, subPath] = path.replace(/^\/+/, '').split(/(?<=^[^/]+)\//);

      if (!name) {
        break;
      }

      const driveItems: DriveItemDocument[] = await this.driveItemModel
        .find({ 'parentReference.id': res.id })
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
