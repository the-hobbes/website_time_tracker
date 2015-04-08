from flask import Flask, request, jsonify
app = Flask(__name__)
app.config['DEBUG'] = True

# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

@app.route('/')
def root():
    """Handle requests for app root."""
    return 'Root of the application.'

@app.route('/pie', methods=['POST'])
def receive_data():
    """Receive date from an ajax call."""
    # test with: 
    # curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz""password":"xyz"}' http://localhost:9080/pie
    json_received = request.get_json()
    print json_received
    return jsonify(json_received)

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, nothing at this URL.', 404
