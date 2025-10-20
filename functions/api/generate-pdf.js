/**
 * Cloudflare Pages Function to proxy /api/generate-pdf requests to Python backend
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const backendUrl = env.BACKEND_URL || 'http://localhost:8888';

    const response = await fetch(`${backendUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Forward the PDF blob
    const contentType = response.headers.get('content-type');
    const blob = await response.arrayBuffer();

    return new Response(blob, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="stock_analysis.pdf"',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
