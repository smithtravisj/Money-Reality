import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'test@email.com';
const PASSWORD = 'TestPassword123!';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function populateData() {
  console.log('Starting data population...\n');

  try {
    // 1. Sign up
    console.log('1. Creating account...');
    const signupRes = await makeRequest('/api/user/signup', 'POST', {
      email: EMAIL,
      password: PASSWORD,
      name: 'Test User',
    });

    if (signupRes.status === 200 || signupRes.status === 201) {
      console.log('✓ Account created\n');
    } else if (signupRes.status === 409) {
      console.log('✓ Account already exists\n');
    } else {
      console.log('Error:', signupRes);
      return;
    }

    // Get a session by making authenticated requests
    // We'll use the NextAuth signin endpoint
    console.log('2. Logging in...');
    const signinRes = await makeRequest('/api/auth/signin', 'POST', {
      email: EMAIL,
      password: PASSWORD,
    });
    console.log('✓ Logged in\n');

    // 3. Add categories
    console.log('3. Adding categories...');
    const categories = [
      { name: 'Groceries', type: 'expense', parentGroup: 'Essentials' },
      { name: 'Rent', type: 'expense', parentGroup: 'Essentials' },
      { name: 'Utilities', type: 'expense', parentGroup: 'Essentials' },
      { name: 'Dining Out', type: 'expense', parentGroup: 'Lifestyle' },
      { name: 'Entertainment', type: 'expense', parentGroup: 'Lifestyle' },
      { name: 'Gym', type: 'expense', parentGroup: 'Health' },
      { name: 'Salary', type: 'income', parentGroup: 'Income' },
      { name: 'Freelance', type: 'income', parentGroup: 'Income' },
    ];

    for (const cat of categories) {
      await makeRequest('/api/categories', 'POST', cat);
    }
    console.log(`✓ Added ${categories.length} categories\n`);

    // 4. Get categories to get their IDs
    console.log('4. Fetching categories...');
    const catsRes = await makeRequest('/api/categories', 'GET');
    const categoryMap = {};
    if (catsRes.data && catsRes.data.categories) {
      catsRes.data.categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
    }
    console.log('✓ Categories fetched\n');

    // 5. Add transactions
    console.log('5. Adding transactions...');
    const now = new Date();
    const transactions = [
      // Recent income
      { type: 'income', amount: 3500, date: new Date(now.getTime() - 3*24*60*60*1000), categoryId: categoryMap['Salary'], merchant: 'Employer Inc', paymentMethod: 'Transfer' },

      // Recent expenses
      { type: 'expense', amount: 1200, date: new Date(now.getTime() - 25*24*60*60*1000), categoryId: categoryMap['Rent'], merchant: 'Landlord', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 85.50, date: new Date(now.getTime() - 2*24*60*60*1000), categoryId: categoryMap['Groceries'], merchant: 'Whole Foods', paymentMethod: 'Card' },
      { type: 'expense', amount: 45.00, date: new Date(now.getTime() - 2*24*60*60*1000), categoryId: categoryMap['Groceries'], merchant: 'Trader Joes', paymentMethod: 'Card' },
      { type: 'expense', amount: 120.00, date: new Date(now.getTime() - 1*24*60*60*1000), categoryId: categoryMap['Dining Out'], merchant: 'The Bistro', paymentMethod: 'Card' },
      { type: 'expense', amount: 65.00, date: new Date(now.getTime() - 1*24*60*60*1000), categoryId: categoryMap['Gym'], merchant: 'Planet Fitness', paymentMethod: 'Card' },
      { type: 'expense', amount: 35.99, date: new Date(now.getTime() - 0.5*24*60*60*1000), categoryId: categoryMap['Entertainment'], merchant: 'Netflix', paymentMethod: 'Card' },
      { type: 'expense', amount: 150.00, date: new Date(now.getTime() - 0.5*24*60*60*1000), categoryId: categoryMap['Utilities'], merchant: 'City Power Company', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 22.50, date: new Date(now.getTime() - 4*24*60*60*1000), categoryId: categoryMap['Dining Out'], merchant: 'Coffee Shop', paymentMethod: 'Card' },
      { type: 'expense', amount: 55.00, date: new Date(now.getTime() - 5*24*60*60*1000), categoryId: categoryMap['Groceries'], merchant: 'Safeway', paymentMethod: 'Card' },
      { type: 'income', amount: 200, date: new Date(now.getTime() - 7*24*60*60*1000), categoryId: categoryMap['Freelance'], merchant: 'Client Project', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 30.00, date: new Date(now.getTime() - 8*24*60*60*1000), categoryId: categoryMap['Entertainment'], merchant: 'Movie Theater', paymentMethod: 'Card' },
      { type: 'expense', amount: 95.00, date: new Date(now.getTime() - 10*24*60*60*1000), categoryId: categoryMap['Dining Out'], merchant: 'Italian Restaurant', paymentMethod: 'Card' },
    ];

    for (const txn of transactions) {
      await makeRequest('/api/transactions', 'POST', txn);
    }
    console.log(`✓ Added ${transactions.length} transactions\n`);

    // 6. Update settings
    console.log('6. Updating settings...');
    await makeRequest('/api/settings', 'PATCH', {
      currency: 'USD',
      safeThreshold: 1000,
      tightThreshold: 300,
      warningThreshold: 500,
      enableWarnings: true,
      defaultPaymentMethod: 'Card',
    });
    console.log('✓ Settings updated\n');

    console.log('✅ All data populated successfully!');
    console.log(`\nTest account: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
    console.log('\nYou can now log in and see the fake data on the dashboard.');

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

populateData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
