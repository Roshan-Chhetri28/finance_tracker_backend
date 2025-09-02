# Finance Tracker Backend

A robust backend API for tracking personal finances with AI-powered financial advice.

## Features

- User authentication and authorization
- Transaction management (income and expenses)
- Category management
- Financial reporting
- AI-powered financial advisor powered by X.AI's Grok model

## AI Financial Advisor

The application includes an AI-powered financial advisor that provides personalized financial advice based on your transaction history and financial data. The advisor can help with:

- Analyzing spending patterns
- Providing budget recommendations
- Answering financial questions
- Giving savings advice
- Identifying areas of potential financial improvement

The advisor includes conversation history support, allowing it to maintain context across multiple messages and provide more personalized advice over time.

## Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- X.AI API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database connection
psql_prod=your_production_database_connection_string
psql_dev=your_development_database_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# X.AI API Key
X_AI_API_KEY=your_xai_api_key_here
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## API Endpoints

### Financial Advisor

- `POST /api/advisor/chat`: Get financial advice from the AI advisor
  - Request body: `{ "query": "Your financial question here", "sessionId": "optional_session_id" }`
  - Response: `{ "success": true, "message": "Financial advice generated successfully", "advice": "AI-generated advice", "sessionId": "conversation_session_id" }`

- `GET /api/advisor/health`: Check if the advisor service is running

- `POST /api/advisor/session`: Create a new conversation session
  - Response: `{ "success": true, "message": "New conversation session created", "sessionId": "new_session_id" }`

- `GET /api/advisor/history/:sessionId`: Get conversation history for a session
  - Response: `{ "success": true, "history": [{"role": "user", "message": "...", "timestamp": "..."}, {"role": "assistant", "message": "...", "timestamp": "..."}] }`
