/* site.js */

var __api = (function() {
	var __data = {
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
		if (!__data.state.nocall) {
			var async = (typeof(async) === 'object') ? async : {};
			var request = (typeof(request) === 'object') ? JSON.stringify(request) : null;
			var xhr = new XMLHttpRequest();
			_log.dbg(method+'ing to [:'+resource+']');
			xhr.open(method, resource, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && __data.call.success.indexOf(xhr.status) > -1) {
					return async.success && typeof(async.success) === 'function' && async.success();
				} else if (xhr.readyState == 4 && __data.call.failure.indexOf(xhr.status) > -1) {
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
			(__data.state.debug) ? return _con(data, 0) : return false;
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
	var init = function() {
		// initialize our object
		var opts = _parseOpts();
		if (opts.debug === true) __data.state.debug = true;
		if (opts.nocall === true) __data.state.nocall = true;
		_log.dbg('site object initialized!');
	};
	return {
		addEvent: _addEvent,
		init: init
	};
})();

// IPL the front-end object
__api.addEvent(window, 'load', __api.init);