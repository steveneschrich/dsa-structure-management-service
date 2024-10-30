import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DSAStructureService } from './dsa-structure.service';

/**
 * Service for handling scheduled tasks.
 */
@Injectable()
export class TaskService {
  constructor(private readonly dsaStructureService: DSAStructureService) {}
  private readonly logger = new Logger(TaskService.name);

  /**
   * Cron job that synchronizes folders and files daily at 1 AM.
   * Invokes the `startReading` method of `DSAStructureService`.
   * @returns {Promise<void>} Resolves once the synchronization is complete.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async getActivitiesCron(): Promise<void> {
    this.logger.debug('Synchronizing Folders and Files');
    await this.dsaStructureService.startReading();
  }
}
