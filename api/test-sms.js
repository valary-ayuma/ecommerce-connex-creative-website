require('dotenv').config();
const { sendPickupSMS } = require('./smsService');

// Try sending a test to your own number
sendPickupSMS('0712345678', 'TEST-001', 'Branded Hoodie')
    .then(() => console.log("Test script finished."))
    .catch(err => console.error(err));