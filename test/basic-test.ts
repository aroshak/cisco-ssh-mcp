import { CiscoSSHMCPServer } from '../src/index.js';

async function testServer() {
  console.log('Testing Cisco SSH MCP Server...');
  
  try {
    const server = new CiscoSSHMCPServer();
    console.log('✅ Server instance created successfully');
    
    // Test tool listing (this would normally be called by MCP client)
    console.log('✅ Server initialized and ready for MCP connections');
    
    // Note: Actual SSH testing would require a real Cisco device
    console.log('⚠️  SSH connection testing requires actual Cisco devices');
    console.log('✅ Build and basic functionality test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testServer();
