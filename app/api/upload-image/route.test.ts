import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { server } from '@/test/setup';
import { http, HttpResponse } from 'msw';

describe('/api/upload-image API Route', () => {
  it('should return 400 when no file is provided', async () => {
    const mockFormData = {
      get: (key: string) => null,
    };
    const req = {
      formData: async () => mockFormData,
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No file provided');
  });

  it('should return 400 when file is not an image', async () => {
    const mockFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: 100,
    };
    const mockFormData = {
      get: (key: string) => mockFile,
    };
    const req = {
      formData: async () => mockFormData,
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Only image files are allowed');
  });

  it('should return 400 when image signature does not match magic bytes', async () => {
    const mockFile = {
      name: 'test.png',
      type: 'image/png',
      size: 100,
      arrayBuffer: async () => new Uint8Array([0, 0, 0, 0]).buffer,
    };
    const mockFormData = {
      get: (key: string) => mockFile,
    };
    const req = {
      formData: async () => mockFormData,
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid image signature');
  });

  it('should upload successfully to ThumbSnap when magic bytes are correct', async () => {
    server.use(
      http.post('https://thumbsnap.com/api/upload', () => {
        return HttpResponse.json({
          data: {
            thumb: 'https://thumbsnap.com/i/thumb.jpg',
            url: 'https://thumbsnap.com/i/real.jpg',
          },
        });
      })
    );

    const mockFile = {
      name: 'correct.png',
      type: 'image/png',
      size: 1000,
      arrayBuffer: async () => new Uint8Array([0x89, 0x50, 0x4E, 0x47]).buffer,
    };
    const mockFormData = {
      get: (key: string) => mockFile,
    };
    const req = {
      formData: async () => mockFormData,
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.provider).toBe('thumbsnap');
    expect(data.url).toBe('https://thumbsnap.com/i/thumb.jpg');
  });

  it('should fallback to qu.ax upload when ThumbSnap fails', async () => {
    server.use(
      http.post('https://thumbsnap.com/api/upload', () => {
        return new HttpResponse('Internal Server Error', { status: 500 });
      }),
      http.post('https://qu.ax/upload.php', () => {
        return HttpResponse.json({
          success: true,
          files: [
            {
              url: 'https://qu.ax/image123.png',
              name: 'image123.png',
              expiry: '30',
            },
          ],
        });
      })
    );

    const mockFile = {
      name: 'correct.png',
      type: 'image/png',
      size: 1000,
      arrayBuffer: async () => new Uint8Array([0x89, 0x50, 0x4E, 0x47]).buffer,
    };
    const mockFormData = {
      get: (key: string) => mockFile,
    };
    const req = {
      formData: async () => mockFormData,
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.provider).toBe('qu.ax');
    expect(data.url).toBe('https://qu.ax/image123.png');
  });
});
