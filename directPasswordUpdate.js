require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acsoguard';

const updateSuperAdminPassword = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const User = require('./server/models/User');
    const superAdminEmail = 'superadmin@acsoguard.com';
    
    console.log(`\n🔍 Finding super admin with email: ${superAdminEmail}`);
    const user = await User.findOne({ email: superAdminEmail.toLowerCase() });
    
    if (!user) {
      console.log('❌ No super admin found with this email');
      return;
    }

    console.log('\n🔑 Updating password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);
    
    // Direct MongoDB update to bypass any middleware
    const result = await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Password updated successfully');
    console.log('Modified count:', result.modifiedCount);
    
    // Verify the update
    const updatedUser = await User.findById(user._id).select('+password');
    const isMatch = await bcrypt.compare('superadmin123', updatedUser.password);
    console.log('🔑 Password verification:', isMatch ? '✅ Valid' : '❌ Invalid');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
};

updateSuperAdminPassword();
