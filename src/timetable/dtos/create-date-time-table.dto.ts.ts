import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDateTimeTableDto {
  @IsNotEmpty()
  @IsString()
  start_day_identifier: string;

  @IsNotEmpty()
  @IsString()
  timezone_identifier: string;

  @IsNotEmpty()
  @IsNumber()
  service_duration: number;

  @IsOptional()
  @IsNumber()
  days: number = 1;

  @IsOptional()
  @IsNumber()
  timeslot_interval: number = 1800;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  is_ignore_schedule: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  is_ignore_workhour: boolean = false;
}
