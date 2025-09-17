// Help on: https://nodejs.org/api/http.html
const http = require('http');
const fs = require('fs');
const path = require('path');

// Options for GET and POST requests
const restOptions = {
  hostname: 'storage',   // Docker Compose service name
  port: 8080,
  path: '/log',
};

// Log file path
const LOG_FILE = '/vstorage/log.txt';

// Handle GET and POST requests
http.createServer(function (request, response) {
  body = '';
  statusCode = 400;

  switch(request.method) {
    case "GET":
      if (request.url === restOptions.path) {
        if (!fs.existsSync(LOG_FILE)){
          body = fs.readFileSync(LOG_FILE, 'utf8');
          statusCode = 201;
        }
      }
      break;
    case "POST":
      // build body for POST requests (we have to wait for the full body)
      let body = '';
      if (request.url === restOptionspath) {
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {fs.appendFileSync(LOG_FILE, body + '\n'); statusCode = 200;});
      } else response.writeHead(400, {'Content-Type': 'text/html'});
      break;
    default:
      // Nothing to do!
  }
  response.writeHead(statusCode, {'Content-Type': 'text/html'});
  response.end(body);
}).listen(restOptions.port);
