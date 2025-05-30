import { config } from 'dotenv';
config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

// Test prompts for the visualization pipeline
const testPrompts = [
  {
    name: "Line Chart Test",
    message: "I need to visualize monthly sales trends for 2024",
    expectedFlow: ["Chart Picker", "Data Agent", "BEM Data Cleaner", "Chart Agent"]
  },
  {
    name: "Bar Chart Test", 
    message: "Show me a comparison of department budgets",
    expectedFlow: ["Chart Picker", "Data Agent", "BEM Data Cleaner", "Chart Agent"]
  },
  {
    name: "Pie Chart Test",
    message: "Display market share distribution for our top 5 products",
    expectedFlow: ["Chart Picker", "Data Agent", "BEM Data Cleaner", "Chart Agent"]
  },
  {
    name: "Multi-Series Line Chart Test",
    message: "Compare revenue trends across North America, Europe, and Asia over the last 12 months",
    expectedFlow: ["Chart Picker", "Data Agent", "BEM Data Cleaner", "Chart Agent"]
  },
  {
    name: "Stacked Bar Chart Test",
    message: "Show quarterly sales breakdown by product category",
    expectedFlow: ["Chart Picker", "Data Agent", "BEM Data Cleaner", "Chart Agent"]
  }
];

async function testVisualizationPipeline(prompt: typeof testPrompts[0]) {
  console.log(`\n🧪 Testing: ${prompt.name}`);
  console.log(`📝 Prompt: "${prompt.message}"`);
  console.log(`📊 Expected flow: ${prompt.expectedFlow.join(' → ')}\n`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt.message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    if (!reader) {
      throw new Error('No response body');
    }

    console.log('📡 Receiving response...\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              process.stdout.write(parsed.content);
              result += parsed.content;
            }
            if (parsed.toolCall) {
              console.log(`\n🔧 Tool Call: ${parsed.toolCall.name}`);
              if (parsed.toolCall.type === 'chart') {
                console.log(`✅ Chart Generated: ${parsed.toolCall.data.type} - ${parsed.toolCall.data.title}`);
                console.log(`📊 Data points: ${parsed.toolCall.data.data.length}`);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    console.log('\n✅ Test completed!\n');
    console.log('---'.repeat(20));
    
  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Visualization Pipeline Tests');
  console.log('⏰ Waiting 5 seconds for services to fully start...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  for (const prompt of testPrompts) {
    await testVisualizationPipeline(prompt);
    // Wait between tests to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('\n💡 Check the Inngest dashboard at http://localhost:8288 to see the agent execution traces');
}

// Run the tests
runAllTests().catch(console.error); 