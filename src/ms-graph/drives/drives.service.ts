import { AccountInfo } from '@azure/msal-node';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { MsalService } from 'src/msal/msal.service';
import { Pagination } from '../../args';
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

  async findDrives(): Promise<Drive[]> {
    return await this.driveModel.find().exec();
  }

  async updateDrives(localAccountIds?: string | string[]) {
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

    this.updateDrivesAsync(accounts, updateTaskId);

    return updateTaskId;
  }

  async remove(localAccountId: string) {
    return await this.driveModel
      .deleteMany({ 'owner.user.id': localAccountId })
      .exec();
  }

  async listDriveItems(parentReferenceId: string, pagination?: Pagination) {
    return await this.driveItemModel
      .find({ 'parentReference.id': parentReferenceId }, null, {
        skip: pagination.skip,
        limit: pagination.limit,
        sort: { [pagination.sortKey || 'name']: pagination.order },
      })
      .exec();
  }

  async findDriveItem(id: string) {
    return await this.driveItemModel.findOne({ id }).exec();
  }

  private async createUpdateTask(name = 'updateTask') {
    const updateResult = await this.updateTaskModel
      .updateOne({ _id: new Types.ObjectId() }, { name }, { upsert: true })
      .exec();

    return updateResult.upsertedId.toHexString();
  }

  private async updateDrivesAsync(
    accounts: AccountInfo[],
    updateTaskId?: string,
  ) {
    for (const [i, account] of accounts.entries()) {
      await this.updateDriveAsync(account);

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

  private async updateDriveAsync(account: AccountInfo) {
    const accessToken = (await this.msalService.acquireTokenSilent({ account }))
      .accessToken;

    // TODO 抛出异常待处理
    const drive = (await this.driveApisService.drive(accessToken)).data;

    const updatedDrive = await this.driveModel
      .findOneAndUpdate(
        { id: drive.id },
        { $set: drive },
        { upsert: true, new: true },
      )
      .exec();

    this.logger.log(drive.id, 'updateDrive');

    let nextLink = updatedDrive.deltaLink;
    let deltaLink: string;

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
          console.log(driveItem);
          return {
            updateOne: {
              filter: { id: driveItem.id },
              update: { $set: driveItem },
              upsert: true,
            },
          };
        });

      const bulkWriteResult = await this.driveItemModel.bulkWrite(writes);

      const pickedRes = this._pick(bulkWriteResult, [
        'insertedCount',
        'matchedCount',
        'modifiedCount',
        'deletedCount',
        'upsertedCount',
      ]);

      this.logger.log({ message: drive.id, ...pickedRes }, 'updateItems');
    }

    // 保存deltaLink
    await this.driveModel
      .updateOne({ id: drive.id }, { $set: { deltaLink } })
      .exec();
  }

  private _pick<T>(obj: T, keys: (keyof T)[]) {
    return keys.reduce((res, key) => {
      res[key] = obj[key];
      return res;
    }, <Partial<T>>{});
  }
}
