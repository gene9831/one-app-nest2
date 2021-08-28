import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateTask } from 'src/ms-graph/models';
import { Test } from './model';

@Injectable()
export class TestService {
  constructor(
    @InjectModel(Test.name) private readonly testModel: Model<Test>,
    @InjectModel(UpdateTask.name)
    private readonly updateTaskModel: Model<UpdateTask>,
  ) {
    // this.test();
  }

  async test() {
    setTimeout(() => {
      // this.testModel
      //   .findOneAndUpdate(
      //     { name: 'test1' },
      //     { c: 10 },
      //     { upsert: true, new: true },
      //   )
      //   .exec()
      //   .then((res) => {
      //     console.log(res);
      //   });

      // this.testModel
      //   .findOne({ name: 'test' })
      //   .exec()
      //   .then((res) => {
      //     console.log(res);
      //   });

      // this.updateTaskModel.insertMany({ name: 'updateTask' }).then((res) => {
      //   console.log(typeof res[0].id);
      // });
      this.testModel
        .updateOne({ _id: new Types.ObjectId() }, {}, { upsert: true })
        .exec()
        .then((res) => {
          console.log(res.upsertedId.toHexString());
        });

      // console.log(new Types.ObjectId());
    }, 1000);
  }
}
