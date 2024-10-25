import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { JsonLoaderService } from './json-loader.service';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService, JsonLoaderService],
})
export class TimetableModule {}
