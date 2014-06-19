/**
 * @project node-api-template
 * Node.js HTTP-based RESTful JSON API template
 * @file test.js
 * test harness website
 * @author curtis zimmerman
 * @contact software@curtisz.com
 * @license GPLv3
 * @version 0.0.1a
 */

var __test = (function() {
	var __appData = {
		state: {
			debug: true
		}
	};

	var _addEvent = function( element, event, handler ) {
		if (element.addEventListener) {
			element.addEventListener(event, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent('on'+event, handler);
		} else {
			// client cannot handle events
		}
	};

	var _log = (function() {
		var _console = function( data, type ) {
			var pre = ['[i] DEBUG: ', '[!] ERROR: ', '[+] '];
			console.log(pre[type]+data);
		};
		var _debug = function( data ) {
			if (__appData.state.debug === true) _console(data, 0);
		};
		var _error = function( data ) {
			_console(data, 1);
		};
		var _log = function( data ) {
			_console(data, 2);
		};
		return {
			debug: _debug,
			error: _error,
			log: _log
		};
	})();

	var init = function() {
		_log.debug('initialized test harness')
	};

	var IPL = (function() {
		_addEvent(window, 'load', init);
	})();
})();