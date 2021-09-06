import { AccountInfo } from '@azure/msal-node';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { MsalService } from 'src/msal/msal.service';
import { DriveApisService } from '../drive-apis/drive-apis.service';
import { Drive, DriveItem, UpdateTask } from '../models';

@Injectable()
export class DrivesService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<Drive>,
    @InjectModel(DriveItem.name)
    private readonly driveItemModel: Model<DriveItem>,
    @InjectModel(UpdateTask.name)
    private readonly updateTaskModel: Model<UpdateTask>,
    private readonly msalService: MsalService,
    private readonly driveApisService: DriveApisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  async findMany(): Promise<Drive[]> {
    return await this.driveModel.find().exec();
  }

  async updateMany(localAccountIds?: string | string[], entire = false) {
    const tokenCache = this.msalService.getTokenCache();

    const accounts = new Array<AccountInfo>();

    if (Array.isArray(localAccountIds)) {
      for (const localAccountId of localAccountIds) {
        accounts.push(await tokenCache.getAccountByLocalId(localAccountId));
      }
    } else if (typeof localAccountIds === 'string') {
      accounts.push(await tokenCache.getAccountByLocalId(localAccountIds));
    } else {
      accounts.push(...(await tokenCache.getAllAccounts()));
    }

    const updateTaskId = await this.createUpdateTask();

    this.updateDrivesAsync(accounts, entire, updateTaskId);

    return updateTaskId;
  }

  async deleteOne(localAccountId: string) {
    const drive = await this.driveModel
      .findOne({
        'owner.user.id': localAccountId,
      })
      .exec();

    if (!drive) {
      return false;
    }

    // 删除driveItems
    await this.driveItemModel
      .deleteMany({
        'parentReference.driveId': drive.id,
      })
      .exec();
    // 删除drive
    await drive.remove();

    return true;
  }

  private async createUpdateTask(name = 'updateTask') {
    const updateResult = await this.updateTaskModel
      .updateOne({ _id: new Types.ObjectId() }, { name }, { upsert: true })
      .exec();

    return updateResult.upsertedId.toHexString();
  }

  private async updateDrivesAsync(
    accounts: AccountInfo[],
    entire = false,
    updateTaskId?: string,
  ) {
    for (const [i, account] of accounts.entries()) {
      await this.updateDriveAsync(account, entire);

      updateTaskId &&
        (await this.updateTaskModel
          .updateOne(
            { _id: updateTaskId },
            { progress: ((i + 1) / accounts.length) * 100 },
          )
          .exec());
    }

    updateTaskId &&
      (await this.updateTaskModel
        .updateOne({ _id: updateTaskId }, { completed: true })
        .exec());
  }

  private async updateDriveAsync(account: AccountInfo, entire = false) {
    const accessToken = (await this.msalService.acquireTokenSilent({ account }))
      .accessToken;

    // TODO 抛出异常待处理
    const newDrive = (await this.driveApisService.drive(accessToken)).data;

    const drive = await this.driveModel
      .findOneAndUpdate(
        { id: newDrive.id },
        { $set: newDrive },
        { upsert: true, new: true },
      )
      .exec();

    this.logger.log(drive.id, 'updateDrive');

    let nextLink = entire ? null : drive.deltaLink;
    let deltaLink: string;

    entire = !Boolean(nextLink) || entire;
    const lastEntireUpdateTag = drive.entireUpdateTag;
    const newEntireUpdateTag = `${Date.now()}`;

    while (!deltaLink) {
      // TODO 抛出异常待处理
      const res = await this.driveApisService.delta(accessToken, nextLink);
      nextLink = res.data['@odata.nextLink'];
      deltaLink = res.data['@odata.deltaLink'];

      const writes = res.data.value
        .filter((driveItem) => {
          if (driveItem['@odata.type'] != '#microsoft.graph.driveItem') {
            this.logger.warn(
              { message: 'Wrong @odata.type', ...driveItem },
              'updateItems',
            );
            return false;
          }
          return true;
        })
        .map((driveItem) => {
          // console.log(driveItem);
          return driveItem.deleted
            ? { deleteOne: { filter: { id: driveItem.id } } }
            : {
                updateOne: {
                  filter: { id: driveItem.id },
                  update: {
                    $set: {
                      ...driveItem,
                      ...(entire
                        ? { entireUpdateTag: newEntireUpdateTag }
                        : {}),
                    },
                  },
                  upsert: true,
                },
              };
        });

      const bulkWriteResult = await this.driveItemModel.bulkWrite(writes);

      const pickedRes = this._pick(bulkWriteResult, [
        'nInserted',
        'nUpserted',
        'nMatched',
        'nModified',
        'nRemoved',
      ]);

      this.logger.log({ message: drive.id, ...pickedRes }, 'updateItems');
    }

    // 删除无效数据
    if (entire && lastEntireUpdateTag) {
      await this.driveItemModel
        .deleteMany({
          'parentReference.driveId': drive.id,
          // entireUpdateTag 不等于 newEntireUpdateTag
          entireUpdateTag: { $ne: newEntireUpdateTag },
        })
        .exec();
    }

    // 保存deltaLink
    await this.driveModel
      .updateOne(
        { id: drive.id },
        {
          $set: {
            deltaLink,
            ...(entire ? { entireUpdateTag: newEntireUpdateTag } : {}),
          },
        },
      )
      .exec();
  }

  private _pick<T>(obj: T, keys: (keyof T)[]) {
    return keys.reduce((res, key) => {
      res[key] = obj[key];
      return res;
    }, <Partial<T>>{});
  }
}
