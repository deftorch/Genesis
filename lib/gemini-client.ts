import { getGeminiApiKeys } from '@/config/constants';

/**
 * Helper to call Google Generative Language API (Gemini) with key rotation.
 * Iterates through configured Gemini API keys, attempting to fulfill the request.
 * 
 * @param modelId The Gemini model identifier (e.g. gemini-2.5-flash)
 * @param requestBody The JSON body for the generateContent request
 * @returns The parsed JSON response data from the Gemini API
 */
export async function callGeminiWithRotation(modelId: string, requestBody: any): Promise<any> {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  let lastErrorText = '';
  let lastStatus = 500;
  let success = false;
  let responseData: any = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const currentKey = apiKeys[i];
    console.log(`[Gemini Client] Attempting request with key ${i + 1}/${apiKeys.length} for model ${modelId}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${currentKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        responseData = await response.json();
        success = true;
        break;
      }

      lastStatus = response.status;
      lastErrorText = await response.text();
      console.error(`[Gemini Client] Key ${i + 1} failed (Status ${lastStatus}):`, lastErrorText);
    } catch (fetchError: any) {
      console.error(`[Gemini Client] Fetch error with key ${i + 1}:`, fetchError.message);
      lastErrorText = fetchError.message;
      lastStatus = 500;
    }
  }

  if (!success || !responseData) {
    const isQuota = lastStatus === 429 ||
                    lastErrorText.toLowerCase().includes('quota') ||
                    lastErrorText.toLowerCase().includes('exhausted') ||
                    lastErrorText.toLowerCase().includes('rate limit') ||
                    lastErrorText.toLowerCase().includes('too many requests') ||
                    lastErrorText.toLowerCase().includes('limit reached') ||
                    lastErrorText.toLowerCase().includes('key expired') ||
                    lastErrorText.toLowerCase().includes('invalid');

    if (isQuota) {
      const quotaError = new Error('Your daily usage limit has been reached. Please come back tomorrow.');
      (quotaError as any).status = 429;
      (quotaError as any).details = `All Gemini API keys exhausted. Last error (${lastStatus}): ${lastErrorText}`;
      throw quotaError;
    }

    const standardError = new Error(`Gemini API error (${lastStatus}): ${lastErrorText}`);
    (standardError as any).status = lastStatus;
    (standardError as any).details = lastErrorText;
    throw standardError;
  }

  return responseData;
}

/**
 * Helper to call Google Generative Language API (Gemini) with key rotation, returning a stream.
 */
export async function streamGeminiWithRotation(modelId: string, requestBody: any): Promise<Response> {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  let lastErrorText = '';
  let lastStatus = 500;
  let success = false;
  let response: Response | null = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const currentKey = apiKeys[i];
    console.log(`[Gemini Client] Attempting stream request with key ${i + 1}/${apiKeys.length} for model ${modelId}...`);
    
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${currentKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (res.ok) {
        response = res;
        success = true;
        break;
      }

      lastStatus = res.status;
      lastErrorText = await res.text();
      console.error(`[Gemini Client] Stream key ${i + 1} failed (Status ${lastStatus}):`, lastErrorText);
    } catch (fetchError: any) {
      console.error(`[Gemini Client] Fetch error with stream key ${i + 1}:`, fetchError.message);
      lastErrorText = fetchError.message;
      lastStatus = 500;
    }
  }

  if (!success || !response) {
    const isQuota = lastStatus === 429 ||
                    lastErrorText.toLowerCase().includes('quota') ||
                    lastErrorText.toLowerCase().includes('exhausted') ||
                    lastErrorText.toLowerCase().includes('rate limit') ||
                    lastErrorText.toLowerCase().includes('too many requests') ||
                    lastErrorText.toLowerCase().includes('limit reached') ||
                    lastErrorText.toLowerCase().includes('key expired') ||
                    lastErrorText.toLowerCase().includes('invalid');

    if (isQuota) {
      const quotaError = new Error('Your daily usage limit has been reached. Please come back tomorrow.');
      (quotaError as any).status = 429;
      (quotaError as any).details = `All Gemini API keys exhausted. Last error (${lastStatus}): ${lastErrorText}`;
      throw quotaError;
    }

    const standardError = new Error(`Gemini API error (${lastStatus}): ${lastErrorText}`);
    (standardError as any).status = lastStatus;
    (standardError as any).details = lastErrorText;
    throw standardError;
  }

  return response;
}
