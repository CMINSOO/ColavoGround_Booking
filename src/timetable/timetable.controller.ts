import { Body, Controller, Post } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateDateTimeTableDto } from './dtos/create-date-time-table.dto.ts';

@Controller('getTimeSlots')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async getTimeSlots(@Body() createDateTimeTable: CreateDateTimeTableDto) {
    const data =
      await this.timetableService.createDayTimeTable(createDateTimeTable);
    return data;
  }
}
