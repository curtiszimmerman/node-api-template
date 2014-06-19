/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file web.js
 * primary application driver
 * @author curtis zimmerman
 * @contact curtis.zimmerman@gmail.com
 * @license GPLv2
 * @version 0.0.1a
 */

/**
 * @todo Generate API authentication keys
 * @todo Build modularity for pluggable extensions (like Redis or SQS)
 */

var assert = require('assert');
var fs = require('fs');
var http = require('http');
var url = require('url');

/**
 * application data storage object
 * debug (boolean) Toggle display of debug messsages.
 * cache (object) Settings related to client cache.
 *   cleanupInterval (integer) Interval in seconds between each cache cleanup.
 *   maxIdleTime (integer) Maximum session idle time to allow open connection.
 * listenPort (integer) Port for server to listen on.
 * mime (object) Common connection MIME types.
 * requestIDLength (integer) Length of Request ID.
 * timestamps (object) Relevant Unix timestamps.
 *   last (integer) Timestamp of last activity.
 *   up (integer) Timestamp of server startup.
 */
var __appData = {
	debug: true,
	cache: {
		cleanupInterval: 10,
		maxIdleTime: 600,
	},
	listenPort: 2000,
	mime: {
		'css': 'text/css',
		'gif': 'image/gif',
		'html': 'text/html',
		'ico': 'x-image/icon',
		'jpg': 'image/jpeg',
		'js': 'text/javascript',
		'png': 'image/png'
	},
	requestIDLength: 15,
	timestamps: {
		last: 0,
		up: 0
	}
};

/**
 * server data storage object
 * clients (object) Client connection cache.
 */
var __serverData = {
	clients: {}
};

/**
 * @function _base64
 * Encodes a string to base64, or decodes base64.to string.
 * @param (string) data The input string or base64.
 * @param (string) type The type of operation ('encode' or 'decode'). Default 'encode'.
 * @return (string) The en/decoded string.
 */
var _base64 = function( data, type ) {
	var type = (typeof(type) === 'string') ? type : 'encode';
	if (type === 'decode') {
		return new Buffer(data, 'base64').toString('ascii');
	} else {
		return new Buffer(data).toString('base64');
	}
};

/**
 * @function _cleanup
 * Cleans the client cache.
 */
var _cleanup = function() {
	var timestamp = Math.round(new Date().getTime()/1000.0);
	for (var client in __serverData.clients) {
		if (__serverData.clients.hasOwnProperty(client)) {
			if (client.timestamp < (timestamp-(__appData.cache.maxIdleTime*1000))) {
				delete __serverData.clients[client];
			}
		}
	}
};

/**
 * @function _getID
 * Generates an alphanumeric ID key of specified length.
 * @param (int) IDLength - Length of the ID to create.
 * @return (string) The generated ID.
 */
var _getID = function( IDLength ) {
	var IDLength = (typeof(IDLength) === 'number') ? IDLength : __serverData.requestIDLength;
	var charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	var id = '';
	for (var i=0; i<IDLength; i++) {
		id += charset.substr(Math.floor(Math.random()*charset.length), 1);
	}
	return id;
};

/**
 * @function _log
 * Exposes three logging functions.
 * @param (string) data - The data to log.
 * @method dbg
 * Log a debug message if debugging is on.
 * @method err
 * Log an error.
 * @method log
 * Log a message.
 */
var _log = (function( data ) {
	var _con = function( data, type ) {
		var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
		console.log(pre[type]+data);
	};
	var _dbg = function( data ) {
		if (__appData.debug === true) _con(data, 0);
	};
	var _err = function( data ) {
		_con(data, 1);
	};
	var _log = function( data ) {
		_con(data, 2);
	};
	return {
		dbg: _dbg,
		err: _err,
		log: _log
	};
})();

/**
 * @function _sendFile
 * Sends a file to the specified Request ID.
 * @param (string) requestID - The request ID to send file to..
 * @param (string) file - The file to send.
 * @param (object) headers - Additional headers for the request response.
 * @param (function) callback - Callback on completion.
 * @return (bool) True on success.
 */
var _sendFile = function( requestID, file, headers, callback ) {
	var headers = (typeof(headers) === 'object') ? headers : {};
	fs.stat(file, function(err, stats) {
		if (err) {
			_log.err('fs.stat(): '+err);
		} else {
			if (stats.isFile()) {
				fs.readFile(file, function(err, data) {
					if (err) {
						_log.err('fs.readFile(): '+err);
					} else {
						var client = __serverData.clients[requestID];
						var type = file.substr(file.lastIndexOf('.')+1);
						client.res.writeHead(200, {'Content-Type': __appData.mime[type]});
						client.res.write(data);
						client.res.end();
					}
				});
			}
		}
	});
	if (callback && typeof(callback) === 'function') {
		callback();
	}
};

/**
 * @function _sendStatus
 * Sends an HTTP status (and JSON object) to the specified Request ID.
 * @param (string) requestID - The request ID to send file to..
 * @param (string) status - The status to send.
 * @param (object) headers - Additional headers for the request response.
 * @param (function) callback - Callback on completion.
 * @return (bool) True on success.
 */
var _sendStatus = function( requestID, code, headers, callback ) {
	var headers = (typeof(headers) === 'object') ? headers : {};
	switch (code) {
		case 200:
			message = "Success";
			break;
		case 201:
			message = "Created";
			break;
		case 202:
			message = "Accepted";
			break;
		case 204:
			message = "No Content";
			break;
		case 205:
			message = "Continue";
			break;
		case 401:
			message = "Unauthorized";
			break;
		case 403:
			message = "Forbidden";
			break;
		case 404:
			message = "Resource Not Found";
			break;
		case 405:
			message = "Method Not Supported";
			break;
		case 413:
			message = "Request Entity Too Large";
			break;
		default:
			code = 500;
			message = "Internal Server Error";
			break;
	}
	var client = __serverData.clients[requestID];
	var result = {
		message: message,
		status: code
	};
	client.res.writeHead(code, message, {'Content-Type': 'application/json'});
	client.res.write(JSON.stringify(result));
	client.res.end();
	if (callback && typeof(callback) === 'function') {
		callback();
	}
};

/*\
|*| pub/sub/unsub pattern utility closure
\*/
var _pubsub = (function() {
	var cache = {};
	function _flush() {
		cache = {};
	};
	function _pub( topic, args, scope ) {
		if (cache[topic]) {
			var currentTopic = cache[topic],
				topicLength = currentTopic.length;
			for (var i=0; i<topicLength; i++) {
				currentTopic[i].apply(scope || this, args || []);
			}
		}
	};
	function _sub( topic, callback ) {
		if (!cache[topic]) {
			cache[topic] = [];
		}
		cache[topic].push(callback);
		return [topic, callback];
	};
	function _unsub( handle, total ) {
		var topic = handle[0],
			cacheLength = cache[topic].length;
		if (cache[topic]) {
			for (var i=0; i<cacheLength; i++) {
				if (cache[topic][i] === handle) {
					cache[topic].splice(cache[topic][i], 1);
					if (total) {
						delete cache[topic];
					}
				}
			}
		}
	};
	return {
		flush: _flush,
		pub: _pub,
		sub: _sub,
		unsub: _unsub
	};
})();

var init = (function() {
	var fileHandle = _pubsub.sub('/action/client/file', _sendFile);
	var statusHandle = _pubsub.sub('/action/client/status', _sendStatus);
	__appData.timestamps.up = Math.round(new Date().getTime()/1000.0);
	setInterval(function() {
		_cleanup();
	}, __appData.cache.cleanupInterval*1000);
})();

var api = (function() {
	var server = http.createServer(function(req, res) {
		var pathname = url.parse(req.url).pathname;
		var requestID = _getID(__appData.IDLength);
		var timestamp = Math.round(new Date().getTime()/1000.0);
		__appData.timestamps.last = timestamp
		var client = {};
		client['pathname'] = pathname;
		client['res'] = res;
		client['timestamp'] = timestamp;
		__serverData.clients[requestID] = client;
		if (req.method === 'GET') {
			// test harness site
			if (pathname === 'favicon.ico') {
				_pubsub.pub('/action/client/status', [requestID, 404]);
			} else if (pathname === 'test.html') {
				_pubsub.pub('/action/client/file', [requestID, 'lib/test.html']);
			} else if (pathname === 'test.js') {
				_pubsub.pub('/action/client/file', [requestID, 'lib/test.js']);
			} else if (pathname === 'test.css') {
				_pubsub.pub('/action/client/file', [requestID, 'lib/test.css']);
			} else {
				_pubsub.pub('/actoin/client/status', [requestID, 404]);
			}
		} else if (req.method === 'POST') {
			// POST
		} else if (req.method === 'DELETE') {
			// DELETE
		} else if (req.method === 'PUT') {
			// PUT
		} else {
			_pubsub.pub('/action/client/status', [requestID, 405]);
		}
	}).on('error', function(err) {
		_log.err(err);
	}).listen( __appData.listenPort );
	_log.log('listening on tcp/'+__appData.listenPort);
})();