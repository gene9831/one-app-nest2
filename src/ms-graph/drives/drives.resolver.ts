import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Drive } from '../models';
import { DrivesService } from './drives.service';

@Resolver()
export class DrivesResolver {
  constructor(private readonly drivesService: DrivesService) {}

  @Query(() => [Drive])
  async drives(): Promise<Drive[]> {
    return await this.drivesService.findMany();
  }

  @Mutation(() => String)
  async updateDrives(
    @Args('localAccountIds', { type: () => [String], nullable: true })
    localAccountIds?: string[],
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateMany(localAccountIds, entire);
  }

  @Mutation(() => String)
  async updateDrive(
    @Args('localAccountId') localAccountId: string,
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateMany(localAccountId, entire);
  }

  @Mutation(() => Boolean)
  async removeDrive(
    @Args('localAccountId') localAccountId: string,
  ): Promise<boolean> {
    const res = await this.drivesService.deleteOne(localAccountId);

    if (!res) {
      throw new NotFoundException();
    }

    return true;
  }
}
