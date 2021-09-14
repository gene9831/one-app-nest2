import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
import { Drive } from '../models';
import { DrivesService } from './drives.service';

@Resolver(() => Drive)
@Roles(Role.Admin)
@UseGuards(AuthJwtGuard)
export class DrivesResolver {
  constructor(private readonly drivesService: DrivesService) {}

  @Query(() => [Drive], { description: `Roles: ${Role.Admin} | ${Role.Guest}` })
  @Roles(Role.Guest)
  async drives(): Promise<Drive[]> {
    return await this.drivesService.findMany();
  }

  @Mutation(() => String, { description: `Roles: ${Role.Admin}` })
  async updateDrives(
    @Args('localAccountIds', { type: () => [String], nullable: true })
    localAccountIds?: string[],
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateMany(localAccountIds, entire);
  }

  @Mutation(() => String, { description: `Roles: ${Role.Admin}` })
  async updateDrive(
    @Args('localAccountId') localAccountId: string,
    @Args('entire', { type: () => Boolean, defaultValue: false })
    entire = false,
  ): Promise<string> {
    return await this.drivesService.updateMany(localAccountId, entire);
  }

  @Mutation(() => Boolean, { description: `Roles: ${Role.Admin}` })
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
