import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriveApisService } from './drive-apis/drive-apis.service';
import { DrivesResolver } from './drives/drives.resolver';
import { DrivesService } from './drives/drives.service';
import {
  Drive,
  DriveItem,
  DriveItemScheme,
  DriveScheme,
  UpdateTask,
  UpdateTaskScheme,
} from './models';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Drive.name,
        schema: DriveScheme,
      },
      {
        name: DriveItem.name,
        schema: DriveItemScheme,
      },
      {
        name: UpdateTask.name,
        schema: UpdateTaskScheme,
      },
    ]),
    HttpModule,
  ],
  providers: [DriveApisService, DrivesService, DrivesResolver],
})
export class MsGraphModule {}
