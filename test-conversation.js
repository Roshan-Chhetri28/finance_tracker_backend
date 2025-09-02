// Test script for conversation history features
// Usage: node test-conversation.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:8080/api/advisor';

// Create a new conversation session
async function createSession() {
  try {
    const response = await fetch(`${API_URL}/session`, {
      method: 'POST'
    });
    
    const data = await response.json();
    console.log('Created session:', data);
    return data.sessionId;
  } catch (error) {
    console.error('Failed to create session:', error.message);
    return null;
  }
}

// Send a message and get a response
async function sendMessage(sessionId, query) {
  try {
    console.log(`\nSending message: "${query}"`);
    
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, sessionId }),
    });
    
    const data = await response.json();
    console.log('Received response:', data.advice);
    return data;
  } catch (error) {
    console.error('Message failed:', error.message);
    return null;
  }
}

// Get conversation history
async function getHistory(sessionId) {
  try {
    const response = await fetch(`${API_URL}/history/${sessionId}`);
    const data = await response.json();
    
    console.log('\nConversation History:');
    data.history.forEach((msg, i) => {
      console.log(`[${msg.role}]: ${msg.message}`);
      if (i < data.history.length - 1) console.log('---');
    });
    
    return data.history;
  } catch (error) {
    console.error('Failed to get history:', error.message);
    return [];
  }
}

// Run a multi-turn conversation test
async function testConversation() {
  console.log('Starting conversation test with context maintenance...\n');
  
  // Create a new session
  const sessionId = await createSession();
  if (!sessionId) return;
  
  // First question - about overall finances
  await sendMessage(sessionId, "How am I doing financially this month?");
  
  // Follow-up question - should remember context from first question
  await sendMessage(sessionId, "What is my biggest expense category?");
  
  // More specific follow-up
  await sendMessage(sessionId, "How can I reduce spending in that category?");
  
  // Question that references earlier context
  await sendMessage(sessionId, "Can you suggest a budget based on this information?");
  
  // Get the full conversation history
  await getHistory(sessionId);
  
  console.log('\nTest completed successfully!');
  console.log(`Session ID: ${sessionId} (save this to continue the conversation later)`);
}

// Start the test
testConversation().catch(console.error);
