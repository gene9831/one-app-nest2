import { HttpService, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MsalService } from 'src/msal/msal.service';
import { MS_GRAPH_API } from '../constants';
import { Drive } from '../models';

@Injectable()
export class DrivesService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<Drive>,
    private readonly msalServie: MsalService,
    private readonly httpService: HttpService,
  ) {}

  async acquireDrives(): Promise<Drive[]> {
    const tokenCahce = this.msalServie.getTokenCache();
    const accounts = await tokenCahce.getAllAccounts();
    const drives = new Array<Drive>();

    for (const account of accounts) {
      try {
        const accessToken = (
          await this.msalServie.acquireTokenSilent({ account })
        ).accessToken;

        const res = await this.httpService
          .get<Drive>(`${MS_GRAPH_API}/me/drive`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .toPromise();

        if (res.status == 200 && res.data.id) {
          const drive =
            (await this.driveModel.findOne({ id: res.data.id })) ||
            new this.driveModel();

          await drive.updateFields(res.data).save();
          drives.push(drive);
        }
      } catch (err) {
        throw err;
      }
    }
    return drives;
  }
}
