const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AcsoGuard Visitor Management System...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  try {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created successfully');
    console.log('⚠️  Please update the .env file with your configuration before running the application\n');
  } catch (error) {
    console.log('❌ Error creating .env file:', error.message);
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  console.log('Installing server dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.log('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Seed database
console.log('🌱 Seeding database with test data...');
try {
  execSync('npm run seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully\n');
} catch (error) {
  console.log('❌ Error seeding database:', error.message);
  console.log('You can run "npm run seed" manually later\n');
}

console.log('🎉 Setup completed successfully!\n');
console.log('📋 Next steps:');
console.log('1. Update the .env file with your configuration');
console.log('2. Make sure MongoDB is running');
console.log('3. Run "npm run dev" to start the application');
console.log('4. Open http://localhost:3000 in your browser\n');

console.log('🔑 Test Accounts:');
console.log('Admin: admin@acsoguard.com / admin123');
console.log('Site Manager: manager@acsoguard.com / manager123');
console.log('Security Guard: security1@acsoguard.com / security123');
console.log('Receptionist: reception@acsoguard.com / reception123\n');

console.log('📚 For more information, see README.md');

