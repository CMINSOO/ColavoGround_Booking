import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TimetableModule } from './timetable/timetable.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TimetableModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
