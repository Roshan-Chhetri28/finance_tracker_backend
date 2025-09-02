// Sample test script for the X.AI-powered financial advisor API
// You can run this with Node.js to test the advisor functionality
// Usage: node test-advisor.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:8080/api/advisor';

async function testAdvisorHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('Health check response:', data);
    return data.success;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function testAdvisorChat(query) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    console.log('Chat response:', data);
    return data;
  } catch (error) {
    console.error('Chat request failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing Financial Advisor API...');
  
  // Test health endpoint
  const healthStatus = await testAdvisorHealth();
  if (!healthStatus) {
    console.error('Health check failed, skipping chat test.');
    return;
  }
  
  // Test chat endpoint with various financial questions
  const questions = [
    'How am I doing financially this month?',
    'What are my biggest expense categories?',
    'How can I improve my savings?',
    'Should I invest more based on my current finances?',
    'Can you help me create a budget plan?'
  ];
  
  for (const question of questions) {
    console.log(`\n=== Testing question: "${question}" ===`);
    await testAdvisorChat(question);
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nAll tests completed!');
}

runTests().catch(console.error);
