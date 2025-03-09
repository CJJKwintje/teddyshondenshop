import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  try {
    const id = process.env.VITE_WEBWINKELKEUR_ID;
    const apiKey = process.env.VITE_WEBWINKELKEUR_API_KEY;

    if (!id || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(
      `https://www.webwinkelkeur.nl/api/1.0/shop/ratings_summary.json?id=${id}&api_key=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Netlify Function'
        }
      }
    );

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      throw new Error('Invalid API response format');
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data.rating !== 'number') {
      throw new Error('Invalid rating data received');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: data.rating,
        votes: data.votes || 0
      }),
    };
  } catch (error) {
    console.error('Webwinkelkeur API error:', error);
    
    return {
      statusCode: 200, // Return 200 even on error to prevent breaking the UI
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch rating',
        rating: null,
        votes: null
      }),
    };
  }
};

export { handler };