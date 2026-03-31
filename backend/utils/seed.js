const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Clear existing admins
    await Admin.deleteMany({});

    // Create default admin
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@mangalyog.com',
      password: 'admin123',
    });

    console.log('✅ Default admin created:');
    console.log('   Email   :', admin.email);
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
