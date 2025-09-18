//-------------------------------------------------------------------------------
//- Requirements
//-------------------------------------------------------------------------------
// Help on: https://nodejs.org/api/http.html
const http = require('http');
const fs = require('fs');

//-------------------------------------------------------------------------------
//- Properties
//-------------------------------------------------------------------------------
// Options for GET and POST requests
const restOptions = {
  hostname: 'storage', // Docker Compose service name
  port: 5002,
  path: '/',
};

// Log file path
const LOG_FILE = '/vstorage/log.txt';

//-------------------------------------------------------------------------------
//- Main
//-------------------------------------------------------------------------------
// Handle GET and POST requests
http.createServer(function (request, response) {
  let body = '';
  statusCode = 400;
  
  switch(request.method) {
    case "GET":
      if (request.url === restOptions.path) 
        statusCode = readLog(body) ? 200 : 400;
      break;
    case "POST":
      // build body for POST requests (we have to wait for the full body)
      if (request.url === restOptions.path) {
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {
          statusCode = logMessage(body) ? 200 : 400;
          endResponse(response, statusCode, body);
        });
        return; // we will end the response in the 'end' event!
      }
      break;
    default:
      // Nothing to do!
  }

  endResponse(response, statusCode, body);
}).listen(restOptions.port);

//-------------------------------------------------------------------------------
//- Helpers
//-------------------------------------------------------------------------------
function readLog(message) {
  if (fs.existsSync(LOG_FILE)){
    message = fs.readFileSync(LOG_FILE, 'utf8');
    return true;
  }
  return false  
}

function logMessage(message) {
  const logEntry = `${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Helsinki', hour12: false })} - ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  return true; // success
}

function endResponse(response, statusCode, message) {
  response.writeHead(statusCode, {'Content-Type': 'text/html'});
  response.end(message); 
}
