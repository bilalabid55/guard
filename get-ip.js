const https = require('https');

https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Your public IP address is:', result.ip);
      console.log('\nPlease add this IP to your MongoDB Atlas IP whitelist:');
      console.log(`1. Go to MongoDB Atlas Dashboard`);
      console.log(`2. Navigate to Network Access`);
      console.log(`3. Click "Add IP Address"`);
      console.log(`4. Add this IP: ${result.ip}`);
      console.log(`5. Save changes`);
    } catch (e) {
      console.error('Error getting IP:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
