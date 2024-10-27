import { Body, Controller, Post } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateDateTimeTableDto } from './dtos/create-date-time-table.dto.ts';
import { DayTimetable } from './interfaces/interfaces';

@Controller('getTimeSlots')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async getTimeSlots(
    @Body() createDateTimeTable: CreateDateTimeTableDto,
  ): Promise<DayTimetable[]> {
    const data =
      await this.timetableService.createDayTimeTable(createDateTimeTable);
    return data;
  }
}
