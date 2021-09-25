import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Types as MongooseTypes } from 'mongoose';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { AuthJwtGuard } from 'src/guards';
import { UpdateTask } from '../models';
import { UpdateTaskService } from './update-task.service';

@Resolver(() => UpdateTask)
@Roles(Role.Admin)
@UseGuards(AuthJwtGuard)
export class UpdateTaskResolver {
  constructor(private readonly updateTaskService: UpdateTaskService) {}

  @Query(() => UpdateTask, { description: `Roles: ${Role.Admin}` })
  async updateTask(
    @Args('id')
    id: MongooseTypes.ObjectId,
  ): Promise<UpdateTask> {
    const updateTask = await this.updateTaskService.findOne(id);

    if (!updateTask) {
      throw new NotFoundException();
    }

    return updateTask;
  }
}
