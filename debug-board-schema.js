// Debug script to get Monday.com board schema
const https = require('https');

const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjMyNzExMzc4OCwiYWFpIjoxMSwidWlkIjo0NDg1MzkyOSwiaWFkIjoiMjAyNC0wMi0yOVQxNDoyMDo0MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTc1MDU4MDMsInJnbiI6ImV1YzEifQ.8G2P2KFUk0jjw1oRmYy-Gj-toiB1Lyj_kyllKvCU5T0';
const BOARD_ID = '1953505209'; // Correct board ID provided by user

// GraphQL query to get board schema and data
const query = `
  query GetBoardSchema($boardId: ID!) {
    boards(ids: [$boardId]) {
      id
      name
      description
      columns {
        id
        title
        type
        settings_str
      }
      groups {
        id
        title
      }
      items_page(limit: 10) {
        items {
          id
          name
          column_values {
            id
            type
            value
            text
          }
        }
      }
    }
  }
`;

const data = JSON.stringify({
  query: query,
  variables: { boardId: BOARD_ID }
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

console.log('🔍 Fetching board schema for board:', BOARD_ID);

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

      if (!result.data || !result.data.boards || result.data.boards.length === 0) {
        console.error('❌ No boards found or access denied');
        return;
      }

      const board = result.data.boards[0];
      
      console.log('✅ Board Found:', board.name);
      console.log('📊 Board ID:', board.id);
      
      console.log('\n📋 COLUMNS:');
      board.columns.forEach((col, index) => {
        console.log(`${index + 1}. "${col.title}" (${col.type}) - ID: ${col.id}`);
      });
      
      console.log('\n👥 GROUPS:');
      board.groups.forEach((group, index) => {
        console.log(`${index + 1}. "${group.title}" - ID: ${group.id}`);
      });
      
      console.log('\n📝 SAMPLE ITEMS:');
      board.items_page.items.forEach((item, index) => {
        console.log(`\n${index + 1}. Item: "${item.name}" (ID: ${item.id})`);
        item.column_values.forEach(col => {
          // Find column title from board columns
          const columnInfo = board.columns.find(c => c.id === col.id);
          const columnTitle = columnInfo ? columnInfo.title : col.id;
          if (col.text || col.value) {
            console.log(`   - ${columnTitle}: ${col.text || col.value}`);
          }
        });
      });
      
      // Save detailed results to file
      require('fs').writeFileSync('board-analysis.json', JSON.stringify(result.data, null, 2));
      console.log('\n💾 Detailed results saved to board-analysis.json');
      
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