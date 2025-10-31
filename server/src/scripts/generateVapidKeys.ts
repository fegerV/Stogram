import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated:\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:admin@stogram.com\n`);
console.log('⚠️  Keep these keys secret and never commit them to version control!\n');
