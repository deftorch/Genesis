import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, text, sessionId, messages = [] } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    // Build conversation context - limit to last 5 messages to avoid token limit
    let conversationContext = '';
    if (messages.length > 0) {
      const recentMessages = messages.slice(-5); // Only last 5 messages
      conversationContext = 'Previous conversation:\n';
      recentMessages.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'User' : 'AI';
        const content = msg.content.length > 200 
          ? msg.content.substring(0, 200) + '...' 
          : msg.content;
        conversationContext += `${role}: ${content}\n`;
      });
      conversationContext += '\n';
    }

    // Combine context with current question - keep it short
    const userQuestion = text || 'What is inside this image? Describe it in detail.';
    const fullPrompt = conversationContext 
      ? `${conversationContext}Current question: ${userQuestion}`
      : userQuestion;

    // Validate URL to prevent SSRF
    const { isSafeUrl } = await import('@/lib/ssrf-guard');
    if (!(await isSafeUrl(imageUrl))) {
      return NextResponse.json(
        { error: 'Unsafe or invalid image URL provided' },
        { status: 400 }
      );
    }

    // Fetch the image and convert to base64
    let base64Image = '';
    let mimeType = 'image/jpeg';
    
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from URL');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    base64Image = Buffer.from(imageBuffer).toString('base64');
    
    mimeType = imageUrl.toLowerCase().endsWith('.png') 
      ? 'image/png' 
      : imageUrl.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: fullPrompt,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    };

    const modelId = 'gemini-2.0-flash-exp';
    const data = await callGeminiWithRotation(modelId, requestBody);

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const resultText = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      type: 'image-analysis',
      description: resultText,
      timestamp: new Date().toISOString(),
      responseTime: 'N/A',
      provider: 'google',
    });
  } catch (error: any) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
