require('dotenv').config();
const { sendPickupSMS } = require('./smsService');

// Use a number that you registered in the Simulator
const testNumber = '0757184454'; 

console.log("Sending test SMS to Simulator...");

sendPickupSMS(testNumber, 'ORD-999', 'Branded Trial Bag')
    .then(response => {
        console.log("Check your Simulator window now!");
    })
    .catch(err => {
        console.error("Test failed because:", err);
    });