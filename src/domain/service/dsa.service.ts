import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs-extra';
import { get } from 'config';

const FormData = require('form-data');
const stream = require('stream');

/**
 * Service for interacting with DSA API.
 */
@Injectable()
export class DSAService {
  private girderToken: string | null = null;

  constructor() {}

  /**
   * Authenticates with the DSA API and retrieves a token.
   * @param {string} [dsaUser] - DSA username from configuration.
   * @param {string} [dsaPassword] - DSA password from configuration.
   * @returns {Promise<any>} The authentication data including token.
   */
  async authenticate(
    dsaUser = get('dsa.username'),
    dsaPassword = get('dsa.password'),
  ) {
    try {
      const encodedToken = Buffer.from(`${dsaUser}:${dsaPassword}`).toString(
        'base64',
      );
      const url = `${get('dsa.host')}/api/v1/user/authentication`;

      Logger.debug(
        `DSA: Calling authentication endpoint for user ${dsaUser}, with url ${url}, Basic ${encodedToken}`,
      );

      const axiosConfig: AxiosRequestConfig = {
        method: 'get',
        url,
        maxBodyLength: Infinity,
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${encodedToken}`,
        },
      };

      const { data } = await axios.request(axiosConfig);
      this.girderToken = data.authToken.token;
      return data;
    } catch (error) {
      Logger.error(`DSA: Failed to authenticate with error ${error}`);
    }
  }

  async getCollection(name: string) {
    try {
      Logger.debug(`DSA: Calling get collections endpoint`);

      const axiosConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/collection?text=${name}&limit=1&offset=0&sort=name&sortdir=1`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      console.log(data);
      return data;
    } catch (error) {
      Logger.error(`DSA: Failed to get collection from endpoint: ${error}`);
    }
  }

  async createCollection(name: string) {
    try {
      Logger.debug(`DSA: Calling create collection endpoint`);
      const axiosConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${get('dsa.host')}/api/v1/collection?name=${encodeURIComponent(
          name,
        )}&public=false`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(
        `DSA: Failed to create collection endpoint with error: ${error}`,
      );
    }
  }

  /**
   * Retrieves folders under a specified parent.
   * @param {string} parentType - Type of the parent (e.g., 'folder').
   * @param {string} parentId - ID of the parent.
   * @param {string} name - Name filter for folders.
   * @returns {Promise<any>} The retrieved folders data.
   */
  async getFolders(parentType: string, parentId: string, name: string) {
    try {
      Logger.debug(`DSA: Calling get folders endpoint`);

      const axiosConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/folder?parentType=${parentType}&parentId=${parentId}&name=${name}&limit=50&offset=0&sort=lowerName&sortdir=1`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const response = await axios.request(axiosConfig);

      return response.data;
    } catch (error) {
      console.log(error);
      Logger.error(`DSA: Failed to get folders from endpoint: ${error}`);
    }
  }

  /**
   * Creates a folder under a specified parent.
   * @param {string} parentType - Type of the parent (e.g., 'folder').
   * @param {string} parentId - ID of the parent.
   * @param {string} name - Name of the new folder.
   * @returns {Promise<any>} The created folder data.
   */
  async createFolder(parentType: string, parentId: string, name: string) {
    try {
      Logger.debug(`DSA: Calling create folder endpoint`);

      const axiosConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/folder?parentType=${parentType}&parentId=${parentId}&name=${name}&reuseExisting=false`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(
        `DSA: Failed to create folder endpoint with error: ${error}`,
      );
    }
  }

  /**
   * Adds metadata to a specified folder.
   * @param {string} folderId - ID of the folder.
   * @param {any} metadata - Metadata to add.
   * @returns {Promise<any>} The updated folder data.
   */
  async addFolderMetadata(folderId: string, metadata: any) {
    try {
      Logger.debug(`DSA: Calling add metadata endpoint`);

      const axiosConfig = {
        method: 'put',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/folder/${folderId}/metadata?allowNull=false`,
        data: metadata,
        headers: {
          'Content-Type': 'application/json',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(`DSA: Error adding metadata to folder: ${error}`);
    }
  }

  /**
   * Retrieves an item under a specified folder by name.
   * @param {string} parentId - ID of the parent folder.
   * @param {string} name - Name of the item.
   * @returns {Promise<any>} The retrieved item data.
   */
  async getItem(parentId: string, name: string) {
    try {
      Logger.debug(`DSA: Calling get items endpoint`);

      const axiosConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/item?folderId=${parentId}&name=${name}&limit=50&offset=0&sort=lowerName&sortdir=1`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      console.log(error);
      Logger.error(`DSA: Error getting item from endpoint: ${error}`);
    }
  }

  /**
   * Deletes a file by ID.
   * @param {string} fileId - ID of the file.
   * @returns {Promise<any>} The deletion response data.
   */
  async deleteFile(fileId: string) {
    try {
      Logger.debug(`DSA: Calling delete file endpoint`);

      const axiosConfig = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: `${get('dsa.host')}/api/v1/file/${fileId}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(`DSA: Error deleting file from endpoint: ${error}`);
    }
  }

  /**
   * Deletes an item by ID.
   * @param {string} itemId - ID of the item.
   * @returns {Promise<any>} The deletion response data.
   */
  async deleteItem(itemId: string) {
    try {
      Logger.debug(`DSA: Calling delete item endpoint`);

      const axiosConfig = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: `${get('dsa.host')}/api/v1/item/${itemId}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(`DSA: Error deleting item from endpoint: ${error}`);
    }
  }

  /**
   * Creates an item within a specified parent folder.
   * @param {string} parentType - Type of the parent (e.g., 'folder').
   * @param {string} parentId - ID of the parent.
   * @param {string} name - Name of the new item.
   * @param {number} size - Size of the item.
   * @returns {Promise<any>} The created item data.
   */
  async createItem(
    parentType: string,
    parentId: string,
    name: string,
    size: number,
  ) {
    try {
      Logger.debug(`DSA: Calling create item endpoint`);

      const axiosConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${get(
          'dsa.host',
        )}/api/v1/file?parentType=${parentType}&parentId=${parentId}&name=${name}&size=${size}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Girder-Token': this.girderToken,
        },
      };

      const { data } = await axios.request(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(`DSA: Failed to create item endpoint with error: ${error}`);
    }
  }

  /**
   * Divides a file into chunks for upload.
   * @param {string} filePath - Path to the file.
   * @param {number} chunkSize - Size of each chunk in bytes.
   * @param {number} fileSize - Total size of the file.
   * @returns {Promise<{size: number, stream: fs.ReadStream, offset: number}[]>} Array of file chunks.
   */
  async divideFileIntoChunks(
    filePath: string,
    chunkSize: number,
    fileSize: number,
  ) {
    const chunks = [];
    let offset = 0;

    while (offset < fileSize) {
      const chunk = {
        size: Math.min(chunkSize, fileSize - offset),
        stream: fs.createReadStream(filePath, {
          start: offset,
          end: offset + Math.min(chunkSize, fileSize - offset) - 1,
        }),
        offset: offset,
      };

      chunks.push(chunk);
      offset += chunkSize;
    }

    return chunks;
  }

  /**
   * Uploads a file to a folder in chunks.
   * @param {string} folderId - ID of the folder.
   * @param {string} parentType - Type of the parent (e.g., 'folder').
   * @param {string} filePath - Path to the file.
   * @param {string} name - Name of the file.
   * @param {number} size - Size of the file in bytes.
   * @returns {Promise<any>} The uploaded file data.
   */
  async uploadFileToFolder(
    folderId: string,
    parentType: string,
    filePath: string,
    name: string,
    size: number,
  ) {
    try {
      Logger.debug(`DSA: Calling upload file endpoint`);

      const chunkSize = 64 * 1024 * 1024; // 64MB chunks
      const url = `${get('dsa.host')}/api/v1/file`;

      const formData = new FormData();
      formData.append('parentId', folderId);
      formData.append('name', name);
      formData.append('size', size.toString());
      formData.append('parentType', parentType);

      const headers = {
        ...formData.getHeaders(),
        'Girder-Token': this.girderToken,
      };

      const response = await axios.post(url, formData, { headers });
      const chunks = await this.divideFileIntoChunks(filePath, chunkSize, size);

      const uploadChunk = async (
        chunk: { size: number; stream: fs.ReadStream; offset: number },
        uploadId: string,
      ) => {
        await axios.post(
          `${get('dsa.host')}/api/v1/file/chunk?offset=${
            chunk.offset
          }&uploadId=${uploadId}`,
          chunk.stream,
          {
            headers: {
              'Girder-Token': this.girderToken,
              'Content-Type': 'application/octet-stream',
            },
          },
        );
      };

      for await (const chunk of chunks) {
        await uploadChunk(chunk, response.data._id);
      }

      Logger.debug(`DSA: File upload complete`);
      return response.data;
    } catch (error) {
      Logger.error(`DSA: Failed to upload file to Folder: ${error.message}`);
    }
  }

  /**
   * Uploads a file chunk to an item by ID.
   * @param {string} uploadId - Upload ID for the item.
   * @param {string} filePath - Path to the file chunk.
   * @returns {Promise<any>} The response data after chunk upload.
   */
  async uploadFileToItem(uploadId: string, filePath: string) {
    try {
      Logger.debug(`DSA: Calling upload item endpoint`);

      const fileData = fs.readFileSync(filePath);

      const axiosConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        data: fileData,
        url: `${get(
          'dsa.host',
        )}/api/v1/file/chunk?offset=0&uploadId=${uploadId}`,
        headers: {
          'Girder-Token': this.girderToken,
          'Content-Type': 'application/octet-stream',
        },
      };

      const { data } = await axios(axiosConfig);
      return data;
    } catch (error) {
      Logger.error(`DSA: Failed to upload file with error ${error}`);
    }
  }
}

/**
 * Enumeration for Parent Types.
 * @readonly
 * @enum {string}
 */
export enum ParentType {
  COLLECTION = 'collection',
  FOLDER = 'folder',
}
