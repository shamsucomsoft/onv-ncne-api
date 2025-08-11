import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, type DownloadResponse } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

export interface StorageFile {
  buffer: Buffer;
  metadata: Map<string, string>;
  contentType: string;
}

export interface FileMetadata {
  [key: string]: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storage: Storage;
  private publicBucket: string;
  private privateBucket: string;
  private localStoragePath: string;
  private storageLocation: 'GCP' | 'LOCAL';

  constructor(private readonly configService: ConfigService) {
    this.storageLocation = this.configService.get<string>('STORAGE_LOCATION') === 'GCP' ? 'GCP' : 'LOCAL';
    this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH') || './storage';

    if (this.storageLocation === 'GCP') {
      this.initializeGCPStorage();
    } else {
      this.initializeLocalStorage();
    }
  }

  private initializeGCPStorage() {
    const serviceAccountKeyPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const clientEmail = this.configService.get<string>('SA_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('SA_PRIVATE_KEY');
    const projectId = this.configService.get<string>('GCP_PROJECT_ID') || 'pipa-projects';

    try {
      if (serviceAccountKeyPath) {
        this.storage = new Storage({
          projectId,
          keyFilename: serviceAccountKeyPath,
        });
      } else if (clientEmail && privateKey) {
        const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
        this.storage = new Storage({
          projectId,
          credentials: {
            client_email: clientEmail,
            private_key: cleanPrivateKey,
          },
        });
      } else {
        this.storage = new Storage({ projectId });
      }

      this.publicBucket = this.configService.get<string>('GCP_PUBLIC_BUCKET') || 'nadf';
      this.privateBucket = this.configService.get<string>('GCP_PRIVATE_BUCKET') || 'nadf';

      this.logger.log('GCP Storage initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Google Cloud Storage:', error);
      throw new Error('Failed to initialize Google Cloud Storage. Please check your service account credentials.');
    }
  }

  private async initializeLocalStorage() {
    try {
      // Ensure the local storage directory exists
      await mkdir(this.localStoragePath, { recursive: true });
      this.logger.log(`Local storage initialized at: ${this.localStoragePath}`);
    } catch (error) {
      this.logger.error('Error initializing local storage:', error);
      throw new Error('Failed to initialize local storage directory.');
    }
  }

  /**
   * Save a file to storage (GCP or local filesystem)
   */
  async saveFile(filePath: string, contentType: string, buffer: Buffer, metadata: FileMetadata = {}, isPrivate = true): Promise<void> {
    if (this.storageLocation === 'GCP') {
      return this.saveFileGCP(filePath, contentType, buffer, metadata, isPrivate);
    } else {
      return this.saveFileLocal(filePath, contentType, buffer, metadata, isPrivate);
    }
  }

  /**
   * Get a file from storage (GCP or local filesystem)
   */
  async getFile(filePath: string, isPrivate = true): Promise<StorageFile> {
    if (this.storageLocation === 'GCP') {
      return this.getFileGCP(filePath, isPrivate);
    } else {
      return this.getFileLocal(filePath, isPrivate);
    }
  }

  /**
   * Get a file with metadata (primarily for GCP, but also works for local)
   */
  async getFileWithMetadata(filePath: string, isPrivate = true): Promise<StorageFile> {
    if (this.storageLocation === 'GCP') {
      return this.getFileWithMetadataGCP(filePath, isPrivate);
    } else {
      return this.getFileWithMetadataLocal(filePath, isPrivate);
    }
  }

  /**
   * Delete a file from storage (GCP or local filesystem)
   */
  async deleteFile(filePath: string, isPrivate = true): Promise<void> {
    if (this.storageLocation === 'GCP') {
      return this.deleteFileGCP(filePath, isPrivate);
    } else {
      return this.deleteFileLocal(filePath, isPrivate);
    }
  }

  // GCP Storage Methods
  private async saveFileGCP(filePath: string, contentType: string, buffer: Buffer, metadata: FileMetadata = {}, isPrivate: boolean = true): Promise<void> {
    try {
      const bucket = isPrivate ? this.privateBucket : this.publicBucket;
      const file = this.storage.bucket(bucket).file(filePath);

      const stream = file.createWriteStream({
        metadata: {
          contentType,
          metadata,
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          this.logger.error(`Error uploading file to GCP: ${error.message}`);
          reject(error);
        });

        stream.on('finish', () => {
          this.logger.log(`File uploaded successfully to GCP: ${filePath}`);
          resolve();
        });

        stream.end(buffer);
      });
    } catch (error) {
      this.logger.error(`Failed to save file to GCP: ${error.message}`);
      throw error;
    }
  }

  private async getFileGCP(filePath: string, isPrivate: boolean = true): Promise<StorageFile> {
    try {
      const bucket = isPrivate ? this.privateBucket : this.publicBucket;
      const fileResponse: DownloadResponse = await this.storage.bucket(bucket).file(filePath).download();
      const [buffer] = fileResponse;

      return {
        buffer,
        metadata: new Map<string, string>(),
        contentType: '',
      };
    } catch (error) {
      this.logger.error(`Failed to get file from GCP: ${error.message}`);
      throw error;
    }
  }

  private async getFileWithMetadataGCP(filePath: string, isPrivate: boolean = true): Promise<StorageFile> {
    try {
      const bucket = isPrivate ? this.privateBucket : this.publicBucket;
      const file = this.storage.bucket(bucket).file(filePath);

      const [metadata] = await file.getMetadata();
      const [buffer] = await file.download();

      const metadataMap = new Map<string, string>();
      Object.entries(metadata.metadata || {}).forEach(([key, value]) => {
        metadataMap.set(key, value as string);
      });

      return {
        buffer,
        metadata: metadataMap,
        contentType: metadata.contentType || '',
      };
    } catch (error) {
      this.logger.error(`Failed to get file with metadata from GCP: ${error.message}`);
      throw error;
    }
  }

  private async deleteFileGCP(filePath: string, isPrivate: boolean = true): Promise<void> {
    try {
      const bucket = isPrivate ? this.privateBucket : this.publicBucket;
      await this.storage.bucket(bucket).file(filePath).delete({ ignoreNotFound: true });
      this.logger.log(`File deleted successfully from GCP: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from GCP: ${error.message}`);
      throw error;
    }
  }

  // Local Storage Methods
  private async saveFileLocal(filePath: string, contentType: string, buffer: Buffer, metadata: FileMetadata, isPrivate: boolean): Promise<void> {
    try {
      const directory = isPrivate ? 'private' : 'public';
      const fullPath = path.join(this.localStoragePath, directory, filePath);
      const dirPath = path.dirname(fullPath);

      // Ensure directory exists
      await mkdir(dirPath, { recursive: true });

      // Save the file
      await writeFile(fullPath, buffer);

      // Save metadata as a separate JSON file
      const metadataPath = `${fullPath}.metadata.json`;
      const metadataWithContentType = { ...metadata, contentType };
      await writeFile(metadataPath, JSON.stringify(metadataWithContentType, null, 2));

      this.logger.log(`File saved successfully to local storage: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to save file to local storage: ${error.message}`);
      throw error;
    }
  }

  private async getFileLocal(filePath: string, isPrivate: boolean): Promise<StorageFile> {
    try {
      const directory = isPrivate ? 'private' : 'public';
      const fullPath = path.join(this.localStoragePath, directory, filePath);

      // Check if file exists
      await access(fullPath, fs.constants.F_OK);

      const buffer = await readFile(fullPath);

      return {
        buffer,
        metadata: new Map<string, string>(),
        contentType: '',
      };
    } catch (error) {
      this.logger.error(`Failed to get file from local storage: ${error.message}`);
      throw error;
    }
  }

  private async getFileWithMetadataLocal(filePath: string, isPrivate: boolean): Promise<StorageFile> {
    try {
      const directory = isPrivate ? 'private' : 'public';
      const fullPath = path.join(this.localStoragePath, directory, filePath);
      const metadataPath = `${fullPath}.metadata.json`;

      // Check if file exists
      await access(fullPath, fs.constants.F_OK);

      const buffer = await readFile(fullPath);
      let metadata: FileMetadata = {};
      let contentType = '';

      // Try to read metadata file
      try {
        await access(metadataPath, fs.constants.F_OK);
        const metadataContent = await readFile(metadataPath, 'utf-8');
        const parsedMetadata = JSON.parse(metadataContent);
        contentType = parsedMetadata.contentType || '';
        delete parsedMetadata.contentType;
        metadata = parsedMetadata;
      } catch (metadataError) {
        this.logger.warn(`No metadata file found for: ${filePath}`);
      }

      const metadataMap = new Map<string, string>(Object.entries(metadata));

      return {
        buffer,
        metadata: metadataMap,
        contentType,
      };
    } catch (error) {
      this.logger.error(`Failed to get file with metadata from local storage: ${error.message}`);
      throw error;
    }
  }

  private async deleteFileLocal(filePath: string, isPrivate: boolean): Promise<void> {
    try {
      const directory = isPrivate ? 'private' : 'public';
      const fullPath = path.join(this.localStoragePath, directory, filePath);
      const metadataPath = `${fullPath}.metadata.json`;

      // Delete the main file
      try {
        await access(fullPath, fs.constants.F_OK);
        await unlink(fullPath);
        this.logger.log(`File deleted successfully from local storage: ${fullPath}`);
      } catch (error) {
        this.logger.warn(`File not found for deletion: ${fullPath}`);
      }

      // Delete the metadata file
      try {
        await access(metadataPath, fs.constants.F_OK);
        await unlink(metadataPath);
        this.logger.log(`Metadata file deleted successfully: ${metadataPath}`);
      } catch (error) {
        this.logger.warn(`Metadata file not found for deletion: ${metadataPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file from local storage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the current storage location being used
   */
  getStorageLocation(): 'GCP' | 'LOCAL' {
    return this.storageLocation;
  }

  /**
   * Check if a file exists in storage
   */
  async fileExists(filePath: string, isPrivate = true): Promise<boolean> {
    try {
      if (this.storageLocation === 'GCP') {
        const bucket = isPrivate ? this.privateBucket : this.publicBucket;
        const [exists] = await this.storage.bucket(bucket).file(filePath).exists();
        return exists;
      } else {
        const directory = isPrivate ? 'private' : 'public';
        const fullPath = path.join(this.localStoragePath, directory, filePath);
        await access(fullPath, fs.constants.F_OK);
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Build a public URL for a file stored in the public bucket
   */
  getPublicFileUrl(filePath: string): string {
    if (this.storageLocation === 'GCP') {
      return `https://storage.googleapis.com/${this.publicBucket}/${filePath}`;
    }
    // Fallback local path reference
    return `/public/${filePath}`;
  }
}
