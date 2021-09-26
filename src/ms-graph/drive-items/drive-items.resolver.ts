import { Pagination } from 'src/args';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
import { ItemsAndSettingsService } from '../common';
import { getDriveItemArgs } from '../inputs';
import { DriveItem } from '../models';
import { DriveItemsService } from './drive-items.service';
import {
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

@Resolver(() => DriveItem)
@UseGuards(AuthJwtGuard)
export class DriveItemsResolver {
  constructor(
    private readonly driveItemsService: DriveItemsService,
    private readonly itemsAndSettingsService: ItemsAndSettingsService,
  ) {}

  @Query(() => [DriveItem], {
    description: '(Id) 或 (path, driveId) 二选一，Id 优先',
  })
  async driveItems(
    @Args() args: getDriveItemArgs,
    @Args({ type: () => Pagination, nullable: true }) pagination?: Pagination,
  ): Promise<DriveItem[]> {
    if (!Boolean(args.id || (args.path && args.driveId))) {
      throw new BadRequestException(
        'Id is not empty or path and driveId are not empty',
      );
    }

    const driveItems = await this.driveItemsService.findMany(args, pagination);

    if (!driveItems) {
      throw new NotFoundException();
    }

    return driveItems;
  }

  @Query(() => DriveItem, {
    description: '(Id) 或 (path, driveId) 二选一，Id 优先',
  })
  async driveItem(@Args() args: getDriveItemArgs) {
    if (!Boolean(args.id || (args.path && args.driveId))) {
      throw new BadRequestException(
        'Id is not empty or path and driveId are not empty',
      );
    }

    const driveItem = await this.driveItemsService.findOne(args);

    if (!driveItem) {
      throw new NotFoundException();
    }

    return driveItem;
  }

  @ResolveField(() => DriveItem)
  async shareLink(@Parent() parent: DriveItem) {
    return await this.driveItemsService.getShareLink(parent);
  }

  @Mutation(() => String, { description: `Roles: ${Role.Admin}` })
  @Roles(Role.Admin)
  async createShareLink(@Args('id') id: string) {
    const shareLink = await this.driveItemsService.createShareLink(id);

    if (!shareLink) {
      throw new NotFoundException();
    }

    return shareLink;
  }

  @Mutation(() => String, { description: `Roles: ${Role.Admin}` })
  @Roles(Role.Admin)
  async deleteShareLink(@Args('id') id: string) {
    return Boolean(await this.driveItemsService.deleteSharePerm(id));
  }
}
