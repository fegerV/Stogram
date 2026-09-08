"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
async function fixAlicePassword() {
    try {
        await prisma_1.default.$connect();
        console.log('✓ Database connection established');
        const user = await prisma_1.default.user.findFirst({
            where: { email: 'alice@test.com' }
        });
        if (!user) {
            console.log('❌ User alice@test.com not found');
            return;
        }
        console.log(`✓ Found user: ${user.username} (${user.email})`);
        const testPassword = 'password123';
        const isValid = await bcryptjs_1.default.compare(testPassword, user.password);
        console.log(`Current password valid: ${isValid}`);
        if (!isValid) {
            console.log('Updating password...');
            const hashed = await bcryptjs_1.default.hash(testPassword, 12);
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { password: hashed }
            });
            console.log('✅ Password updated successfully!');
        }
        else {
            console.log('✅ Password is already correct');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
fixAlicePassword();
//# sourceMappingURL=fixAlicePassword.js.map