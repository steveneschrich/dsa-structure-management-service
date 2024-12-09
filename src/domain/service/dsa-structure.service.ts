import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { get } from 'config';

import { DSAService, ParentType } from './dsa.service';
import { ExcelService } from './xlsxs.service';

/**
 * Service responsible for managing the structure of directories and files within a DSA system.
 * Includes methods for reading directories, uploading files, and creating folder structures.
 * @class
 */
@Injectable()
export class DSAStructureService {
  /**
   * Constructs the DSAStructureService.
   * @param {DSAService} dsaService - The DSA service for folder and file operations.
   * @param {ExcelService} excelService - The service for handling Excel file processing.
   */
  constructor(
    private readonly dsaService: DSAService,
    private readonly excelService: ExcelService,
  ) {}

  /**
   * Path to the root folder for DSA operations, as specified in the configuration.
   * @type {string}
   */
  folderPath = path.join(__dirname, '../../../../', get('dsa.folderName'));

  /**
   * Collection of base folders within the structure.
   * @type {Array<any>}
   */
  baseCollectionFolders = [];

  /**
   * Recursively reads files and directories from a given folder, processes Excel files,
   * and uploads them to a remote storage system.
   *
   * @param {string} folderPath - The path to the folder to be processed.
   * @param {string} [parentId=get('dsa.baseCollection')] - The ID of the parent folder or collection.
   * @param {ParentType} [parentType=ParentType.COLLECTION] - The type of the parent (e.g., collection or folder).
   * @returns {Promise<void>}
   */
  async readFilesInFolder(
    folderPath: string,
    parentId = get('dsa.baseCollection'),
    parentType = ParentType.COLLECTION,
    isRootLevel = true,
  ): Promise<void> {
    const folderFiles = await fs.readdir(folderPath);

    for (const file of folderFiles) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        if (isRootLevel) {
          let dsaCollection = await this.dsaService.getCollection(file);

          console.log('collection', dsaCollection, file);

          const isCollectionCreated = await dsaCollection.filter(
            (collection) => collection.name === file,
          );

          if (isCollectionCreated.length === 0) {
            dsaCollection = await this.dsaService.createCollection(file);
          } else {
            dsaCollection = isCollectionCreated[0];
          }

          await this.readFilesInFolder(
            filePath,
            dsaCollection._id,
            ParentType.COLLECTION,
            false,
          );
        } else {
          let dsaFolder = await this.dsaService.getFolders(
            parentType,
            parentId,
            file,
          );

          if (dsaFolder.length === 0) {
            dsaFolder = await this.dsaService.createFolder(
              parentType,
              parentId,
              file,
            );
          } else {
            dsaFolder = dsaFolder[0];
          }

          await this.readFilesInFolder(
            filePath,
            dsaFolder._id,
            dsaFolder._modelType,
            false,
          );
        }
      } else {
        if (
          file !== '.DS_Store' &&
          !file.includes('~$') &&
          !file.includes('.json') &&
          !file.includes('_error_log')
        ) {
          if (file.endsWith('.xlsx')) {
            try {
              const dsaFile = await this.dsaService.getItem(
                parentId,
                file.replace('.xlsx', '.json'),
              );

              if (dsaFile.length !== 0) {
                await this.dsaService.deleteItem(dsaFile[0]._id);
              }

              const jsonData = await this.excelService.readExcelToJson(
                filePath,
                file,
              );

              const jsonFilePath = filePath.replace('.xlsx', '.json');

              await fs.writeFile(
                jsonFilePath,
                JSON.stringify(jsonData),
                'utf8',
              );

              await this.dsaService.uploadFileToFolder(
                parentId,
                parentType,
                jsonFilePath,
                path.basename(jsonFilePath),
                Buffer.byteLength(JSON.stringify(jsonData)),
              );

              if (jsonFilePath.includes('stain')) {
                await this.dsaService.addFolderMetadata(parentId, {
                  type: 'tissue_microarray_stain',
                });
              }

              Logger.debug(`Uploaded JSON for ${file}`);
            } catch (error) {
              const errorLogPath = filePath.replace('.xlsx', '_error_log.txt');
              const errorMessage = `Failed to process file: ${file}\nError: ${error.message}\nStack: ${error.stack}`;

              await fs.writeFile(errorLogPath, errorMessage, 'utf8');

              Logger.error(
                `Failed to process ${file}. Error details saved to ${errorLogPath}`,
              );
            }
          } else {
            const dsaFile = await this.dsaService.getItem(parentId, file);

            if (dsaFile.length === 0) {
              await this.dsaService.uploadFileToFolder(
                parentId,
                parentType,
                filePath,
                file,
                stats.size,
              );

              Logger.debug(`Uploaded file ${file}`);
            }
          }
        }
      }
    }

    Logger.debug('Finished updating folder and files...');
  }

  /**
   * Creates a folder if it does not already exist.
   * @param {string} folderPath - The path of the folder to create.
   */
  createFolder(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      try {
        Logger.log(`Creating lab folder <${folderPath}>...`);
        fs.mkdirSync(`${folderPath}`);
      } catch (err) {
        Logger.error(
          `Error while creating lab folder <${folderPath}>, error: ${err}`,
        );
      }
    }
  }

  /**
   * Creates a folder structure based on a specified configuration object.
   * @param {Object} folderStructure - The structure defining labs, studies, and samples.
   */
  async createFolderStructure(folderStructure: any): Promise<void> {
    for (const lab in folderStructure.labs) {
      this.createFolder(`${this.folderPath}/${lab}`);

      const studies = folderStructure.labs[lab].studies;
      for (const study in studies) {
        this.createFolder(`${this.folderPath}/${lab}/${study}`);
        const samples = folderStructure.labs[lab].studies[study];

        for (const sample in samples) {
          this.createFolder(
            `${this.folderPath}/${lab}/${study}/${samples[sample]}`,
          );
        }
      }
    }
  }

  /**
   * Initiates authentication and begins reading files within the configured folder.
   * @returns {Promise<void>}
   */
  async startReading(): Promise<void> {
    await this.dsaService.authenticate();
    await this.readFilesInFolder(this.folderPath);
  }
}
