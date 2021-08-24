import { HttpModule, Module } from '@nestjs/common';
import { DrivesService } from './drives/drives.service';
import { DriveItemsService } from './drive-items/drive-items.service';
import { DrivesResolver } from './drives/drives.resolver';
import { DriveItemsResolver } from './drive-items/drive-items.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Drive, DriveScheme } from './models';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Drive.name, schema: DriveScheme }]),
    HttpModule,
  ],
  providers: [
    DrivesService,
    DrivesResolver,
    DriveItemsService,
    DriveItemsResolver,
  ],
})
export class MsGraphModule {}
