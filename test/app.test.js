/**
 * @project node-api-template
 */

var __test = (function() {
	"use strict";

	var api = require(__dirname+'/../app.js');
	var func = api.__test.func;
	
	var expect = require('chai').expect;
	
	describe('node-api-template', function() {
		describe('# $func.util.base64.encode()', function() {
			it('should throw error if given incorrect parameters', function() {
				expect(func.util.base64.encode).to.throw(Error);
			});
			it('should return a string if given a string', function() {
				expect(func.util.base64.encode('foo')).to.be.a('string');
			});
		});
		describe('# $func.util.base64.decode()', function() {
			it('should be grand', function() {
				expect(true).to.equal(true);
			});
		});
		describe('# $func.util.getID()', function() {
			it('should be grand', function() {
				expect(true).to.equal(true);
			});
		});
		describe('# $func.util.isEmpty()', function() {
			it('should be grand', function() {
				expect(true).to.equal(true);
			});
		});
	});
})();
