import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { UpdateTask } from '../models';
import { UpdateTaskService } from './update-task.service';

@Resolver()
export class UpdateTaskResolver {
  constructor(private readonly updateTaskService: UpdateTaskService) {}

  @Query(() => UpdateTask)
  async updateTask(
    @Args('id', { type: () => Types.ObjectId }) id: Types.ObjectId,
  ): Promise<UpdateTask> {
    const updateTask = await this.updateTaskService.findOne(id);

    if (!updateTask) {
      throw new NotFoundException();
    }

    return updateTask;
  }
}
