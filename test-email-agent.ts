#!/usr/bin/env tsx

import { assistantNetwork } from './lib/network';

async function testEmailAgent() {
  console.log('🧪 Testing Email Agent through Network...');
  
  try {
    // Test the network with an email request
    const result = await assistantNetwork.run(
      "Send an email to team@company.com with the subject 'Weekly Update' and ask them to provide their project status updates for this week."
    );
    
    console.log('📧 Network Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error testing email agent:', error);
  }
}

testEmailAgent(); 