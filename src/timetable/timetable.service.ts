import { BadRequestException, Injectable } from '@nestjs/common';
import { JsonLoaderService } from './json-loader.service';
import { GetTimeSlotsDto } from './dtos/getTimeSlots.dto';
import { format } from 'date-fns/format';

@Injectable()
export class TimetableService {
  constructor(private readonly jsonLoader: JsonLoaderService) {}
  //시작일 형식바꿔주는 함수

  async getAvailableTimeSlots(getTimeSlotsDto: GetTimeSlotsDto) {
    const {
      start_day_identifier,
      days,
      service_duration,
      timeslot_interval,
      is_ignore_schedule,
      is_ignore_workhour,
    } = getTimeSlotsDto;

    //json파일 읽어온것
    const workHours = await this.jsonLoader.getWorkHours();
    console.log(workHours);
    const events = await this.jsonLoader.getEvents();
    console.log(events);
    //start_day_identifier을 yyyymmdd형식으로 바꾼것
    const formattedStartDay = await this.formatStartDay(start_day_identifier);
    console.log('##', formattedStartDay);
  }

  async formatStartDay(input: string) {
    // YYYY년 M월 D일 형식일 경우 처리
    const match = input.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (match) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, year, month, day] = match;
      return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
    }
    // YYYYMMDD, YYYYMDD, YYYYMMd와 같은 형식 처리
    else if (/^\d{6,8}$/.test(input)) {
      const year = input.slice(0, 4);
      const month = input.slice(4, input.length - 2).padStart(2, '0');
      const day = input.slice(input.length - 2).padStart(2, '0');
      return `${year}${month}${day}`;
    }
    // 올바르지 않은 형식
    else {
      throw new BadRequestException('올바르지 않은 날짜 형식입니다');
    }
  }
}
