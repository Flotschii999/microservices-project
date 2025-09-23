//-------------------------------------------------------------------------------
//- Requirements
//-------------------------------------------------------------------------------
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process'); // to run shell commands
// const os = require('os'); instead of execSync with os.freeSpace -> but delivers the wrong output.

//-------------------------------------------------------------------------------
//- Properties
//-------------------------------------------------------------------------------
// Options for GET and POST requests
const settings = {
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
const LOG_FILE = '/vstorage/log.txt'; // use shared volume

//-------------------------------------------------------------------------------
//- Configuration (Server setup)
// Handle GET and POST requests
//-------------------------------------------------------------------------------
http.createServer((request, response) => {
  try {
    // because it is public callable! (used for my test script!)
    response.setHeader('Access-Control-Allow-Origin', '*');
    
    // Handle the request
    handleRequests(request, response);
  } catch (error) {
    console.error('Error handling request:', error);
    endResponse(response, 500, `Internal Server Error: ${error.message}`);
  }
}).listen(settings.port);

//-------------------------------------------------------------------------------
//- Main
//-------------------------------------------------------------------------------
// Handler function for incoming requests
async function handleRequests(request, response) {
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
      handleGetRequests(request, response, record); // add the record as additional data to the status response
      break;
    case 'POST':
      let body = '';
      // build body for POST requests (we have to wait for the full body)
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {handlePostRequests(request, response, body)});
      break;
    default:
      endResponse(response, 404, `Request Method ${request.method} not implemented`); // for all other requests we just return OK
  }
}

//-------------------------------------------------------------------------------
//- Helpers
//-------------------------------------------------------------------------------
// function to handle GET requests
// returns true if handled, otherwise false
function handleGetRequests(request, response, additionalData = '') {
  // Initialize
  var handled = false;

  // handle the request based on the URL
  switch(request.url) {
    case settings.status.path:
      sendRequest(settingsService2, '', (res, data) => {endResponse(response, res.statusCode, `${additionalData}\n${data}`)});
      handled = true;
      break;
    case settings.log.path:
      sendRequest(settingsStorageRead, '', (res, data) => {endResponse(response, res.statusCode, data)});
      handled = true;
      break;
    default:
      endResponse(response, 404, `Endpoint ${request.url} not found`); 
  }
  return handled;
}

// function to handle POST requests
// returns true if handled, otherwise false
function handlePostRequests(request, response, body){
  // Initialize
  var handled = false;
  const callback = (res, data) => {endResponse(response, res.statusCode, data)}

  // handle the request based on the URL
  switch(request.url) {
    case settings.log.path:
      handled = false;
      /* POST /log Forward to storage
        *
        * Would work as well 
        * Has been removed because i missunderstood the exercise ;)
        * I'm not sure if i lose points when i this feature is implemented ;)
        * Better safe than sorry ;)
        
        handled = true;
        sendRequest(settingsStorageWrite, body, callback);
        return; // we will end the response in the sendRequest event!
      */

      //sendRequest(settingsStorageWrite, body, callback);
      endResponse(response, 404, 'feature not implemented - pls contact me ;)'); 
      break;
    default:
      endResponse(response, 404, `Endpoint ${request.url} not found`); 
  }
  return handled;
}

// function to send a request and handle the response with a callback
function sendRequest(settings, message = '', callback = (data) => {}) {
  const req = http.request(settings, (response) => {
    let data = '';
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {callback(response, data)});
  })

  req.write(message);
  req.end();
}

// common function to end a response
function endResponse(response, statusCode, message, contentType='text/plain') {
  response.writeHead(statusCode, {'Content-Type': contentType});
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
