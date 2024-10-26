import { Body, Controller, Post } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateDateTimeTableDto } from './dtos/getTimeSlots.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async getTimeSlots(@Body() createDateTimeTable: CreateDateTimeTableDto) {
    return this.timetableService.createDayTimeTable(createDateTimeTable);
  }
}
