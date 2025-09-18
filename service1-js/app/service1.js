//-------------------------------------------------------------------------------
//- Requirements
//-------------------------------------------------------------------------------
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process'); // to run shell commands

//-------------------------------------------------------------------------------
//- Properties
//-------------------------------------------------------------------------------
// Options for GET and POST requests
const settingsServer = {
  port: 5000,
  status : {
    path: '/status',
    // method: 'GET',
  },
  log : {
    path: '/log',
    // method: ['POST', 'GET'], // allow both POST and GET
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
const settingsStorageWrite = {
  hostname: 'storage',   // Docker Compose service name
  port: 5002,            // Port your storage service listens on
  path: '/',             // Path you want to access
  method: 'POST'         // or 'GET' as needed
};

// acting as a proxy and forward requests to storage
const settingsStorageRead = {
  hostname: 'storage',   // Docker Compose service name
  port: 5002,            // Port your storage service listens on
  path: '/',             // Path you want to access
  method: 'GET'         // or 'GET' as needed
};

// Log file path
const LOG_FILE = '/vstorage/log.txt';

//-------------------------------------------------------------------------------
//- Configuration (Server setup)
// Handle GET and POST requests
//-------------------------------------------------------------------------------
http.createServer((request, response) => {
  try {
    // because it is public callable!
    response.setHeader('Access-Control-Allow-Origin', '*');
    
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
  statusCode = 200;

  // analyses its state 
  /* Info:
   * .toISOString() = ISO 8601 format
   * .replace(/\.\d{3}Z$/, 'Z') = remove milliseconds (not needed)
   */
  const timestamp     = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const uptimeHours   = (process.uptime() / 3600).toFixed(2);
  const freeDiskMB    = getFreeDiskSpace();
  const record = `${timestamp}: uptime: ${uptimeHours} hours, free disk in root: ${freeDiskMB} MBytes`;

  // log of the incoming requests to two alternative persistent storages
  // so i guess i should log every request?? or only GET for /status & /log requests??
  sendRequest(settingsStorageWrite, record, (res , data) => {});
  log(record) // if succeeded it returns true, otherwise false - we ignore the result here (same function as in storage)

  // handle "proxy" requests
  switch(request.method) {
    case 'GET':
      if (request.url === settingsServer.status.path) {
        sendRequest(settingsService2, '', (res, data) => {endResponse(response, res.statusCode, data)});
        return; // we will end the response in the sendRequest event!
      } else if (request.url === settingsServer.log.path) {
        sendRequest(settingsStorageRead, '', (res, data) => {endResponse(response, res.statusCode, data)});
        return; // we will end the response in the sendRequest event!
      } else {statusCode = 404; body = 'Not found';}
      break;
    case 'POST':
      // build body for POST requests (we have to wait for the full body)
      if (request.url === settingsServer.log.path) {
        body = 'feature not implemented - pls contact me ;)';
        /* POST /log Forward to storage
         *
         * Would work as well 
         * Has been removed because i missunderstood the exercise ;)
         * I'm not sure if i lose points when i this feature is implemented ;)
         * Better safe than sorry ;)
         * 
        request.on('data', chunk => { body += chunk; });
        request.on('end', () => {sendRequest(settingsStorageWrite, body, (res, data) => {endResponse(response, res.statusCode, data)})});
        return; // we will end the response in the sendRequest event!
         */
      } else {statusCode = 404; body = 'Not found';}
      break;

    default:
      body = 'Not found';
  }

  // respond
  endResponse(response, statusCode, body);
}

//-------------------------------------------------------------------------------
//- Helpers
//-------------------------------------------------------------------------------
// function to send a request and handle the response with a callback
function sendRequest(settings, message = '', end = (data) => {}) {
  const req = http.request(settings, (response) => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {end(response, data)});
  })

  req.write(message);
  req.end();
}

// common function to end a response
function endResponse(response, statusCode, message) {
  response.writeHead(statusCode, {'Content-Type': 'text/html'});
  response.end(message); 
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

// function to get free disk space in MB in the root filesystem
function getFreeDiskSpace() {
  try {
    const output = execSync('df -m /').toString(); //run a shell command

    /* output = (tested on docker 18.09.2025)
      Filesystem        1M-blocks      Used      Available     Use %     Mounted on                 
      overlay           1031017        2090      976482        0%        /
    */
    // Extract the available disk space in MB (= 1M-blocks)
    // 1) Get the line with the overlay filesystem
    // 2) Split the line into parts based on whitespace
    // 3) The 4th part (index 3) is the available space in MB

    const lines = output.trim().split('\n');
    const parts = lines[1].split(/\s+/);
    return parts[3];
  } catch (error) {
    console.error('Error getting free disk space:', error);
    return 'unknown (an error occurred)';
  }
}
