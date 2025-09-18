//-------------------------------------------------------------------------------
//- Requirements
//-------------------------------------------------------------------------------
const http = require('http');

//-------------------------------------------------------------------------------
//- Properties
//-------------------------------------------------------------------------------
// Options for GET and POST requests
const options = {
  port: 5000,
  status : {
    path: '/status',
    method: 'GET',
  },
  log : {
    path: '/log',
    method: 'POST',
  },
};

// acting as a proxy and forward requests to service2
const settingsService2 = {
  hostname: 'service2',  // Docker Compose service name
  port: 5001,            // Port your storage service listens on
  path: '/',             // Path you want to access
  method: 'GET'          // or 'POST' as needed
};

// acting as a proxy and forward requests to storage
const settingsStorage = {
  hostname: 'storage',   // Docker Compose service name
  port: 5002,            // Port your storage service listens on
  path: '/',             // Path you want to access
  method: 'POST'         // or 'GET' as needed
};

//-------------------------------------------------------------------------------
//- Main
//-------------------------------------------------------------------------------
// Handle GET and POST requests
http.createServer((request, response) => {
  // Init
  let body = '';
  statusCode = 400;

  // because it is public callable!
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Handle task!
  switch(request.method) {
    case 'GET':
      if (request.url === options.status.path) {
        forwardRequest(settingsService2, response);
        return; // we will end the response in the forwardRequest event!
      } 
      break;
    case 'POST':
      // build body for POST requests (we have to wait for the full body)
      if (request.url === options.log.path) {
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {forwardRequest(settingsStorage, response, body); });
        return; // we will end the response in the forwardRequest event!
      }
      break;
    default:
      body = 'Not found';
  }

  endResponse(response, statusCode, body);
}).listen(options.port);

//-------------------------------------------------------------------------------
//- Helpers
//-------------------------------------------------------------------------------
function forwardRequest(settings, response, body = '') {
  const forwardRequest = http.request(settings, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {endResponse(response, res.statusCode, data)});
  })

  forwardRequest.write(body);
  forwardRequest.end();
}

// common function to end a response
function endResponse(response, statusCode, message) {
  response.writeHead(statusCode, {'Content-Type': 'text/html'});
  response.end(message); 
}