const puppeteer = require('puppeteer');

async function testUserLoginAndSettings() {
  console.log('🚀 Starting user login and settings test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    
    // Wait for the login page to load
    await page.waitForSelector('input[type="text"], input[type="email"]');
    console.log('✅ Login page loaded');
    
    // Fill in login credentials
    console.log('🔐 Filling in login credentials...');
    await page.type('input[type="text"], input[type="email"]', 'test@test.com');
    await page.type('input[type="password"]', 'password123');
    
    // Click login button
    console.log('🔘 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check current URL after login
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Check if we're on the chat page (authenticated)
    if (currentUrl.includes('localhost:5173/') && !currentUrl.includes('/login')) {
      console.log('✅ Successfully logged in and redirected to chat page');
      
      // Wait for chat interface to load
      await page.waitForSelector('.chat-list, [class*="chat"], [class*="message"]', { timeout: 5000 });
      console.log('✅ Chat interface loaded');
      
      // Look for settings button
      console.log('⚙️ Looking for settings button...');
      const settingsButton = await page.$('button:contains("Settings"), .settings-btn, [aria-label*="settings"]');
      
      if (!settingsButton) {
        // Look for menu button first
        console.log('🍔 Looking for menu button...');
        const menuButton = await page.$('button:has(.menu-icon), button:contains("Menu"), .menu-btn');
        
        if (menuButton) {
          console.log('✅ Menu button found, clicking...');
          await menuButton.click();
          await page.waitForTimeout(500);
          
          // Now look for settings in the dropdown
          const settingsInMenu = await page.$('a:contains("Settings"), button:contains("Settings")');
          if (settingsInMenu) {
            console.log('✅ Settings found in menu, clicking...');
            await settingsInMenu.click();
          }
        }
      } else {
        console.log('✅ Settings button found, clicking...');
        await settingsButton.click();
      }
      
      // Wait for settings modal/page to load
      await page.waitForTimeout(1000);
      
      // Check if settings modal is open
      const settingsModal = await page.$('.modal, .settings-modal, [class*="settings"]');
      
      if (settingsModal) {
        console.log('✅ Settings modal opened successfully!');
        
        // Test different settings tabs
        const tabs = ['profile', 'privacy', 'notifications', 'appearance'];
        
        for (const tab of tabs) {
          console.log(`📋 Testing ${tab} tab...`);
          const tabButton = await page.$(`button:contains("${tab}"), [data-tab="${tab}"], .${tab}-tab`);
          
          if (tabButton) {
            await tabButton.click();
            await page.waitForTimeout(500);
            console.log(`✅ ${tab} tab opened`);
          } else {
            console.log(`⚠️ ${tab} tab not found`);
          }
        }
        
        // Test privacy settings
        console.log('🔒 Testing privacy settings...');
        const privacyToggles = await page.$$('input[type="checkbox"]');
        
        for (let i = 0; i < Math.min(privacyToggles.length, 3); i++) {
          const toggle = privacyToggles[i];
          const isChecked = await page.evaluate(el => el.checked, toggle);
          
          console.log(`🔄 Toggle ${i + 1}: ${isChecked ? 'ON' : 'OFF'} → ${!isChecked ? 'ON' : 'OFF'}`);
          await toggle.click();
          await page.waitForTimeout(500);
        }
        
        console.log('✅ Privacy settings tested successfully!');
        
        // Close settings modal
        const closeButton = await page.$('.close-btn, button:contains("✕"), button:contains("Close")');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log('✅ Settings modal closed');
        }
        
      } else {
        console.log('❌ Settings modal not found');
      }
      
    } else {
      console.log('❌ Login failed or not redirected properly');
      console.log(`Expected to be on chat page, but ended up at: ${currentUrl}`);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('📸 Screenshot saved as test-result.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved as error-screenshot.png');
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testUserLoginAndSettings().catch(console.error);