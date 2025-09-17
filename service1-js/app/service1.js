const http = require('http');

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

// ToDo: Descriptions
const optionsStorage1 = {
  hostname: 'storage',   // Docker Compose service name
  port: 8080,            // Port your storage service listens on
  path: '/log',          // Path you want to access
  method: 'GET'          // or 'POST' as needed
};

// ToDo: Descriptions
const optionsStorage2 = {
  hostname: 'storage',   // Docker Compose service name
  port: 8080,            // Port your storage service listens on
  path: '/log',          // Path you want to access
  method: 'POST'         // or 'GET' as needed
};

// Handle GET and POST requests
http.createServer((request, response) => {
  // generate a website
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Handle task!
  switch(request.method) {
    case 'GET':
      if (request.url === options.status.path) forwardRequest(optionsStorage1, response);
      else response.writeHead(400, {'Content-Type': 'text/html'});
      break;
    case 'POST':
      // build body for POST requests (we have to wait for the full body)
      let body = '';
      if (request.url === options.log.path) {
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {forwardRequest(optionsStorage2, response, body); });
      } else response.writeHead(400, {'Content-Type': 'text/html'});
      break;
    default:
      response.writeHead(400, {'Content-Type': 'text/html'});
      response.end('Not found');
  }

  //response.end('Hello from Service 1');
}).listen(options.port);

function forwardRequest(settings, response, body = '') {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end(body);

  /*
  const request = http.request(settings, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      response.writeHead(res.statusCode, {'Content-Type': 'text/html'});
      response.end(data);
    });
  })

  request.write(body);
  request.end();
  */
}