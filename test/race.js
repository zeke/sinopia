var assert = require('assert')
  , readfile = require('fs').readFileSync
  , ex = module.exports
  , server = process.server
  , server2 = process.server2
  , async = require('async')
  , _oksum = 0

ex['creating new package'] = function(cb) {
	server.put_package('race', require('./lib/package')('race'), function(res, body) {
		assert.equal(res.statusCode, 201)
		assert(~body.ok.indexOf('created new package'))
		cb()
	})
}

ex['uploading 10 same versions'] = function(cb) {
	var fns = []
	for (var i=0; i<10; i++) {
		fns.push(function(cb_) {
			var data = require('./lib/package')('race')
			data.rand = Math.random()
			server.put_version('race', '0.0.1', data, function(res, body) {
				cb_(null, res, body)
			})
		})
	}

	async.parallel(fns, function(err, res) {
		var okcount = 0
		  , failcount = 0

		res.forEach(function(arr) {
			var resp = arr[0]
			  , body = arr[1]

			if (resp.statusCode === 201 && ~body.ok.indexOf('published')) okcount++
			if (resp.statusCode === 409 && ~body.error.indexOf('already present')) failcount++
			if (resp.statusCode === 503 && ~body.error.indexOf('unavailable')) failcount++
		})
		assert.equal(okcount + failcount, 10)
		assert.equal(okcount, 1)
		_oksum += okcount

		cb()
	})
}

ex['uploading 10 diff versions'] = function(cb) {
	var fns = []
	for (var i=0; i<10; i++) {
		;(function(i) {
			fns.push(function(cb_) {
				server.put_version('race', '0.1.'+String(i), require('./lib/package')('race'), function(res, body) {
					cb_(null, res, body)
				})
			})
		})(i)
	}

	async.parallel(fns, function(err, res) {
		var okcount = 0
		  , failcount = 0

		res.forEach(function(arr) {
			var resp = arr[0]
			  , body = arr[1]
			if (resp.statusCode === 201 && ~body.ok.indexOf('published')) okcount++
			if (resp.statusCode === 409 && ~body.error.indexOf('already present')) failcount++
			if (resp.statusCode === 503 && ~body.error.indexOf('unavailable')) failcount++
		})
		assert.equal(okcount + failcount, 10)
		_oksum += okcount

		cb()
	})
}

ex['downloading package'] = function(cb) {
	server.get_package('race', function(res, body) {
		assert.equal(res.statusCode, 200)
		assert.equal(Object.keys(body.versions).length, _oksum)
		cb()
	})
}

