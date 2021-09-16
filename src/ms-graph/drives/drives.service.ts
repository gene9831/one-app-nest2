import { AccountInfo } from '@azure/msal-node';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
        const account = await tokenCache.getAccountByLocalId(localAccountId);
        account && accounts.push(account);
      }
    } else if (typeof localAccountIds === 'string') {
      const account = await tokenCache.getAccountByLocalId(localAccountIds);
      account && accounts.push(account);
    } else {
      accounts.push(...(await tokenCache.getAllAccounts()));
    }

    const updateTaskId = (
      await this.updateTaskModel.create({ name: 'updateTask' })
    )._id.toHexString();

    this.updateDrivesAsync(accounts, updateTaskId, entire);

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

  private async updateDrivesAsync(
    accounts: AccountInfo[],
    updateTaskId: string,
    entire = false,
  ) {
    this.logger.log(`[${updateTaskId}] starting`, 'updateTask');

    try {
      for (const [i, account] of accounts.entries()) {
        await this.updateDriveAsync(account, entire);

        await this.updateTaskModel
          .updateOne(
            { _id: updateTaskId },
            { progress: ((i + 1) / accounts.length) * 100 },
          )
          .exec();
      }

      await this.updateTaskModel
        .updateOne(
          { _id: updateTaskId },
          { completed: UpdateTask.Completed.SUCCESS },
        )
        .exec();

      this.logger.log(`[${updateTaskId}] succeed`, 'updateTask');
    } catch (err) {
      this.logger.log(`[${updateTaskId}] failed`, 'updateTask');
      this.logger.error(err);
      throw err;
    }
  }

  private async updateDriveAsync(account: AccountInfo, entire = false) {
    const accessToken = await this.msalService.acquireAccessTokenSilent({
      account,
    });

    // TODO 抛出异常待处理
    const newDrive = (await this.driveApisService.drive(accessToken)).data;

    let drive = await this.driveModel
      .findOneAndUpdate({ id: newDrive.id }, { $set: newDrive })
      .exec();

    if (!drive) {
      drive = await this.driveModel.create(newDrive);
    }

    this.logger.log(drive.id, 'updateDrive');

    let nextLink = entire ? void 0 : drive.deltaLink;
    let deltaLink: string | undefined = void 0;

    entire = !Boolean(nextLink) || entire;
    const lastEntireUpdateTag = drive.entireUpdateTag;
    const newEntireUpdateTag = `${Date.now()}`;

    while (!deltaLink) {
      // TODO 抛出异常待处理
      const res = await this.driveApisService.delta(accessToken, nextLink);
      nextLink = res.data['@odata.nextLink'];
      deltaLink = res.data['@odata.deltaLink'];

      const writeResult = {
        nInserted: 0,
        nUpdated: 0,
        nDeleted: 0,
      };

      for (const driveItem of res.data.value) {
        if (driveItem['@odata.type'] != '#microsoft.graph.driveItem') {
          this.logger.warn(
            { message: 'Wrong @odata.type', ...driveItem },
            'updateItems',
          );
          continue;
        }

        if (driveItem.deleted) {
          const deleteResult = await this.driveItemModel
            .deleteOne({ id: driveItem.id })
            .exec();
          writeResult.nDeleted += deleteResult.deletedCount;
        } else {
          const item = await this.driveItemModel.findOneAndUpdate(
            { id: driveItem.id },
            {
              $set: {
                ...driveItem,
                ...(entire ? { entireUpdateTag: newEntireUpdateTag } : {}),
              },
            },
          );

          if (!item) {
            await this.driveItemModel.create(driveItem);
            writeResult.nInserted += 1;
          } else {
            writeResult.nUpdated += 1;
          }
        }
      }

      this.logger.log({ message: drive.id, ...writeResult }, 'updateItems');
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
}
