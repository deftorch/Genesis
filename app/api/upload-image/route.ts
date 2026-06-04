import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/constants';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file magic bytes (binary signature)
    const arrayBuffer = await file.arrayBuffer();
    // Ambil 12 byte untuk validasi WebP yang benar
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
    let header = '';
    for (let i = 0; i < 4; i++) {
      header += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    }

    const isJpeg = header.startsWith('FFD8FF');
    const isPng = header.startsWith('89504E47');
    const isGif = header.startsWith('47494638');

    // WebP: RIFF di byte 0-3 DAN 'WEBP' di byte 8-11
    const webpSignature = Array.from(bytes.slice(8, 12))
      .map(b => String.fromCharCode(b))
      .join('');
    const isWebp = header.startsWith('52494646') && webpSignature === 'WEBP';

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json(
        { error: 'Invalid image signature. Only real JPEG, PNG, GIF, and WebP files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for ThumbSnap)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // console.log('=== THUMBSNAP UPLOAD DEBUG ===');
    // console.log('File name:', file.name);
    // console.log('File size:', file.size);
    // console.log('File type:', file.type);
    // console.log('==============================');

    // Try ThumbSnap first
    try {
      // console.log('Trying ThumbSnap upload...');
      const uploadFormData = new FormData();
      uploadFormData.append('media', file);
      uploadFormData.append('key', API_CONFIG.THUMBSNAP_API_KEY);

      const response = await fetch(API_CONFIG.THUMBSNAP_API_URL, {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      
      // console.log('ThumbSnap response:', data);

      if (response.ok && data.data?.thumb) {
        // ThumbSnap success
        return NextResponse.json({
          success: true,
          url: data.data.thumb,
          pageUrl: data.data.url,
          filename: file.name,
          provider: 'thumbsnap'
        });
      }
      
      // ThumbSnap failed, try qu.ax
      throw new Error('ThumbSnap failed, trying backup...');
    } catch (thumbsnapError: any) {
      console.error('ThumbSnap error:', thumbsnapError.message);
      // console.log('Trying qu.ax as backup...');

      try {
        // Fallback to qu.ax
        const quaxFormData = new FormData();
        quaxFormData.append('files[]', file);
        quaxFormData.append('expiry', '30'); // 30 days expiry

        const quaxResponse = await fetch('https://qu.ax/upload.php', {
          method: 'POST',
          body: quaxFormData,
        });

        const quaxData = await quaxResponse.json();
        
        // console.log('qu.ax response:', quaxData);

        if (!quaxResponse.ok || !quaxData.success || !quaxData.files?.[0]?.url) {
          throw new Error('Failed to upload to qu.ax');
        }

        // qu.ax success
        return NextResponse.json({
          success: true,
          url: quaxData.files[0].url,
          filename: quaxData.files[0].name,
          expiry: quaxData.files[0].expiry,
          provider: 'qu.ax'
        });
      } catch (quaxError: any) {
        console.error('qu.ax error:', quaxError);
        return NextResponse.json(
          { 
            error: 'Both ThumbSnap and qu.ax failed',
            details: 'Please try again later or use a different image'
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
