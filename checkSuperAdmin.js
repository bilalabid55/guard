require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acsoguard';

const checkSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const User = require('./server/models/User');
    const superAdminEmail = 'superadmin@acsoguard.com';
    
    console.log(`\nChecking super admin with email: ${superAdminEmail}`);
    const user = await User.findOne({ email: superAdminEmail.toLowerCase() });
    
    if (!user) {
      console.log('❌ No super admin found with this email');
      return;
    }

    console.log('\n✅ Super Admin Details:');
    console.log(`ID: ${user._id}`);
    console.log(`Name: ${user.fullName || user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log('\n✅ Verification complete');
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare('superadmin123', user.password);
    console.log(`\n🔑 Password verification: ${isMatch ? '✅ Valid' : '❌ Invalid'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking super admin:', error);
    process.exit(1);
  }
};

checkSuperAdmin();
