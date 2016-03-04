/* site.js */

window.__api = window.__api || (function() {
	var $data = {
		call: {
			failure: [400, 401, 403, 404, 405, 413, 500],
			success: [200, 201, 202, 203]
		},
		state: {
			debug: false,
			nocall: false
		}
	};

	var $func = {
		addEvent: function( element, event, func ) {
			if (element.addEventListener) {
				element.addEventListener(event, func, false);
			} else if (element.attachEvent) {
				element.attachEvent('on'+event, func);
			} else {
				$log.err('this client does not have a common event handler!');
			}
		},
		ajax: function( meth, res, req, callback, header ) {
			var parseHeaders = function(rawHeaders) {
				var headers = {};
				var hdrs = rawHeaders.split(/\r?\n/);
				for (var i=0,len=hdrs.length; i<len; i++) {
					var line = hdrs[i];
					var key = line.split(':', 1)[0];
					var value = line.substring(key.length + 2);
					if (key.length > 0) headers[key.toLowerCase()] = value;
				};
				return headers;
			}
			if (!$data.settings.nocall) {
				$log.debug('AJAX ['+method+'] request initiated for resource ['+resource+']');
				var req = (typeof(req) === 'object') ? JSON.stringify(req) : null;
				var header = typeof(header) !== 'undefined' ? header : null;
				var xhr = new XMLHttpRequest();
				xhr.addEventListener('readystatechange', function() {
					if (xhr.readyState === this.DONE) return typeof(callback) === 'function' && callback(null, xhr.status, xhr.responseText);
				}, false);
				xhr.addEventListener('timeout', function(e) {
					$log.error('Request timed out! Dying...');
					return typeof(callback) === 'function' && callback('timeout');
				});
				xhr.addEventListener('error', function(e) {
					$log.warn('AJAX Error! Status ['+xhr.status+']: ['+JSON.stringify(e)+']');
					return typeof(callback) === 'function' && callback(e);
				}, false);
				xhr.open(meth, res, true);
				xhr.timeout = 10000;
				if (header) for (var hdr in header) {
					if (header.hasOwnProperty(hdr) && hdr !== 'Content-Length' && hdr !== 'User-Agent' && hdr !== 'Host') {
						xhr.setRequestHeader(hdr, header[hdr]);
					}
				}
				xhr.send(req);
			} else {
				$log.debug('Setting "nocall" preventing AJAX calls!');
				return typeof(callback) === 'function' && callback();
			}
		},
		base64: {
			decode: function( data ) {
				return window.atob(data);
			},
			encode: function( data ) {
				return window.btoa(data);
			}
		},
		getID: function( length ) {
			var length = typeof(length) !== 'undefined' ? length : 8;
			for (var i=0,id='',chr='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; i<length; i++) {
				id += chr.substr(Math.floor(Math.random()*chr.length),1);
			}
			return id;
		},
		parseOpts: function( opts ) {
			var opts = (typeof(opts) === 'object') ? opts : location.search;
			var query = {};
			opts.substr(1).split('&').forEach(function(item) { query[item.split('=')[0]] = item.split('=')[1]});
			return query;
		}
	};

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
			return $data.settings.log.quiet ? false : loglevel <= $data.settings.log.level && _con(data, loglevel);
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

	var $pubsub = (function() {
		var cache = {};
		var _flush = function() {
			cache = {};
		};
		var _pub = function( topic, args, scope ) {
			if (cache[topic]) {
				var currentTopic = cache[topic],
					topicLength = currentTopic.length;
				for (var i=0; i<topicLength; i++) {
					currentTopic[i].apply(scope || this, args || []);
				}
			}
		};
		var _sub = function( topic, callback ) {
			if (!cache[topic]) cache[topic] = [];
			cache[topic].push(callback);
			return [topic, callback];
		};
		var _unsub = function( handle, total ) {
			var topic = handle[0],
				cacheLength = cache[topic].length;
			if (cache[topic]) {
				for (var i=0; i<cacheLength; i++) {
					if (cache[topic][i] === handle) {
						cache[topic].splice(cache[topic][i], 1);
						if (total) delete cache[topic];
					}
				}
			}
		};
		var 
		return {
			flush: _flush,
			pub: _pub,
			sub: _sub,
			unsub: _unsub
		};
	})();

	(function init() {
		// initialize our object
		var opts = $func.parseOpts();
		if (opts.debug === true) $data.state.debug = true;
		if (opts.nocall === true) $data.state.nocall = true;
		$log.dbg('site object initialized!');
	})();

	return {
		addEvent: $func.addEvent,
		log: $log,
		pubsub: $pubsub
	};
})();
