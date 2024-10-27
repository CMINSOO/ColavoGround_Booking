import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Event, Workhour } from '../interfaces/interfaces';

export class GenerateDayTimetableDto {
  @IsNotEmpty()
  @IsNumber()
  offset: number;

  @IsNotEmpty()
  @IsString()
  startDay: string;

  @IsNotEmpty()
  @IsString()
  timezone_identifier: string;

  @IsOptional()
  @IsNumber()
  timeslot_interval: number = 1800;

  @IsNotEmpty()
  @IsNumber()
  service_duration: number;

  @IsArray()
  events: Event[];

  @IsBoolean()
  is_ignore_schedule: boolean;

  @IsArray()
  workHours: Workhour[];

  @IsBoolean()
  is_ignore_workhour: boolean;
}
