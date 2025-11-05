require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🌱 Seeding super admin...');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@acsoguard.com' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      process.exit(0);
    }

    // Create super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);

    const superAdmin = new User({
      fullName: 'Super Admin',
      email: 'superadmin@acsoguard.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      phone: '+1234567890',
      address: 'AcsoGuard Headquarters'
    });

    await superAdmin.save();

    console.log('✅ Super admin created successfully');
    console.log('Email: superadmin@acsoguard.com');
    console.log('Password: superadmin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
