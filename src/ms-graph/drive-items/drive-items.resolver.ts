import { Pagination } from 'src/args';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
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
  constructor(private readonly driveItemsService: DriveItemsService) {}

  @Query(() => [DriveItem])
  async driveItems(
    @Args('parentReferenceId') parentReferenceId: string,
    @Args({ type: () => Pagination, nullable: true }) pagination?: Pagination,
  ): Promise<DriveItem[]> {
    return await this.driveItemsService.findMany(parentReferenceId, pagination);
  }

  @Query(() => DriveItem)
  async driveItem(
    @Args('id', { nullable: true }) id?: string,
    @Args('path', { nullable: true }) path?: string,
  ) {
    if (!Boolean(id || path)) {
      throw new BadRequestException('At least one non-empty parameter');
    }

    const driveItem = await (async () => {
      if (id) {
        return await this.driveItemsService.findOneById(id);
      } else if (path) {
        return await this.driveItemsService.findOneByPath(path);
      }
      return null;
    })();

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
