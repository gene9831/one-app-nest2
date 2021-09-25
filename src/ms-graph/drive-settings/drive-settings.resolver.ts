import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
import { DriveSettings } from '../models';
import { DriveSettingsService } from './drive-settings.service';
import {
  AddAccessRule,
  DeleteAccessRule,
  UpdateAccessRule,
  UpdateDriveSettings,
} from '../inputs';

@Resolver(() => DriveSettings)
@Roles(Role.Admin)
@UseGuards(AuthJwtGuard)
export class DriveSettingsResolver {
  constructor(private readonly driveSettingsService: DriveSettingsService) {}

  @Query(() => DriveSettings, { description: `Roles: ${Role.Admin}` })
  async driveSettings(@Args('driveId') driveId: string) {
    const driveSettings = await this.driveSettingsService.findOneOrCreate(
      driveId,
    );

    if (!driveSettings) {
      throw new NotFoundException();
    }

    return driveSettings;
  }

  @Mutation(() => Int, { description: `Roles: ${Role.Admin}` })
  async updateDriveSettings(@Args() update: UpdateDriveSettings) {
    return await this.driveSettingsService.update(update);
  }

  @Mutation(() => Int, { description: `Roles: ${Role.Admin}` })
  async addAccessRule(@Args() addAccessRule: AddAccessRule) {
    const { driveId, action, path, password } = addAccessRule;
    return this.driveSettingsService.addAccessRule(
      driveId,
      action,
      path,
      password,
    );
  }

  @Mutation(() => Int, { description: `Roles: ${Role.Admin}` })
  async updateAccessRule(@Args() updateAccessRule: UpdateAccessRule) {
    const { driveId, _id, action, path, password } = updateAccessRule;
    return this.driveSettingsService.updateAccessRule(
      driveId,
      _id,
      action,
      path,
      password,
    );
  }

  @Mutation(() => Int, { description: `Roles: ${Role.Admin}` })
  async deleteAccessRule(@Args() deleteAccessRule: DeleteAccessRule) {
    const { driveId, _id } = deleteAccessRule;
    return this.driveSettingsService.deleteAccessRule(driveId, _id);
  }
}
