import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Pagination } from 'src/args';
import { Drive, DriveItem } from '../models';
import { DrivesService } from './drives.service';

@Resolver()
export class DrivesResolver {
  constructor(private readonly drivesService: DrivesService) {}

  @Query(() => [Drive])
  async drives(): Promise<Drive[]> {
    return await this.drivesService.findDrives();
  }

  @Mutation(() => String)
  async updateDrives(
    @Args('localAccountIds', { type: () => [String], nullable: true })
    localAccountIds?: string[],
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateDrives(localAccountIds, entire);
  }

  @Mutation(() => String)
  async updateDrive(
    @Args('localAccountId') localAccountId: string,
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateDrives(localAccountId, entire);
  }

  @Mutation(() => Boolean)
  async removeDrive(
    @Args('localAccountId') localAccountId: string,
  ): Promise<boolean> {
    const res = await this.drivesService.remove(localAccountId);

    if (!res) {
      throw new NotFoundException();
    }

    return true;
  }

  @Query(() => [DriveItem])
  async driveItems(
    @Args('parentReferenceId') parentReferenceId: string,
    @Args({ type: () => Pagination, nullable: true }) pagination?: Pagination,
  ): Promise<DriveItem[]> {
    return await this.drivesService.listDriveItems(
      parentReferenceId,
      pagination,
    );
  }

  @Query(() => DriveItem)
  async driveItem(@Args('id') id: string) {
    const driveItem = await this.drivesService.findDriveItem(id);

    if (!driveItem) {
      throw new NotFoundException();
    }

    return driveItem;
  }

  @Query(() => DriveItem)
  async getDriveItemByPath(@Args('path') path: string) {
    const driveItem = await this.drivesService.getDriveItemByPath(path);

    if (!driveItem) {
      throw new NotFoundException();
    }

    return driveItem;
  }
}
