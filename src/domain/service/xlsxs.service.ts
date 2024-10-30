import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class ExcelService {
  /**
   * Reads an .xlsx file and converts it to JSON
   * @param filePath - path to the .xlsx file
   * @returns JSON representation of the Excel file
   */
  async readExcelToJson(filePath: string, file: string): Promise<any> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }

      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (file === 'tma-structure.xlsx') {
        const baseProperties = [
          'study_core_id',
          'core_id',
          'core_label',
          'tma_number',
          'row_index',
          'row_label',
          'col_index',
          'col_label',
          'is_empty',
        ];

        const transformedData = jsonData.map((core: any, index) => {
          const core_annotations = {};

          const base = baseProperties.reduce((obj, key) => {
            if (core.hasOwnProperty(key)) {
              obj[key] = core[key];
            }
            return obj;
          }, {});

          Object.keys(core).forEach((key) => {
            if (!baseProperties.includes(key) && key !== 'tma_name') {
              core_annotations[key] = core[key];
            }
          });

          return {
            ...base,
            core_annotations,
          };
        });

        return {
          type: 'tissue_microarray',
          name: jsonData[0] ? jsonData[0]['tma_name'] : '',
          design: {
            num_rows: Math.max(
              ...transformedData.map((core) => core['row_index'] || 0),
            ),
            num_cols: Math.max(
              ...transformedData.map((core) => core['col_index'] || 0),
            ),
            layout: 'landscape',
            cores: transformedData,
          },
        };
      }

      return jsonData;
    } catch (error) {
      throw new BadRequestException(
        `Error reading Excel file: ${error.message}`,
      );
    }
  }
}
