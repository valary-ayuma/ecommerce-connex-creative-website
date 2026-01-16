const AfricasTalking = require('africastalking');

// Initialize the SDK
const at = AfricasTalking({
    apiKey: process.env.AT_API_KEY, 
    username: process.env.AT_USERNAME
});

const sms = at.SMS;

const sendPickupSMS = async (phoneNumber, orderId, productName) => {
    // 1. Clean the number: Remove spaces or dashes
    let cleanNumber = phoneNumber.replace(/\s+/g, '');

    // 2. Format to +254...
    if (cleanNumber.startsWith('0')) {
        // Change 07... to +2547...
        cleanNumber = '+254' + cleanNumber.slice(1);
    } else if (cleanNumber.startsWith('254') && !cleanNumber.startsWith('+')) {
        // Change 254... to +254...
        cleanNumber = '+' + cleanNumber;
    } else if (!cleanNumber.startsWith('+')) {
        // Fallback for other formats
        cleanNumber = '+' + cleanNumber;
    }

    const options = {
        to: [cleanNumber], // Must be an array of formatted strings
        message: `Hello! Your order #${orderId} (${productName}) is ready for pickup at Connex Creative. Thank you!`
    };

    try {
        const response = await sms.send(options);
        console.log("SMS Sent Successfully:", response);
        return response;
    } catch (error) {
        console.error("SMS Error:", error.message || error);
        throw error; // Throw so the test script catches it
    }
};

module.exports = { sendPickupSMS };