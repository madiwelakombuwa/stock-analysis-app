/**
 * Cloudflare Pages Function to proxy /api/analyze requests to Python backend
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Check if BACKEND_URL is set
    if (!env.BACKEND_URL) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Backend URL not configured. Please set BACKEND_URL environment variable in Cloudflare Pages settings.',
        hint: 'Go to Settings → Environment variables and add BACKEND_URL'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const body = await request.json();
    const backendUrl = env.BACKEND_URL;

    console.log(`Proxying request to: ${backendUrl}/api/analyze`);

    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error: ${response.status} - ${errorText}`);

      return new Response(JSON.stringify({
        success: false,
        error: `Backend server error (${response.status})`,
        details: errorText.substring(0, 200),
        backendUrl: backendUrl
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Backend returned non-JSON response: ${text.substring(0, 200)}`);

      return new Response(JSON.stringify({
        success: false,
        error: 'Backend returned invalid response format',
        contentType: contentType,
        preview: text.substring(0, 200)
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Worker Function error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      type: error.name,
      hint: 'Check that your Python backend is running and accessible'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
