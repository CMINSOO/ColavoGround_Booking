import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class JsonLoaderService {
  private async loadJson(fileName: string) {
    const filePath = path.resolve('assets', fileName);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  async getWorkHours() {
    return this.loadJson('workhours.json');
  }

  async getEvents() {
    return this.loadJson('event.json');
  }
}
