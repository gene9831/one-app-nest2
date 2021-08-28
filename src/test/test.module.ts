import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpdateTaskScheme, UpdateTask } from 'src/ms-graph/models';
import { Test, TestSchema } from './model';
import { TestService } from './test.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Test.name,
        schema: TestSchema,
      },
      {
        name: UpdateTask.name,
        schema: UpdateTaskScheme,
      },
    ]),
  ],
  providers: [TestService],
})
export class TestModule {}
