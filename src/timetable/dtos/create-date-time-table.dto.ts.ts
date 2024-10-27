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
  startDayIdentifier: string;

  @IsNotEmpty()
  @IsString()
  timezoneIdentifier: string;

  @IsNotEmpty()
  @IsNumber()
  serviceDuration: number;

  @IsOptional()
  @IsNumber()
  days: number = 1;

  @IsOptional()
  @IsNumber()
  timeslotInterval: number = 1800;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  isIgnoreSchedule: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => [true, 'true'].includes(value))
  isIgnoreWorkhour: boolean = false;
}
