#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('🚀 Starting all services for AgentKit development...\n');

// Check if API key is set
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set in .env.local');
  console.error('Please add your Anthropic API key to .env.local file');
  process.exit(1);
}

console.log('✅ Anthropic API key found\n');

// Start Next.js dev server
console.log('📦 Starting Next.js development server...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Wait a bit for Next.js to start
setTimeout(() => {
  // Start AgentKit server
  console.log('\n🤖 Starting AgentKit server...');
  const agentKitProcess = spawn('npm', ['run', 'agentkit'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  // Wait for AgentKit to start, then start Inngest dev server
  setTimeout(() => {
    console.log('\n🔮 Starting Inngest dev server...');
    console.log('This provides orchestration and tracing for AgentKit\n');
    
    const inngestProcess = spawn('npx', ['inngest-cli@latest', 'dev', '-u', 'http://localhost:3010/api/inngest'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    console.log('\n✨ All services are starting up!');
    console.log('\n📍 Service URLs:');
    console.log('   - Next.js App: http://localhost:3000');
    console.log('   - AgentKit Server: http://localhost:3010');
    console.log('   - Inngest Dev Server: http://localhost:8288');
    console.log('   - Inngest Functions: http://localhost:8288/functions');
    console.log('\n🎯 To test AgentKit:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Try asking: "Create a bar chart of monthly sales"');
    console.log('   3. Watch the multi-agent execution in Inngest dashboard\n');

    // Handle process cleanup
    const cleanup = () => {
      console.log('\n🛑 Shutting down all services...');
      nextProcess.kill();
      agentKitProcess.kill();
      inngestProcess.kill();
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }, 5000); // Wait 5 seconds for AgentKit to start
}, 3000); // Wait 3 seconds for Next.js to start 