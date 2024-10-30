import { Controller, Get } from '@nestjs/common';
import { DSAStructureService } from './domain/service/dsa-structure.service';

@Controller()
export class AppController {
  constructor(private readonly dsaStructureService: DSAStructureService) {}

  @Get('/files')
  async getFiles() {
    return await this.dsaStructureService.startReading();
  }
}
