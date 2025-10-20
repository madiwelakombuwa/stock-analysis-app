/**
 * Cloudflare Pages Function to proxy /api/market-movers requests to Python backend
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const backendUrl = env.BACKEND_URL || 'http://localhost:8888';

    const response = await fetch(`${backendUrl}/api/market-movers`, {
      method: 'GET',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
