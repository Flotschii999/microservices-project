#-------------------------------------------------------------------------------
#- Requirements
#-------------------------------------------------------------------------------
from flask import Flask, Response, request
import requests

#-------------------------------------------------------------------------------
#- Configuration 
#-------------------------------------------------------------------------------
app = Flask(__name__)

#-------------------------------------------------------------------------------
#- Properties 
#-------------------------------------------------------------------------------
settingsStorage = {
    'hostname': 'storage',  # Docker Compose service name
    'port': 5002,           # Port your storage service listens on
    'path': '/',            # Path you want to access
}

#-------------------------------------------------------------------------------
#- Main
#-------------------------------------------------------------------------------
@app.route("/", methods=['GET'])
def handleMessages():
    record = "Hello from Service2 (Uptime usw)"
    status, text = store2Log(settings = settingsStorage, body = record)
    # ToDo: save to storage
    return Response(record, status=status, mimetype='text/plain')
    

#-------------------------------------------------------------------------------
#- Helpers
#-------------------------------------------------------------------------------
def store2Log(settings, body=''):
    url = f"http://{settings['hostname']}:{settings['port']}{settings['path']}"
    resp = requests.post(url, data=body, headers={'Content-Type': 'text/plain'})
    return resp.status_code, resp.text

#-------------------------------------------------------------------------------
#- Run the app
#-------------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="service2", port=5001)

