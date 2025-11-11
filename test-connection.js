const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.MONGODB_URI.replace(/:([^:]*?)@/, ':***@'));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('✅ Successfully connected to MongoDB');    
    mongoose.connection.close();
    process.exit(0);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
