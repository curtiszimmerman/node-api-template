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

	var _addEvent = function( element, event, func ) {
		if (element.addEventListener) {
			element.addEventListener(event, func, false);
		} else if (element.attachEvent) {
			element.attachEvent('on'+event, func);
		} else {
			_log.err('this client does not have a common event handler!');
		}
	};

	var _call = function( method, resource, request, async ) {
		if (!$data.state.nocall) {
			var async = (typeof(async) === 'object') ? async : {};
			var request = (typeof(request) === 'object') ? JSON.stringify(request) : null;
			var xhr = new XMLHttpRequest();
			_log.dbg(method+'ing to [:'+resource+']');
			xhr.open(method, resource, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && $data.call.success.indexOf(xhr.status) > -1) {
					return async.success && typeof(async.success) === 'function' && async.success();
				} else if (xhr.readyState == 4 && $data.call.failure.indexOf(xhr.status) > -1) {
					return async.failure && typeof(async.failure) === 'function' && async.failure();
				} else {
					// unknown status code
					_log.dbg('unknown error code returned from server ('+xhr.status+')');
				}
			};
			xhr.send(request);
		}
		return async.callback && typeof(async.callback) === 'function' && async.callback();
	};

	var _log = (function() {
		var _con = function( data, type ) {
			var pre = ['[i] DEBUG: ','[!] ERROR: ','[+] '];
			return console.log(pre[type]+data);
		}
		var _dbg = function( data ) {
			return $data.state.debug ? _con(data, 0) : false;
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

	var _parseOpts = function( opts ) {
		var opts = (typeof(opts) === 'object') ? opts : location.search;
		var query = {};
		opts.substr(1).split('&').forEach(function(item) { query[item.split('=')[0]] = item.split('=')[1]});
		return query;
	};

	var _pubsub = (function() {
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
		var opts = _parseOpts();
		if (opts.debug === true) $data.state.debug = true;
		if (opts.nocall === true) $data.state.nocall = true;
		_log.dbg('site object initialized!');
	})();

	return {
		addEvent: _addEvent,
		log: _log,
		pubsub: _pubsub
	};
})();
