import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, firstName, lastName } = JSON.parse(event.body || '{}');

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
    }

    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!storeDomain || !adminToken) {
      throw new Error('Missing Shopify configuration');
    }

    const storeUrl = `https://${storeDomain}`;

    // Search for existing customer
    const searchResult = await fetch(
      `${storeUrl}/admin/api/2023-10/customers/search.json?query=email:${encodeURIComponent(email)}`,
      {
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const searchData = await searchResult.json();
    const existingCustomer = searchData.customers?.[0];

    if (existingCustomer) {
      // Update existing customer if they don't accept marketing
      if (!existingCustomer.accepts_marketing) {
        const updateResult = await fetch(
          `${storeUrl}/admin/api/2023-10/customers/${existingCustomer.id}.json`,
          {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': adminToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: {
                id: existingCustomer.id,
                accepts_marketing: true,
              },
            }),
          }
        );

        if (!updateResult.ok) {
          throw new Error('Failed to update customer marketing preferences');
        }
      }
    } else {
      // Create new customer
      const createResult = await fetch(`${storeUrl}/admin/api/2023-10/customers.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            email,
            first_name: firstName,
            last_name: lastName,
            accepts_marketing: true,
          },
        }),
      });

      if (!createResult.ok) {
        throw new Error('Failed to create customer');
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter',
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }
};

export { handler }; 