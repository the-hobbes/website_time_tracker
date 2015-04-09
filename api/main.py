from flask import Flask, request, jsonify, render_template
app = Flask(__name__)
app.config['DEBUG'] = True

# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

@app.route('/')
def root():
    """Handle requests for app root."""
    # currently, just renders the placeholder pie chart
    
    return render_template('render_pie.html')

@app.route('/pie', methods=['POST'])
def receive_data():
    """Receive date from an ajax call."""
    # test with: 
    # curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:9080/pie
    json_received = request.get_json()
    print json_received
    # return jsonify(json_received)
    return render_template('render_pie.html')

@app.errorhandler(400)
def page_not_found(e):
    """Return a custom 400 error."""
    print e, request
    return 'Bad Request.', 400

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, nothing at this URL.', 404
