require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
const Subscription = require('./server/models/Subscription');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acsoguard';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const superAdminEmail = 'superadmin@acsoguard.com';
    
    // Check if super admin already exists
    console.log(`Checking for existing admin with email: ${superAdminEmail}`);
    const existingAdmin = await User.findOne({ email: superAdminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log('ℹ️  Super admin already exists. Updating...');
      // Update existing admin to super_admin role and reset password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      existingAdmin.role = 'super_admin';
      existingAdmin.isActive = true;
      existingAdmin.email = superAdminEmail.toLowerCase();
      existingAdmin.password = hashedPassword; // Update password with new hash
      
      await existingAdmin.save();
      console.log('✅ Super admin updated successfully with new password');
    } else {
      // Create new super admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      const superAdmin = new User({
        name: 'Super Admin',
        fullName: 'Super Admin',
        email: 'superadmin@acsoguard.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        emailVerified: true,
        phone: '+1234567890',
        company: 'ACSO Guard',
        position: 'Super Administrator'
      });

      await superAdmin.save();
      console.log('Super admin created successfully');
    }

    // Create a default unlimited subscription for super admin
    await Subscription.findOneAndUpdate(
      { adminId: (await User.findOne({ email: 'superadmin@acsoguard.com' }))._id },
      {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        memberLimit: 1000 // Effectively unlimited
      },
      { upsert: true, new: true }
    );
    
    console.log('Super admin setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
