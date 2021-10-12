import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriveApisService } from './drive-apis/drive-apis.service';
import { DriveItemsResolver } from './drive-items/drive-items.resolver';
import { DriveItemsService } from './drive-items/drive-items.service';
import { DriveSettingsResolver } from './drive-settings/drive-settings.resolver';
import { DriveSettingsService } from './drive-settings/drive-settings.service';
import { DrivesResolver } from './drives/drives.resolver';
import { DrivesService } from './drives/drives.service';
import { UpdateTaskResolver } from './update-task/update-task.resolver';
import { UpdateTaskService } from './update-task/update-task.service';
import {
  Drive,
  DriveItem,
  DriveItemScheme,
  DriveScheme,
  DriveSettings,
  DriveSettingsSchema,
  UpdateTask,
  UpdateTaskScheme,
} from './models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Drive.name, schema: DriveScheme },
      { name: DriveItem.name, schema: DriveItemScheme },
      { name: UpdateTask.name, schema: UpdateTaskScheme },
      { name: DriveSettings.name, schema: DriveSettingsSchema },
    ]),
    HttpModule,
  ],
  providers: [
    DriveApisService,
    DrivesService,
    DrivesResolver,
    UpdateTaskService,
    UpdateTaskResolver,
    DriveItemsService,
    DriveItemsResolver,
    DriveSettingsService,
    DriveSettingsResolver,
  ],
})
export class MsGraphModule {}
