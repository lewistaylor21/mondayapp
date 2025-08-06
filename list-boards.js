// List all boards to find the correct board ID
const https = require('https');

const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjMyNzExMzc4OCwiYWFpIjoxMSwidWlkIjo0NDg1MzkyOSwiaWFkIjoiMjAyNC0wMi0yOVQxNDoyMDo0MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTc1MDU4MDMsInJnbiI6ImV1YzEifQ.8G2P2KFUk0jjw1oRmYy-Gj-toiB1Lyj_kyllKvCU5T0';

// GraphQL query to list all boards
const query = `
  query {
    boards(limit: 50) {
      id
      name
      description
      board_kind
    }
  }
`;

const data = JSON.stringify({
  query: query
});

const options = {
  hostname: 'api.monday.com',
  path: '/v2',
  method: 'POST',
  headers: {
    'Authorization': API_TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔍 Fetching all boards...');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      
      if (result.errors) {
        console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
        return;
      }

      if (result.data && result.data.boards) {
        console.log(`✅ Found ${result.data.boards.length} boards:\n`);
        
        result.data.boards.forEach((board, index) => {
          console.log(`${index + 1}. "${board.name}" (ID: ${board.id})`);
          if (board.description) {
            console.log(`   Description: ${board.description}`);
          }
          console.log(`   Kind: ${board.board_kind}`);
          console.log('');
        });
        
        // Look for "NEW CUSTOMER V2" board
        const targetBoard = result.data.boards.find(b => 
          b.name.toLowerCase().includes('new customer v2') ||
          b.name.toLowerCase().includes('customer')
        );
        
        if (targetBoard) {
          console.log(`🎯 Found target board: "${targetBoard.name}" (ID: ${targetBoard.id})`);
        }
        
      } else {
        console.error('❌ No boards data returned');
        console.log('Full response:', responseData);
      }
      
    } catch (error) {
      console.error('❌ Parse Error:', error.message);
      console.error('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(data);
req.end();