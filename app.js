/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file app.js
 * primary application driver
 * @author curtis zimmerman
 * @contact curtis.zimmerman@gmail.com
 * @license GPLv3
 * @version 0.0.4
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

	/* core */
	var fs = require('fs');
	var http = require('http');
	var https = require('https');
	var qs = require('querystring');
	var url = require('url');
	/* third-party */
	var $redis = require('ioredis');
	var $yaml = null;
	var $yargs = require('yargs');

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
			binary: ['gif','ico','jpg','jpeg','png'],
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
			active: false,
			id: 0
		},
		server: {
			argv: {},
			settings: {
				directory: '/pub',
				listen: {
					address: '0.0.0.0',
					port: 4488
				},
				logs: {
					quiet: false,
					level: 2
				},
				ssl: {
					certificate: null,
					enabled: false,
					key: null,
					options: {
						cert: null,
						key: null
					},
					port: 443
				},
				static: false
			},
			state: {
				development: false,
				environment: null,
				environments: ['dev','prod'],
				logs: {
					level: 1,
					quiet: false
				}
			},
			stats: {
				timestamps: {
					last: 0,
					up: 0
				},
				version: '0.0.4'
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
		cacheCleanup: function( requestID ) {
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
		 * @function $func.processCreateRequest
		 * Process an inbound "create" request.
		 * @param (object) request - The parsed, inbound request data object.
		 * @param (function) callback - Callback on completion.
		 * @returns (bool) True on success.
		 */
		processCreateRequest: function( request, callback ) {
			// do some processing
			var data = request.data;
			if (data === 'foo') {
				// things look good
				return typeof(callback) === 'function' && callback(null, data);
			} else {
				// something went wrong
				var err = 'there was an error processing the request';
				return typeof(callback) === 'function' && callback(err);
			}
		},
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
						$log.error('fs.stat(): '+err);
						$pubsub.pub('/action/client/status', [requestID, 500]);
					} else {
						if (stats.isFile()) {
							fs.readFile(file, function(err, data) {
								if (err) {
									$log.error('fs.readFile(): '+err);
									$pubsub.pub('/action/client/status', [requestID, 500]);
								} else {
									var client = $data.cache.clients[requestID];
									var type = file.substr(file.lastIndexOf('.')+1);
									var encoding = $data.content.binary.indexOf(type) > -1 ? 'binary' : 'utf8';
									headers['Content-Type'] = $data.content.mime[type];
									if ($data.content.settings.cors) headers['Access-Control-Allow-Origin'] = '*';
									$log.info('  (request '+requestID+'): [200 OK]');
									client.res.writeHead(200, headers);
									client.res.write(data, encoding);
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
				var message = {};
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
				var client = $data.cache.clients[requestID];
				response['message'] = message;
				response['status'] = code;
				headers['Content-Type'] = 'application/json';
				if ($data.content.settings.cors) headers['Access-Control-Allow-Origin'] = '*';
				$log.info('  (request '+requestID+'): ['+code+' '+message+']');
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
					if (typeof(data) !== 'string') throw new Error('func.util.base64.decode(): incorrect parameters!');
					return new Buffer(data, 'base64').toString('ascii');
				},
				/**
				 * @function $func.util.base64.decode
				 * Encodes a string to base64.
				 * @param (string) data The base64-encoded input string.
				 * @return (string) The encoded string.
				 */
				encode: function( data ) {
					if (typeof(data) !== 'string') throw new Error('func.util.base64.decode(): incorrect parameters!');
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
			},
			/**
			 * @function $func.isEmpty
			 * Test a
			 */
			isEmpty: function( thing ) {
				if (thing === null) return true;
				if (typeof(thing) === 'undefined') return true;
				if (typeof(thing) === 'string') return thing === '' ? true : false;
				if (Array.isArray(thing)) return thing.length === 0 ? true : false;
				for (var prop in thing) {
					if (thing.hasOwnProperty(prop)) return false;
				}
				return true;
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
	 * @function $log
	 * Exposes logging functions.
	 * @method debug
	 * Log a debug message if debugging is on.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method error
	 * Log an error.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method info
	 * Log an informational message.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method log
	 * Log a message.
	 * @param (string) data - The data to log.
	 * @param (integer) [loglevel] - Loglevel of data. Default 1.
	 * @return (boolean) Success indicator.
	 * @method warn
	 * Log a warning.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 */
	var $log = (function() {
		var _con = function( data, loglevel ) {
			var pre = [' [EROR] ', ' [WARN] ', ' [LOG ] ', ' [INFO] ', ' [DBUG] '];
			return console.log(_time()+pre[loglevel]+data);
		};
		var _debug = function( data ) { return _log(data, 4);};
		var _error = function( data ) { return _log(data, 0);};
		var _info = function( data ) { return _log(data, 3);};
		var _log = function( data, loglevel ) {
			var loglevel = typeof(loglevel) === 'undefined' ? 2 : loglevel > 4 ? 4 : loglevel;
			return $data.server.settings.logs.quiet ? false : loglevel <= $data.server.settings.logs.level && _con(data, loglevel);
		};
		var _time = function() { return new Date().toJSON();}
		var _warn = function( data ) { return _log(data, 1);};
		return {
			debug: _debug,
			error: _error,
			info: _info,
			log: _log,
			warn: _warn
		};
	})();

	/**
	 * @function $pubsub
	 * Exposes pub/sub/unsub pattern utility functions.
	 * @method flush
	 * Flush the pubsub cache of all subscriptions.
	 * @method pub
	 * Publish an event with arguments.
	 * @param {string} The event to publish.
	 * @param {array} Array of arguments to pass to callback.
	 * @method sub
	 * Subscribe a callback to an event.
	 * @param {string} The event topic to subscribe to.
	 * @param {function} The callback function to fire.
	 * @method unsub
	 * Unsubscribe an event handler.
	 * @param {array} Handler to unsubscribe.
	 * @param {boolean} Unsubscribe all subscriptions?
	 */
	var $pubsub = (function() {
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

	var $core = {
		init: function() {
			$data.server.argv = $yargs
				.usage('Usage: $0 [OPTIONS]')
				.alias('a', 'address')
				.describe('a', 'address to listen on. default "0.0.0.0" to appease docker.')
				.alias('c', 'certificate')
				.describe('c', 'path to SSL certificate. requires key.')
				.alias('d', 'database')
				.describe('d', 'use a database (not yet implemented).')
				.alias('f', 'files')
				.describe('f', 'specify directory containing files to serve. relative to server root. default "pub".')
				.alias('k', 'key')
				.describe('k', 'path to host key for SSL. requires certificate.')
				.alias('p', 'port')
				.describe('p', 'port to listen on. default 80 for HTTP, 443 for HTTPS.')
				.alias('q', 'quiet')
				.describe('q', 'quiet operation (no console output).')
				.alias('s', 'static')
				.describe('s', 'static file server (serve any existing file in files directory). default false.')
				.alias('v', 'verbosity')
				.describe('v', 'loglevel verbosity (0-5). default 2.')
				.count('verbosity')
				.help('h')
				.alias('h', 'help')
				.describe('h', 'this help information.')
				.argv;
			if (typeof($data.server.argv.version) !== 'undefined') {
				console.log($data.server.stats.version);
				process.exit(0);
			}
			if ((typeof($data.server.argv.certificate) !== 'undefined' && typeof($data.server.argv.key) !== 'undefined') || (typeof(process.env.NODE_CERTIFICATE) !== 'undefined' && typeof(process.env.NODE_KEY) !== 'undefined')) {
				$data.server.settings.ssl.enabled = true;
				$data.server.settings.ssl.options.cert = fs.readFileSync($data.server.settings.ssl.cert = (typeof($data.server.argv.certificate) !== 'undefined' ? $data.server.argv.certificate : process.env.NODE_CERTIFICATE));
				$data.server.settings.ssl.options.key = fs.readFileSync($data.server.settings.ssl.key = (typeof($data.server.argv.key) !== 'undefined' ? $data.server.argv.key : process.env.NODE_KEY));
			}
			if (typeof($data.server.argv.address) !== 'undefined' || typeof(process.env.NODE_ADDRESS) !== 'undefined') $data.server.settings.listen.address = typeof($data.server.argv.address) !== 'undefined' ? $data.server.argv.address : process.env.NODE_ADDRESS;
			if (typeof($data.server.argv.database) !== 'undefined' || typeof(process.env.NODE_DATABASE) !== 'undefined') $data.database.active = true;
			$data.server.settings.listen.port = typeof($data.server.argv.port) !== 'undefined' ? $data.server.argv.port : $data.server.settings.ssl.enabled ? 443 : 80;
			if (typeof($data.server.argv.quiet) !== 'undefined' || typeof(process.env.NODE_QUIET) !== 'undefined') $data.server.settings.logs.quiet = true;
			if (typeof($data.server.argv.verbosity) !== 'undefined' || typeof(process.env.NODE_DEBUG) !== 'undefined') {
				var loglevel = typeof($data.server.argv.verbosity) !== 'undefined' ? $data.server.argv.verbosity : process.env.NODE_DEBUG;
				$data.server.settings.logs.level = (loglevel > 4 ? 4 : loglevel < 0 ? 0 : loglevel);
			}
			if (typeof($data.server.argv.files) !== 'undefined' || typeof(process.env.NODE_FILES) !== 'undefined') {
				var filesLocation = typeof($data.server.argv.files) !== 'undefined' ? $data.server.argv.files : process.env.NODE_FILES;
				try {
					var stats = fs.statSync(__dirname+'/'+filesLocation);
					if (stats.isDirectory()) {
						$data.server.settings.directory = '/'+fileslocation;
					} else {
						$log.warn('provided files directory does not exist! defaulting to "/pub"');
					}
				} catch(e) {
					$log.warn('provided files directory does not exist! defaulting to "/pub"!');
				}
			}
			if (typeof($data.server.argv.static) !== 'undefined' || typeof(process.env.NODE_STATIC) !== 'undefined') $data.server.settings.static = true;
			/* we can override settings via env vars */
			if (typeof(process.env.NODE_PORT) === 'string') $data.server.settings.listen.port = process.env.NODE_PORT*1;

			$log.log('initiating server...');

			$pubsub.sub('/core/component/api/init', $core.api);
			$pubsub.sub('/core/component/init/done', function() {
				$pubsub.pub('/core/component/api/init');
			});
			$pubsub.sub('/action/client/file', $func.send.file);
			$pubsub.sub('/action/client/status', $func.send.status);
			if ($data.database.active === true) {
				$gigo = require('gigo');
				$pubsub.sub('/action/database/get/client', $gigo.get);
				$pubsub.sub('/action/database/set/client', $gigo.set);
			}
			$pubsub.sub('/action/api/key/get', $func.key.get);
			$pubsub.sub('/action/api/key/verify', $func.key.verify);
			$data.server.stats.timestamps.up = Math.round(new Date().getTime()/1000.0);
			setInterval(function() {
				$func.cacheCleanup();
			}, $data.cache.settings.cleanupInterval*1000);
			$pubsub.pub('/core/component/init/done');
		},
		api: function() {
			var listener = function(req, res) {
				var inbound = url.parse(req.url);
				var pathname = inbound.pathname;
				var query = qs.parse(inbound.query);
				var addr = req.connection.remoteAddress;
				var requestID = $func.util.getID($data.cache.settings.requestIDLength);
				var timestamp = Math.round(new Date().getTime()/1000.0);
				$log.log('['+addr+'] <'+req.method+'> ['+pathname+']: request ('+requestID+')');
				$data.server.stats.timestamps.last = timestamp
				var client = {};
				client['pathname'] = pathname;
				client['res'] = res;
				client['timestamp'] = timestamp;
				$data.cache.clients[requestID] = client;
				$pubsub.pub('/action/database/set', [requestID, client]);
				if (req.method === 'GET') {
					// BEGIN API front-end
					if (pathname === '/favicon.ico') {
						return $pubsub.pub('/action/client/status', [requestID, 404]);
					} else if (pathname === '/index.html') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/index.html']);
					} else if (pathname === '/site.js') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/site.js']);
					} else if (pathname === '/default.css') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/default.css']);
					// END API front-end
					// BEGIN API functions
					} else if (pathname === '/show_clients') {
						return $pubsub.pub('/action/database/get/all', [requestID]);
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
						return $pubsub.pub('/action/client/status', [requestID, 200, {}, statsResponse]);
					} else if (pathname === '/version') {
						var versionResponse = {
							version: $data.server.stats.version
						};
						return $pubsub.pub('/action/client/status', [requestID, 200, {}, versionResponse]);
					} else if (pathname === '/api/verify') {
						if (typeof(query.key) !== 'undefined') {
							return $pubsub.pub('/action/api/key/verify', [requestID, query.key]);
						} else {
							return $pubsub.pub('/action/client/status', [requestID, 400]);
						}
					// END API functions
					// BEGIN test site
					} else if (pathname === '/test.html') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/test.html']);
					} else if (pathname === '/test.js') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/test.js']);
					} else if (pathname === '/test.css') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+'/test.css']);
					} else if (pathname === '/mocha.css') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+'/node_modules/mocha/mocha.css']);
					} else if (pathname === '/mocha.js') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+'/node_modules/mocha/mocha.js']);
					} else if (pathname === '/chai.js') {
						return $pubsub.pub('/action/client/file', [requestID, __dirname+'/node_modules/chai/chai.js']);
					// END test site (put your own site/api-specific features here)
					} else if (pathname === '/status') {
						if (typeof(query.code) !== 'undefined') {
							return $pubsub.pub('/action/client/status', [requestID, query.code]);
						} else {
							return $pubsub.pub('/action/client/status', [requestID, 400]);
						}
					} else {
						if ($data.server.settings.static) {
							if (pathname === '/') pathname = '/index.html';
							fs.stat(__dirname+$data.server.settings.directory+pathname, function(err, stats) {
								if (err) {
									$pubsub.pub('/action/client/status', [requestID, (err.code === 'ENOENT' ? 404 : 500)]);
								} else {
									if (!stats.isFile()) {
										$pubsub.pub('/action/client/status', [requestID, 500]);
									} else {
										$pubsub.pub('/action/client/file', [requestID, __dirname+$data.server.settings.directory+pathname]);
									}
								}
							});
						} else {
							return $pubsub.pub('/action/client/status', [requestID, 404]);
						}
					}
				} else if (req.method === 'POST') {
					// example POST request
					if (pathname === '/api/create') {
						var requestBody = '';
						req.on('data', function(data) {
							requestBody += data;
							// if requestBody is too big, return "413: request payload too large"
							if (requestBody.length > 1e6) return $pubsub.pub('/action/client/status', [requestID, 413]);
						});
						req.on('end', function() {
							try {
								var requestData = qs.parse(requestBody);
							} catch(e) {
								$log.warn('received malformed request body: ['+e.message+']');
								$log.debug('contents of malformed request body: ['+requestBody+']');
								return $pubsub.pub('/action/client/status', [requestID, 400]);
							}
							$func.processCreateRequest(requestData, function(err, processedData) {
								if (err) {
									return $pubsub.pub('/action/client/status', [requestID, 500]);
								} else {
									// return the processed data to the client along with a 200 status
									return $pubsub.pub('/action/client/status', [requestID, 200, null, processedData]);
								}
							});
						});
						return $pubsub.pub('/action/api/key/get', [requestID]);
					} else {
						return $pubsub.pub('/action/client/status', [requestID, 400]);
					}
				} else if (req.method === 'DELETE') {
					// DELETE
					return $pubsub.pub('/action/client/status', [requestID, 501]);
				} else if (req.method === 'PUT') {
					// PUT
					return $pubsub.pub('/action/client/status', [requestID, 501]);
				} else {
					return $pubsub.pub('/action/client/status', [requestID, 405]);
				}
			};
			var server = ($data.server.settings.ssl.enabled) ? https.createServer($data.server.settings.ssl.options, listener) : http.createServer(listener);
			server.on('error', function(err) {
				$log.error(err);
			}).listen( $data.server.settings.listen.port, $data.server.settings.listen.address );
			$log.log('----------------------------------------');
			$log.log('listening for '+($data.server.settings.ssl.enabled ? 'HTTPS' : 'HTTP')+' on '+$data.server.settings.listen.address+':'+$data.server.settings.listen.port);
			$log.log('----------------------------------------');
		}
	}

	// if we're being require()ed, we're being tested, so we should expose our test infrastructure
	if (require.main === module) {
		return $core.init();
	} else {
		return {
			__test: {
				func: $func
			}
		};
	}
})();
