"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_push_1 = __importDefault(require("web-push"));
const vapidKeys = web_push_1.default.generateVAPIDKeys();
console.log('\n🔑 VAPID Keys Generated:\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:admin@stogram.com\n`);
console.log('⚠️  Keep these keys secret and never commit them to version control!\n');
//# sourceMappingURL=generateVapidKeys.js.map