import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateTask, UpdateTaskDocument } from '../models';

@Injectable()
export class UpdateTaskService {
  constructor(
    @InjectModel(UpdateTask.name)
    private readonly updateTaskModel: Model<UpdateTaskDocument>,
  ) {}

  async findOne(_id: any) {
    return await this.updateTaskModel.findById(_id).exec();
  }
}
