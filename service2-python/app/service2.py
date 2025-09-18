#-------------------------------------------------------------------------------
#- Requirements
#-------------------------------------------------------------------------------
from flask import Flask, Response, request
from datetime import datetime, timezone
import requests
import shutil # 

#-------------------------------------------------------------------------------
#- Properties 
#-------------------------------------------------------------------------------
settingsStorage = {
    'hostname': 'storage',  # Docker Compose service name
    'port': 5002,           # Port your storage service listens on
    'path': '/',            # Path you want to access
}

# Log file path
LOG_FILE = '/vstorage/log.txt';

# Record the start time of the service - used to calculate uptime
startTime = datetime.now(timezone.utc)

#-------------------------------------------------------------------------------
#- Configuration 
#-------------------------------------------------------------------------------
app = Flask("service-2")
@app.route("/", methods=['GET'])
def server():
    try:
        return handleRequest()
    except Exception as e:
        print(f"Error handling request: {e}")
        return Response(f"Internal Server Error: {e}", status=500, mimetype='text/plain')  

#-------------------------------------------------------------------------------
#- Main
#-------------------------------------------------------------------------------
def handleRequest():
    # analyses its state 
    timestamp       = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    uptimeHours     = ((datetime.now(timezone.utc) - startTime).total_seconds() / 3600).__format__('.2f') # total hours with 2 decimal places
    freeDiskMB      = getFreeDiskSpace('/')
    record = f"{timestamp}: uptime: {uptimeHours} hours, free disk in root: {freeDiskMB} MBytes"

    # log of the incoming requests to two alternative persistent storages
    status, text = sendRequest(settings = settingsStorage, body = record)
    log(record)

    # respond
    return Response(record, status=status, mimetype='text/plain')
    

#-------------------------------------------------------------------------------
#- Helpers
#-------------------------------------------------------------------------------
# function to send HTTP POST request
def sendRequest(settings, body=''):
    url = f"http://{settings['hostname']}:{settings['port']}{settings['path']}" # by using f-strings - https://realpython.com/python-f-strings/
    resp = requests.post(url, data=body, headers={'Content-Type': 'text/plain'})
    return resp.status_code, resp.text

# function to log a message to the log file
def log(message):
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as file:
            file.write(f"{message}\n")
    except Exception as e:
        print(f"Error writing to log file: {e}")

def getFreeDiskSpace(path='/'):
    try:
        total, used, free = shutil.disk_usage(path) # in bytes
        free_mb = free // (1024 * 1024)  # Convert bytes to MB - // operator for floor division with integers (no float result)
        return free_mb
    except Exception as e:
        print(f"Error getting free disk space: {e}")
        return 'unknown (an error occurred)'


#-------------------------------------------------------------------------------
#- Run the app
#-------------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="service2", port=5001)

