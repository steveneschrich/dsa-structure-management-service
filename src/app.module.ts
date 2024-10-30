import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DSAStructureService } from './domain/service/dsa-structure.service';
import { DSAService } from './domain/service/dsa.service';
import { TaskService } from './domain/service/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ExcelService } from './domain/service/xlsxs.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [DSAStructureService, DSAService, TaskService, ExcelService],
})

export class AppModule {}
