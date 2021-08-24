import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Drive } from '../models';
import { DrivesService } from './drives.service';

@Resolver(() => Drive)
export class DrivesResolver {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<Drive>,
    private readonly drivesService: DrivesService,
  ) {}

  @Query(() => [Drive])
  async drives(): Promise<Drive[]> {
    return await this.driveModel.find();
  }

  @Mutation(() => [Drive])
  async acquireDrives(): Promise<Drive[]> {
    return await this.drivesService.acquireDrives();
  }
}
