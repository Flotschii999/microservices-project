//-------------------------------------------------------------------------------
//- Requirements
//-------------------------------------------------------------------------------
// Help on: https://nodejs.org/api/http.html
const http = require('http');
const fs = require('fs');

//-------------------------------------------------------------------------------
//- Properties
//-------------------------------------------------------------------------------
// settings for GET and POST requests
const settingsServer = {
  hostname: 'storage', // Docker Compose service name
  port: 5002,
  path: '/',
};

// Log file path
const LOG_FILE = '/storage/log.txt';

//-------------------------------------------------------------------------------
//- Configuration (Server setup)
// Handle GET and POST requests
//-------------------------------------------------------------------------------
http.createServer((request, response) => {
  try {    
    // Handle the request
    handleRequest(request, response);
  } catch (error) {
    console.error('Error handling request:', error);
    endResponse(response, 500, `Internal Server Error: ${error.message}`);
  }
}).listen(settingsServer.port);

//-------------------------------------------------------------------------------
//- Main
//-------------------------------------------------------------------------------
// Handler function for incoming requests
function handleRequest(request, response) {
  // Init
  let body = '';
  statusCode = 400;
  
  switch(request.method) {
    case "GET":
      if (request.url === settingsServer.path) {
        const result = readLog();
        body = result.message;
        statusCode = result.success ? 200 : 400;
      }
      break;
    case "POST":
      // build body for POST requests (we have to wait for the full body)
      if (request.url === settingsServer.path) {
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {
          statusCode = log(body) ? 200 : 400;
          endResponse(response, statusCode, body);
        });
        return; // we will end the response in the 'end' event!
      }
      break;
    default:
      // Nothing to do!
  }

  endResponse(response, statusCode, body);
}

//-------------------------------------------------------------------------------
//- Helpers
//-------------------------------------------------------------------------------
function readLog() {
  if (fs.existsSync(LOG_FILE)){
    message = fs.readFileSync(LOG_FILE, 'utf8');
    return {success: true, message};
  }
  return {success: false, message};  
}

// function to log a message to the log file
function log(message) {
  try {
    fs.appendFileSync(LOG_FILE, message+'\n');
    return true;
  } catch (error) {
    console.error('Error writing to log file:', error);
    return false;
  }
}

function endResponse(response, statusCode, message) {
  response.writeHead(statusCode, {'Content-Type': 'text/html'});
  response.end(message); 
}
