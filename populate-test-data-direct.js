import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMAIL = 'test@email.com';
const PASSWORD = 'TestPassword123!';

async function populateData() {
  console.log('Starting data population...\n');

  try {
    // 1. Create or find user
    console.log('1. Creating/finding user...');
    let user = await prisma.user.findUnique({
      where: { email: EMAIL },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: EMAIL,
          name: 'Test User',
          passwordHash: hashedPassword,
        },
      });
      console.log('✓ User created\n');
    } else {
      console.log('✓ User already exists\n');
    }

    // 2. Create settings for user if not exists
    console.log('2. Setting up user settings...');
    let settings = await prisma.settings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: user.id,
          currency: 'USD',
          safeThreshold: 1000,
          tightThreshold: 300,
          warningThreshold: 500,
          enableWarnings: true,
          defaultPaymentMethod: 'Card',
          theme: 'dark',
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { userId: user.id },
        data: {
          currency: 'USD',
          safeThreshold: 1000,
          tightThreshold: 300,
          warningThreshold: 500,
          enableWarnings: true,
          defaultPaymentMethod: 'Card',
          theme: 'dark',
        },
      });
    }
    console.log('✓ Settings updated\n');

    // 3. Delete existing data for fresh start
    console.log('3. Clearing old data...');
    await prisma.transaction.deleteMany({
      where: { userId: user.id },
    });
    await prisma.account.deleteMany({
      where: { userId: user.id },
    });
    await prisma.category.deleteMany({
      where: { userId: user.id },
    });
    console.log('✓ Old data cleared\n');

    // 3.5. Create accounts
    console.log('3.5. Creating accounts...');
    const accountData = [
      { name: 'Checking Account', type: 'checking', notes: 'Primary checking account', isDefault: true, order: 1 },
      { name: 'Savings Account', type: 'savings', notes: 'Emergency fund', isDefault: false, order: 2 },
      { name: 'Credit Card', type: 'credit', notes: 'Main credit card', isDefault: false, order: 3 },
      { name: 'Cash', type: 'cash', notes: 'Wallet cash', isDefault: false, order: 4 },
    ];

    const accounts = [];
    for (const acc of accountData) {
      const account = await prisma.account.create({
        data: {
          userId: user.id,
          name: acc.name,
          type: acc.type,
          notes: acc.notes,
          currentBalance: 0,
          isDefault: acc.isDefault,
          order: acc.order,
        },
      });
      accounts.push(account);
    }
    console.log(`✓ Created ${accounts.length} accounts\n`);

    // Update settings with default account
    await prisma.settings.update({
      where: { userId: user.id },
      data: { defaultAccountId: accounts[0].id },
    });

    // 4. Create categories with monthly budgets
    console.log('4. Creating categories with monthly budgets...');
    const categoryData = [
      { name: 'Groceries', type: 'expense', parentGroup: 'Essentials', monthlyBudget: 400 },
      { name: 'Rent', type: 'expense', parentGroup: 'Essentials', monthlyBudget: 1200 },
      { name: 'Utilities', type: 'expense', parentGroup: 'Essentials', monthlyBudget: 150 },
      { name: 'Dining Out', type: 'expense', parentGroup: 'Lifestyle', monthlyBudget: 300 },
      { name: 'Entertainment', type: 'expense', parentGroup: 'Lifestyle', monthlyBudget: 100 },
      { name: 'Gym', type: 'expense', parentGroup: 'Health', monthlyBudget: 65 },
      { name: 'Salary', type: 'income', parentGroup: 'Income', monthlyBudget: null },
      { name: 'Freelance', type: 'income', parentGroup: 'Income', monthlyBudget: null },
    ];

    const categories = [];
    for (let i = 0; i < categoryData.length; i++) {
      const cat = await prisma.category.create({
        data: {
          userId: user.id,
          name: categoryData[i].name,
          type: categoryData[i].type,
          parentGroup: categoryData[i].parentGroup,
          monthlyBudget: categoryData[i].monthlyBudget,
          budgetPeriod: 'monthly',
          order: i + 1,
        },
      });
      categories.push(cat);
    }
    console.log(`✓ Created ${categories.length} categories with budgets\n`);

    // 5. Create transactions
    console.log('5. Creating transactions...');
    const now = new Date();
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat.id;
    });

    // Distribute transactions across accounts
    const checkingAccount = accounts[0]; // Checking Account
    const savingsAccount = accounts[1]; // Savings Account
    const creditCardAccount = accounts[2]; // Credit Card
    const cashAccount = accounts[3]; // Cash

    const transactions = [
      // December transactions (current month)
      { type: 'income', amount: 3500, date: new Date(now.getTime() - 1*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Salary'], merchant: 'Employer Inc', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 1200, date: new Date(now.getTime() - 3*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Rent'], merchant: 'Landlord', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 85.50, date: new Date(now.getTime() - 2*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Groceries'], merchant: 'Whole Foods', paymentMethod: 'Card' },
      { type: 'expense', amount: 45.00, date: new Date(now.getTime() - 2*24*60*60*1000), accountId: cashAccount.id, categoryId: categoryMap['Groceries'], merchant: 'Trader Joes', paymentMethod: 'Card' },
      { type: 'expense', amount: 120.00, date: new Date(now.getTime() - 1*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Dining Out'], merchant: 'The Bistro', paymentMethod: 'Card' },
      { type: 'expense', amount: 65.00, date: new Date(now.getTime() - 0.5*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Gym'], merchant: 'Planet Fitness', paymentMethod: 'Card' },
      { type: 'expense', amount: 35.99, date: new Date(now.getTime() - 0.25*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Entertainment'], merchant: 'Netflix', paymentMethod: 'Card' },
      { type: 'expense', amount: 150.00, date: new Date(now.getTime() - 0.25*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Utilities'], merchant: 'City Power Company', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 22.50, date: new Date(now.getTime() - 4*24*60*60*1000), accountId: cashAccount.id, categoryId: categoryMap['Dining Out'], merchant: 'Coffee Shop', paymentMethod: 'Card' },
      { type: 'expense', amount: 55.00, date: new Date(now.getTime() - 5*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Groceries'], merchant: 'Safeway', paymentMethod: 'Card' },
      { type: 'income', amount: 200, date: new Date(now.getTime() - 7*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Freelance'], merchant: 'Client Project', paymentMethod: 'Transfer' },
      { type: 'expense', amount: 30.00, date: new Date(now.getTime() - 8*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Entertainment'], merchant: 'Movie Theater', paymentMethod: 'Card' },
      { type: 'expense', amount: 95.00, date: new Date(now.getTime() - 10*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Dining Out'], merchant: 'Italian Restaurant', paymentMethod: 'Card' },
      { type: 'expense', amount: 80.00, date: new Date(now.getTime() - 12*24*60*60*1000), accountId: checkingAccount.id, categoryId: categoryMap['Groceries'], merchant: 'Costco', paymentMethod: 'Card' },
      { type: 'expense', amount: 65.00, date: new Date(now.getTime() - 14*24*60*60*1000), accountId: creditCardAccount.id, categoryId: categoryMap['Dining Out'], merchant: 'Taco Tuesday', paymentMethod: 'Card' },
      { type: 'expense', amount: 500, date: new Date(now.getTime() - 18*24*60*60*1000), accountId: savingsAccount.id, categoryId: null, merchant: 'Transfer to Savings', paymentMethod: 'Transfer' },
    ];

    let totalBalance = 0;
    for (const txn of transactions) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: txn.type,
          amount: txn.amount,
          date: txn.date,
          accountId: txn.accountId,
          categoryId: txn.categoryId,
          merchant: txn.merchant,
          paymentMethod: txn.paymentMethod,
        },
      });
      // Track balance for account updates
      totalBalance += (txn.type === 'income' ? txn.amount : -txn.amount);
    }
    console.log(`✓ Created ${transactions.length} transactions\n`);

    // 6. Update account balances
    console.log('6. Updating account balances...');
    for (const account of accounts) {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const balance = accountTransactions.reduce((sum, t) =>
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      );
      await prisma.account.update({
        where: { id: account.id },
        data: { currentBalance: balance },
      });
    }
    console.log('✓ Account balances updated\n');

    console.log('✅ All data populated successfully!');
    console.log(`\nTest account: ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
    console.log('\nYou can now log in and see the fake data on the dashboard.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

populateData();
