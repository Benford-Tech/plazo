import { Readable } from 'stream';
import { del, get, put } from '@vercel/blob';
import httpStatus from 'http-status';
import { Service } from 'typedi';
import { blobReadWriteToken, NODE_ENV } from '@/config';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';

export interface StoredPhoto {
  stream: Readable;
  contentType: string;
  size: number | null;
}

/** Where the photos live: a private Vercel Blob store, or memory in the tests. */
export interface PhotoBackend {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredPhoto | null>;
  remove(keys: string[]): Promise<void>;
}

class VercelBlobBackend implements PhotoBackend {
  constructor(private token: string) {}

  public async put(key: string, bytes: Buffer, contentType: string) {
    await put(key, bytes, { access: 'private', contentType, token: this.token, addRandomSuffix: false, allowOverwrite: false });
  }

  public async get(key: string): Promise<StoredPhoto | null> {
    const found = await get(key, { access: 'private', token: this.token });
    if (!found || found.statusCode !== 200) return null;
    return { stream: Readable.fromWeb(found.stream as never), contentType: found.blob.contentType, size: found.blob.size };
  }

  public async remove(keys: string[]) {
    if (keys.length) await del(keys, { token: this.token });
  }
}

/** The tests' store. */
export class MemoryPhotoBackend implements PhotoBackend {
  public files = new Map<string, { bytes: Buffer; contentType: string }>();

  public async put(key: string, bytes: Buffer, contentType: string) {
    this.files.set(key, { bytes, contentType });
  }

  public async get(key: string): Promise<StoredPhoto | null> {
    const file = this.files.get(key);
    return file ? { stream: Readable.from(file.bytes), contentType: file.contentType, size: file.bytes.length } : null;
  }

  public async remove(keys: string[]) {
    keys.forEach(k => this.files.delete(k));
  }
}

/**
 * The photos of the condition reports (19/10/2026). Private storage: a photo is only ever streamed by the API to someone
 * allowed to see it (the operator's staff, the traveller with their booking's token). Logs carry keys' ids, never a
 * person's data.
 */
@Service()
export class PhotoStorageService {
  /** Null: no store connected (photos unavailable). Tests set a MemoryPhotoBackend. */
  public backend: PhotoBackend | null = PhotoStorageService.defaultBackend();

  private static defaultBackend(): PhotoBackend | null {
    const token = blobReadWriteToken();
    if (token) return new VercelBlobBackend(token);
    return NODE_ENV === 'test' ? new MemoryPhotoBackend() : null;
  }

  public available(): boolean {
    return this.backend !== null;
  }

  private store(): PhotoBackend {
    if (!this.backend) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Photo storage is not configured', 'photos_unavailable');
    return this.backend;
  }

  public async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    try {
      await this.store().put(key, bytes, contentType);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`[Photos] Upload failed for ${key.split('/').slice(0, 2).join('/')}: ${error instanceof Error ? error.name : 'unknown'}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'The photo could not be saved', 'photo_upload_failed');
    }
  }

  public async get(key: string): Promise<StoredPhoto | null> {
    return this.store().get(key);
  }

  /** Never throws: an erasure that fails is retried by the next night's pass. */
  public async remove(keys: string[]): Promise<boolean> {
    if (!keys.length || !this.backend) return !keys.length;
    try {
      for (let i = 0; i < keys.length; i += 100) await this.backend.remove(keys.slice(i, i + 100));
      return true;
    } catch (error) {
      logger.warn(`[Photos] Erasure of ${keys.length} photo(s) failed: ${error instanceof Error ? error.name : 'unknown'}`);
      return false;
    }
  }
}
