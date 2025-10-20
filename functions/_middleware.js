/**
 * Shared middleware and helper functions for Cloudflare Pages Functions
 */

/**
 * Proxy a request to the backend with proper error handling
 */
export async function proxyToBackend(context, path, options = {}) {
  const { env } = context;

  // Check if BACKEND_URL is set
  if (!env.BACKEND_URL) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Backend URL not configured',
      message: 'Please set BACKEND_URL environment variable in Cloudflare Pages settings.',
      instructions: [
        '1. Go to Cloudflare Dashboard → Pages → stock-analysis-app',
        '2. Click Settings → Environment variables',
        '3. Add variable: BACKEND_URL = https://your-backend-url.com',
        '4. Redeploy the application'
      ]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const backendUrl = env.BACKEND_URL.replace(/\/$/, ''); // Remove trailing slash
    const fullUrl = `${backendUrl}${path}`;

    console.log(`[Proxy] ${options.method || 'GET'} ${fullUrl}`);

    const response = await fetch(fullUrl, options);

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend error ${response.status}: ${errorText.substring(0, 200)}`);

      return new Response(JSON.stringify({
        success: false,
        error: `Backend server error (${response.status})`,
        details: errorText.substring(0, 300),
        backendUrl: fullUrl.replace(/\/api\/.*$/, '/api/...') // Hide full path for security
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';

    // Handle binary responses (like PDFs)
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const blob = await response.arrayBuffer();
      return new Response(blob, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || '',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Handle JSON responses
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Handle unexpected content types
    const text = await response.text();
    console.error(`[Proxy] Unexpected content-type: ${contentType}`);
    console.error(`[Proxy] Response preview: ${text.substring(0, 200)}`);

    return new Response(JSON.stringify({
      success: false,
      error: 'Backend returned unexpected response format',
      contentType: contentType,
      preview: text.substring(0, 200),
      hint: 'Expected application/json but got: ' + contentType
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);

    // More specific error messages
    let errorMessage = error.message;
    let hint = 'Check that your Python backend is running and accessible';

    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      errorMessage = 'Cannot connect to backend server';
      hint = 'Your backend might be down. Check if it\'s running at: ' + env.BACKEND_URL;
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid JSON response from backend';
      hint = 'The backend returned malformed data';
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      type: error.name,
      hint: hint,
      backendUrl: env.BACKEND_URL ? env.BACKEND_URL.replace(/\/api\/.*$/, '') : 'not set'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * CORS headers helper
 */
export function getCorsHeaders(additionalHeaders = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    ...additionalHeaders
  };
}
