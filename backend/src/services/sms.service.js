// const twilio = require('twilio');
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

// const enableSMS = false;

// const sendSMS = (sms) => {
//   enableSMS &&
//     client.messages
//       .create({
//         body: sms,
//         from: '+16572975791',
//         to: '+14133453226',
//       })
//       .then((message) => console.log(message.sid));
// };

module.exports = {
  sendSMS: () => {},
};
