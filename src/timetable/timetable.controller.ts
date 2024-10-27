import { Body, Controller, Post } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateDateTimeTableDto } from './dtos/create-date-time-table.dto.ts';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async getTimeSlots(@Body() createDateTimeTable: CreateDateTimeTableDto) {
    const data =
      await this.timetableService.createDayTimeTable(createDateTimeTable);
    console.log('컨트롤러 데이타@@@@@@', data[0].timeslots);
    return data;
  }
}
