import { Body, Controller, Post } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { GetTimeSlotsDto } from './dtos/getTimeSlots.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async getTimeSlots(@Body() getTimeSlotsDto: GetTimeSlotsDto) {
    return this.timetableService.getAvailableTimeSlots(getTimeSlotsDto);
  }
}
