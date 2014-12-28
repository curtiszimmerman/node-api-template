/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file web.js
 * primary application driver
 * @author curtis zimmerman
 * @contact curtis.zimmerman@gmail.com
 * @license GPLv2
 * @version 0.0.2
 */

/**
 * @todo Generate API authentication keys
 * @todo Build modularity for pluggable extensions (like Redis or SQS)
 */

/**
 * @cite http://http://stackoverflow.com/questions/7137397/module-exports-vs-exports-in-nodejs
 */
module.exports = exports = __api = (function() {
	/**
	 * @cite http://www.nczonline.net/blog/2012/03/13/its-time-to-start-using-javascript-strict-mode/
	 */
	"use strict";

	var fs = require('fs');
	var gigo = require('gigo');
	var http = require('http');
	var qs = require('querystring');
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
	var $data = {
		cache: {
			clients: {},
			settings: {
				cleanupInterval: 10,
				maxIdleTime: 600,
				requestIDLength: 15
			},
			stats: {
				cachedActual: 0,
				cachedPredicted: 0,
				error: 0,
				processed: 0
			}
		},
		content: {
			mime: {
				css: 'text/css',
				gif: 'image/gif',
				html: 'text/html',
				ico: 'image/x-icon',
				jpg: 'image/jpeg',
				js: 'text/javascript',
				png: 'image/png'
			},
			settings: {
				cors: true
			}
		},
		database: {
			id: 0
		},
		server: {
			listenPort: 4488,
			state: {
				debug: false,
				environment: null,
				environments: ['dev','prod']
			},
			stats: {
				timestamps: {
					last: 0,
					up: 0
				},
				version: '0.0.2'
			}
		}
	};

	var $func = {
		/**
		 * @function $func.cacheCleanup
		 * Cleans the client cache.
		 * @param {string} requestID (optional) The client to clean out of the cache.
		 * @return {boolean} True on success.
		 */
		cacheCleanup: function( requestIdD ) {
			if (requestID) return delete $data.cache.clients[requestID];
			var timestamp = Math.round(new Date().getTime()/1000.0);
			for (var client in $data.cache.clients) {
				if ($data.cache.clients.hasOwnProperty(client)) {
					if (client.timestamp < (timestamp-$data.cache.settings.maxIdleTime)) {
						return delete $data.cache.clients[client];
					}
				}
			}
			return false;
		},
		/**
		 * @function $func.key
		 * Exposes functions related to API key management.
		 * @method get
		 * Generates a new API key. 
		 * @return (string) The generated API key.
		 * @method verify
		 * Authenticates an API key.
		 * @param (string) API key to authenticate.
		 * @return (boolean) Authentication success.
		 */
		key: (function() {
			var _get = function( requestID ) {
				return null;
			};
			var _verify = function( requestID, key ) {
				// key is '1234' from '/api/key/verify/1234'
				return false;
			};
			return {
				get: _get,
				verify: _verify
			};
		})(),
		/**
		 * @function $func.send.file
		 * Sends a file to the specified Request ID.
		 * @param (string) requestID - The request ID to send file to..
		 * @param (string) file - The file to send.
		 * @param (object) headers - Additional headers for the request response.
		 * @param (function) callback - Callback on completion.
		 * @return (bool) True on success.
		 */
		send: {
			file: function( requestID, file, headers, callback ) {
				var headers = (typeof(headers) === 'object') ? headers : {};
				fs.stat(file, function(err, stats) {
					if (err) {
						_log.err('fs.stat(): '+err);
						_pubsub.pub('/action/client/status', [requestID, 500]);
					} else {
						if (stats.isFile()) {
							fs.readFile(file, function(err, data) {
								if (err) {
									_log.err('fs.readFile(): '+err);
									_pubsub.pub('/action/client/status', [requestID, 500]);
								} else {
									var client = $data.cache.clients[requestID];
									var type = file.substr(file.lastIndexOf('.')+1);
									headers['Content-Type'] = $data.content.mime[type];
									if ($data.content.settings.cors) headers['Access-Control-Allow-Origin'] = '*';
									client.res.writeHead(200, headers);
									client.res.write(data);
									client.res.end();
									$func.cacheCleanup(requestID);
								}
							});
						}
					}
				});
				return typeof(callback) === 'function' && callback();
			},
			/**
			 * @function $func.send.status
			 * Sends an HTTP status (and JSON object) to the specified Request ID.
			 * @param (string) requestID - The request ID to send file to..
			 * @param (string) status - The status to send.
			 * @param (object) headers - Additional headers for the request response.
			 * @param (function) callback - Callback on completion.
			 * @return (bool) True on success.
			 */
			status: function( requestID, code, headers, response, callback ) {
				var headers = (typeof(headers) === 'object') ? headers : {};
				var response = (typeof(response) === 'object') ? response : {};
				var message;
				var codes = {
					100:"Continue",101:"Switching Protocols",102:"Processing",
					200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",207:"Multi-Status",208:"Already Reported",226:"IM Used",
					300:"Multiple Choices",301:"Moved Permanently",302:"Found",303:"See Other",304:"Not Modified",305:"Use Proxy",307:"Temporary Redirect",308:"Permanent Redirect",
					400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Payload Too Large",414:"URI Too Long",415:"Unsupported Media Type",416:"Range Not Satisfiable",417:"Expectation Failed",422:"Unprocessable Entity",423:"Locked",424:"Failed Dependency",426:"Upgrade Required",428:"Precondition Required",429:"Too Many Requests",431:"Request Header Fields Too Large",
					500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported",506:"Variant Also Negotiates",507:"Insufficient Storage",508:"Loop Detected",510:"Not Extended",511:"Network Authentication Required"
				};
				if (typeof(codes[code]) !== 'undefined') {
					message = codes[code];
				} else {
					code = 500;
					message = codes[code];
				}
				try {
					response = JSON.stringify(response);
				} catch (e) {
					_log.err('$func.sendStatus(): cannot JSON.stringify response object: '+e.message);
					return _pubsub.pub('/action/client/status', [requestID, 500]);
				}
				var client = $data.cache.clients[requestID];
				response['message'] = message;
				response['status'] = code;
				headers['Content-Type'] = 'application/json';
				if ($data.content.settings.cors) headers['Access-Control-Allow-Origin'] = '*';
				client.res.writeHead(code, message, headers);
				client.res.write(JSON.stringify(response));
				client.res.end();
				$func.cacheCleanup(requestID);
				return typeof(callback) === 'function' && callback();
			}
		},
		util: {
			base64: {
				/**
				 * @function $func.util.base64.decode
				 * Decodes base64 to string.
				 * @param (string) data The input string to decode.
				 * @return (string) The decoded string.
				 */
				decode: function( data ) {
					if (typeof(data) !== 'string') return false;
					return new Buffer(data, 'base64').toString('ascii');
				},
				/**
				 * @function $func.util.base64.decode
				 * Encodes a string to base64.
				 * @param (string) data The base64-encoded input string.
				 * @return (string) The encoded string.
				 */
				encode: function( data ) {
					if (typeof(data) !== 'string') return false;
					return new Buffer(data).toString('base64');
				}
			},
			/**
			 * @function $func.getID
			 * Generates an alphanumeric ID key of specified length.
			 * @param (int) IDLength - Length of the ID to create.
			 * @return (string) The generated ID.
			 */
			getID: function( IDLength ) {
				for (
					var i = 0, id = '', charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
					i < (typeof(IDLength) === 'number' ? IDLength : $data.cache.settings.requestIDLength);
					i++
				) {	id += charset.substr(Math.floor(Math.random()*charset.length), 1); }
				return id;
			}
		}
	};

	/*\
	|*| done.abcde ("async pattern") utility closure
	\*/
	var _done = (function() {
		var cache = {};
		function _after( num, callback ) {
			for (var i=0,id='';i<10;i++,id+=Math.floor(Math.random()*10));
			return (!cache[id]) ? (cache[id] = {id:id,count:num,callback:callback}, id) : _after(num,callback);
		};
		function _bump( id ) {
			return (!cache[id]) ? false : (--cache[id].count == 0) ? cache[id].callback.apply() && _del(cache[id]) : true;
		};
		function _count( id ) {
			return (cache[id]) ? cache[id].count : -1;
		};
		function _dump( id ) {
			return (cache[id]) ? delete cache[id] : false;
		};
		function _empty() {
			cache = {};
		};
		return {
			after: _after,
			bump: _bump,
			count: _count,
			dump: _dump,
			empty: _empty
		};
	})();

	/**
	 * @function _log
	 * Exposes three logging functions.
	 * @method dbg
	 * Log a debug message if debugging is on.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method err
	 * Log an error.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method log
	 * Log a message.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 */
	var _log = (function() {
		var _con = function( data, type ) {
			var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
			return console.log(pre[type]+data);
		};
		var _dbg = function( data ) {
			if ($data.server.state.debug === true) return _con(data, 0);
		};
		var _err = function( data ) {
			return _con(data, 1);
		};
		var _log = function( data ) {
			return _con(data, 2);
		};
		return {
			dbg: _dbg,
			err: _err,
			log: _log
		};
	})();

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
			return true;
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
			return true;
		};
		return {
			flush: _flush,
			pub: _pub,
			sub: _sub,
			unsub: _unsub
		};
	})();

	function init() {
		var clientFileHandle = _pubsub.sub('/action/client/file', $func.send.file);
		var clientStatusHandle = _pubsub.sub('/action/client/status', $func.send.status);
		var dataGetHandle = _pubsub.sub('/action/database/get/client', gigo.get);
		var dataSetHandle = _pubsub.sub('/action/database/set/client', gigo.set);
		var APIKeyGetHandle = _pubsub.sub('/action/api/key/get', $func.key.get);
		var APIKeyVerifyHandle = _pubsub.sub('/action/api/key/verify', $func.key.verify);
		$data.server.stats.timestamps.up = Math.round(new Date().getTime()/1000.0);
		setInterval(function() {
			$func.cacheCleanup();
		}, $data.cache.settings.cleanupInterval*1000);
	};

	function api() {
		init();
		var server = http.createServer(function(req, res) {
			var inbound = url.parse(req.url);
			var pathname = inbound.pathname;
			var query = qs.parse(inbound.query);
			var requestID = $func.util.getID($data.cache.settings.requestIDLength);
			var timestamp = Math.round(new Date().getTime()/1000.0);
			_log.dbg('received request ('+requestID+') at '+timestamp+' for ['+pathname+']');
			$data.server.stats.timestamps.last = timestamp
			var client = {};
			client['pathname'] = pathname;
			client['res'] = res;
			client['timestamp'] = timestamp;
			$data.cache.clients[requestID] = client;
			_pubsub.pub('/action/database/set', [requestID, client]);
			if (req.method === 'GET') {
				// BEGIN API front-end
				if (pathname === '/favicon.ico') {
					return _pubsub.pub('/action/client/status', [requestID, 404]);
				} else if (pathname === '/index.html') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/index.html']);
				} else if (pathname === '/site.js') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/site.js']);
				} else if (pathname === '/default.css') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/default.css']);
				// END API front-end
				// BEGIN API functions
				} else if (pathname === '/show_clients') {
					return _pubsub.pub('/action/database/get/all', [requestID]);
				} else if (pathname === '/stats') {
					var statsResponse = {
						clients: {
							cachedActual: 0,
							cachedPredicted: 0,
							error: 0,
							processed: 0
						},
						timestamps: {
							last: 0,
							now: 0,
							uptime: (timestamp-$data.server.stats.timestamps.up)
						},
						version: $data.server.stats.version
					};
					return _pubsub.pub('/action/client/status', [requestID, 200, {}, statsResponse]);
				} else if (pathname === '/version') {
					var versionResponse = {
						version: $data.server.stats.version
					};
					return _pubsub.pub('/action/client/status', [requestID, 200, {}, versionResponse]);
				} else if (pathname === '/api/verify') {
					if (typeof(query.key) !== 'undefined') {
						return _pubsub.pub('/action/api/key/verify', [requestID, query.key]);	
					} else {
						return _pubsub.pub('/action/client/status', [requestID, 400]);
					}
				// END API functions
				// BEGIN test site
				} else if (pathname === '/test.html') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/test.html']);
				} else if (pathname === '/test.js') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/test.js']);
				} else if (pathname === '/test.css') {
					return _pubsub.pub('/action/client/file', [requestID, 'lib/test.css']);
				} else if (pathname === '/mocha.css') {
					return _pubsub.pub('/action/client/file', [requestID, 'node_modules/mocha/mocha.css']);
				} else if (pathname === '/mocha.js') {
					return _pubsub.pub('/action/client/file', [requestID, 'node_modules/mocha/mocha.js']);
				} else if (pathname === '/chai.js') {
					return _pubsub.pub('/action/client/file', [requestID, 'node_modules/chai/chai.js']);
				// END test site (put your own site/api-specific features here)
				} else if (pathname === '/die') {
					// throw unhandled exception
					throw new Error('unhandled exception! dying...');
				} else if (pathname === '/hang') {
					// just hang
				} else if (pathname === '/status') {
					if (typeof(query.code) !== 'undefined') {
						return _pubsub.pub('/action/client/status', [requestID, query.code]);
					} else {
						return _pubsub.pub('/action/client/status', [requestID, 400]);
					}
				} else {
					return _pubsub.pub('/action/client/status', [requestID, 404]);
				}
			} else if (req.method === 'POST') {
				// POST
				if (pathname === '/api/key/get') {
					return _pubsub.pub('/action/api/key/get', [requestID]);
				} else {
					return _pubsub.pub('/action/client/status', [requestID, 400]);
				}
			} else if (req.method === 'DELETE') {
				// DELETE
				return _pubsub.pub('/action/client/status', [requestID, 501]);
			} else if (req.method === 'PUT') {
				// PUT
				return _pubsub.pub('/action/client/status', [requestID, 501]);
			} else {
				return _pubsub.pub('/action/client/status', [requestID, 405]);
			}
		}).on('error', function(err) {
			_log.err(err);
		}).listen( $data.server.listenPort );
		_log.log('listening on tcp/'+$data.server.listenPort);
	}

	// if we're being require()ed, we're being tested, so we should expose our test infrastructure
	if (require.main === module) {
		return api();
	} else {
		return {
			__test: {
				func: $func
			}
		};
	}
})();
