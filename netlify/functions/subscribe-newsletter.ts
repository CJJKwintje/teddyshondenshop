import { Handler } from '@netlify/functions';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 5, // Maximum number of requests
  windowMs: 60 * 60 * 1000, // 1 hour window
};

// In-memory store for rate limiting (note: this resets when the function cold starts)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const userData = rateLimitStore.get(ip);

  if (!userData) {
    // First request from this IP
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Check if the window has expired
  if (now - userData.timestamp > RATE_LIMIT.windowMs) {
    // Reset the counter for a new window
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return false;
  }

  // Check if the user has exceeded the rate limit
  if (userData.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  // Increment the counter
  userData.count++;
  return false;
};

const handler: Handler = async (event) => {
  console.log('=== Newsletter Subscription Start ===');
  console.log('Function called with method:', event.httpMethod);
  console.log('Request body:', event.body);

  // Get client IP from headers
  const clientIP = event.headers['client-ip'] || 
                  event.headers['x-forwarded-for'] || 
                  event.headers['x-real-ip'] || 
                  'unknown';

  console.log('Client IP:', clientIP);

  // Check rate limit
  if (isRateLimited(clientIP)) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return {
      statusCode: 429,
      body: JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Retry-After': '3600', // 1 hour in seconds
      },
    };
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
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
    console.log('Invalid method:', event.httpMethod);
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
    console.log('=== Request Data ===');
    console.log('Email:', email);
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);

    if (!email) {
      console.log('Error: Email is required');
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

    console.log('=== Environment Variables ===');
    console.log('Store Domain:', storeDomain);
    console.log('Admin Token Present:', !!adminToken);

    if (!storeDomain) {
      console.log('Error: VITE_SHOPIFY_STORE_DOMAIN is not set');
      throw new Error('VITE_SHOPIFY_STORE_DOMAIN environment variable is not set');
    }

    if (!adminToken) {
      console.log('Error: VITE_SHOPIFY_ADMIN_ACCESS_TOKEN is not set');
      throw new Error('VITE_SHOPIFY_ADMIN_ACCESS_TOKEN environment variable is not set');
    }

    const storeUrl = `https://${storeDomain}`;
    const searchUrl = `${storeUrl}/admin/api/2023-10/customers/search.json?query=email:${encodeURIComponent(email)}`;
    console.log('=== Search Request ===');
    console.log('Search URL:', searchUrl);

    // Search for existing customer
    const searchResult = await fetch(searchUrl, {
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
    });

    console.log('=== Search Response ===');
    console.log('Status:', searchResult.status);
    console.log('Status Text:', searchResult.statusText);
    const searchData = await searchResult.json();
    console.log('Search Response Data:', JSON.stringify(searchData, null, 2));

    if (!searchResult.ok) {
      console.log('Error: Search request failed');
      throw new Error(`Failed to search for customer: ${JSON.stringify(searchData)}`);
    }

    const existingCustomer = searchData.customers?.[0];

    console.log('=== Customer Search Result ===');
    console.log('Customer Found:', !!existingCustomer);
    if (existingCustomer) {
      console.log('Customer Details:', {
        id: existingCustomer.id,
        email: existingCustomer.email,
        accepts_marketing: existingCustomer.accepts_marketing,
        email_marketing_consent: existingCustomer.email_marketing_consent,
        first_name: existingCustomer.first_name,
        last_name: existingCustomer.last_name,
        state: existingCustomer.state,
        tags: existingCustomer.tags,
      });
    }

    if (existingCustomer) {
      // Check if customer needs to be updated based on email_marketing_consent
      const needsUpdate = !existingCustomer.email_marketing_consent || 
                         existingCustomer.email_marketing_consent.state === 'unsubscribed';
      
      if (needsUpdate) {
        console.log('=== Updating Existing Customer ===');
        console.log('Customer ID:', existingCustomer.id);
        console.log('Current Marketing Status:', existingCustomer.email_marketing_consent?.state);

        const updateUrl = `${storeUrl}/admin/api/2023-10/customers/${existingCustomer.id}.json`;
        console.log('Update URL:', updateUrl);

        const updatePayload = {
          customer: {
            id: existingCustomer.id,
            email_marketing_consent: {
              state: 'subscribed',
              opt_in_level: 'single_opt_in',
              consent_updated_at: new Date().toISOString(),
              consent_collected_from: 'SHOPIFY'
            },
            sms_marketing_consent: null,
            accepts_marketing: true,
            accepts_marketing_updated_at: new Date().toISOString(),
          },
        };
        console.log('Update Payload:', JSON.stringify(updatePayload, null, 2));

        const updateResult = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': adminToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        console.log('=== Update Response ===');
        console.log('Status:', updateResult.status);
        console.log('Status Text:', updateResult.statusText);
        const updateData = await updateResult.json();
        console.log('Update Response Data:', JSON.stringify(updateData, null, 2));

        if (!updateResult.ok) {
          console.log('Error: Update request failed');
          throw new Error(`Failed to update customer marketing preferences: ${JSON.stringify(updateData)}`);
        }

        // Verify the update was successful
        const verifyResult = await fetch(updateUrl, {
          headers: {
            'X-Shopify-Access-Token': adminToken,
            'Content-Type': 'application/json',
          },
        });

        const verifyData = await verifyResult.json();
        console.log('=== Verification Response ===');
        console.log('Status:', verifyResult.status);
        console.log('Verification Data:', JSON.stringify(verifyData, null, 2));

        if (verifyData.customer?.email_marketing_consent?.state !== 'subscribed') {
          throw new Error('Customer marketing preferences were not updated successfully');
        }
      } else {
        console.log('Customer already accepts marketing');
      }
    } else {
      console.log('=== Creating New Customer ===');
      const createUrl = `${storeUrl}/admin/api/2023-10/customers.json`;
      console.log('Create URL:', createUrl);

      const createPayload = {
        customer: {
          email,
          first_name: firstName,
          last_name: lastName,
          accepts_marketing: true,
          verified_email: true,
          accepts_marketing_updated_at: new Date().toISOString(),
          email_marketing_consent: {
            state: 'subscribed',
            opt_in_level: 'single_opt_in',
            consent_updated_at: new Date().toISOString(),
            consent_collected_from: 'SHOPIFY'
          },
          sms_marketing_consent: null,
        },
      };
      console.log('Create Payload:', JSON.stringify(createPayload, null, 2));

      const createResult = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload),
      });

      console.log('=== Create Response ===');
      console.log('Status:', createResult.status);
      console.log('Status Text:', createResult.statusText);
      const createData = await createResult.json();
      console.log('Create Response Data:', JSON.stringify(createData, null, 2));

      if (!createResult.ok) {
        console.log('Error: Create request failed');
        throw new Error(`Failed to create customer: ${JSON.stringify(createData)}`);
      }

      // Verify the creation was successful
      if (createData.customer?.email_marketing_consent?.state !== 'subscribed') {
        throw new Error('New customer was not created with marketing preferences enabled');
      }
    }

    console.log('=== Newsletter Subscription Success ===');
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
    console.log('=== Newsletter Subscription Error ===');
    console.error('Error details:', error);
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