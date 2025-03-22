import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  console.log('Function called with method:', event.httpMethod);
  console.log('Request body:', event.body);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  try {
    const { email, firstName, lastName } = JSON.parse(event.body || '{}');
    console.log('Parsed request data:', { email, firstName, lastName });

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      };
    }

    const storeDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN;

    console.log('Environment variables:', {
      hasStoreDomain: !!storeDomain,
      hasAdminToken: !!adminToken
    });

    if (!storeDomain) {
      throw new Error('VITE_SHOPIFY_STORE_DOMAIN environment variable is not set');
    }

    if (!adminToken) {
      throw new Error('VITE_SHOPIFY_ADMIN_ACCESS_TOKEN environment variable is not set');
    }

    const storeUrl = `https://${storeDomain}`;
    console.log('Making search request to:', `${storeUrl}/admin/api/2023-10/customers/search.json`);

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

    console.log('Search response status:', searchResult.status);
    const searchData = await searchResult.json();
    console.log('Raw search response:', searchData);

    if (!searchResult.ok) {
      throw new Error(`Failed to search for customer: ${JSON.stringify(searchData)}`);
    }

    const existingCustomer = searchData.customers?.[0];

    console.log('Search result:', {
      found: !!existingCustomer,
      customer: existingCustomer ? {
        id: existingCustomer.id,
        email: existingCustomer.email,
        accepts_marketing: existingCustomer.accepts_marketing
      } : null
    });

    if (existingCustomer) {
      // Update existing customer if they don't accept marketing
      if (!existingCustomer.accepts_marketing) {
        console.log('Updating existing customer marketing preferences...');
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
                email: existingCustomer.email,
                first_name: existingCustomer.first_name,
                last_name: existingCustomer.last_name,
                state: existingCustomer.state,
                tags: existingCustomer.tags,
                note: existingCustomer.note,
                tax_exempt: existingCustomer.tax_exempt,
                tax_exemptions: existingCustomer.tax_exemptions,
                currency: existingCustomer.currency,
                phone: existingCustomer.phone,
                addresses: existingCustomer.addresses,
                default_address: existingCustomer.default_address,
                accepts_marketing_updated_at: new Date().toISOString(),
                sms_marketing_consent: existingCustomer.sms_marketing_consent,
                opt_in_level: existingCustomer.opt_in_level,
                consent: existingCustomer.consent,
                consent_opt_in_level: existingCustomer.consent_opt_in_level,
                consent_opt_in_updated_at: existingCustomer.consent_opt_in_updated_at,
                consent_collected_from: existingCustomer.consent_collected_from,
              },
            }),
          }
        );

        const updateData = await updateResult.json();
        console.log('Update result:', {
          success: updateResult.ok,
          status: updateResult.status,
          data: updateData
        });

        if (!updateResult.ok) {
          throw new Error(`Failed to update customer marketing preferences: ${JSON.stringify(updateData)}`);
        }
      } else {
        console.log('Customer already accepts marketing');
      }
    } else {
      console.log('Creating new customer...');
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
            verified_email: true,
            accepts_marketing_updated_at: new Date().toISOString(),
            opt_in_level: 'single_opt_in',
            consent: 'granted',
            consent_opt_in_level: 'single_opt_in',
            consent_opt_in_updated_at: new Date().toISOString(),
            consent_collected_from: 'SHOPIFY',
          },
        }),
      });

      const createData = await createResult.json();
      console.log('Create result:', {
        success: createResult.ok,
        status: createResult.status,
        data: createData
      });

      if (!createResult.ok) {
        throw new Error(`Failed to create customer: ${JSON.stringify(createData)}`);
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