/* eslint-env mocha */
'use strict';

var rewire = require('rewire');
var sinon = require('sinon');
var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');

var delMock;
var cleanDest = rewire('./index');


function createFile(filePath, base, contents = 'foo', isDirectory = false) {
  return new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, base),
		path: path.join(__dirname, filePath),
		contents: new Buffer(contents),
    stat: { isDirectory: () => isDirectory },
	});
}

describe('gulp-dest-clean', function() {
  beforeEach(function() {
    delMock = sinon.stub().returns(Promise.resolve([]));
    cleanDest.__set__('del', delMock);
    cleanDest.__set__('gutil.log', () => {});
  });

  it('should not modify input files', function (done) {
  	var stream = cleanDest('lib');
    var fileCount = 0;
    var fileNames = [];

  	stream.on('data', function (file) {
      assert.equal(file.contents.toString(), 'foo');
  		fileNames.push(file.relative);
      fileCount++;
  	});
  	stream.on('end', function() {
      assert.deepEqual(fileNames, [
        'foo-bar.xxx.js', 'foo-bar2.xxx.js', 'extra/foo-bar.xxx.js',
      ]);
      assert(fileCount, 3);
      done();
    });

    [
      createFile('src/foo-bar.xxx.js', 'src'),
      createFile('src/foo-bar2.xxx.js', 'src'),
      createFile('src/extra/foo-bar.xxx.js', 'src'),
    ].forEach(file => stream.write(file));
  	stream.end();
  });

  it('should pass options.dryRun to del', function (done) {
    var stream = cleanDest('lib', {dryRun: true});
    stream.on('data', () => {});
    stream.on('end', function() {
      sinon.assert.calledOnce(delMock);
      assert.deepEqual(delMock.firstCall.args[1], {dryRun: true});
      done();
    });
    stream.end();
  });

  describe('should call del with the expected patterns', function() {
    it('when no options are provided', function (done) {
      var stream = cleanDest('lib');
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar2.xxx.js',
          '!lib/extra',
          '!lib/extra/foo-bar.xxx.js',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.js', 'src'),
        createFile('src/foo-bar2.xxx.js', 'src'),
        createFile('src/extra/foo-bar.xxx.js', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when using options.exclude with a directory path', function (done) {
      var stream = cleanDest('lib', {exclude: 'extra'});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar2.xxx.js',
          '!lib/extra',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.js', 'src'),
        createFile('src/foo-bar2.xxx.js', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when using exclude options.exclude with a glob', function (done) {
      var stream = cleanDest('lib', {exclude: 'extra/**'});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar2.xxx.js',
          '!lib/extra',
          '!lib/extra/**',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.js', 'src'),
        createFile('src/foo-bar2.xxx.js', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when options.extension is a string', function (done) {
      var stream = cleanDest('lib', {extension: '.js'});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar2.xxx.js',
          '!lib/extra',
          '!lib/extra/foo-bar.xxx.js',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.coffee', 'src'),
        createFile('src/foo-bar2.xxx.coffee', 'src'),
        createFile('src/extra/foo-bar.xxx.jsx', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when options.extension is an array of strings', function (done) {
      var stream = cleanDest('lib', {extension: ['.js', '.js.map']});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar.xxx.js.map',
          '!lib/foo-bar2.xxx.js',
          '!lib/foo-bar2.xxx.js.map',
          '!lib/extra',
          '!lib/extra/foo-bar.xxx.js',
          '!lib/extra/foo-bar.xxx.js.map',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.coffee', 'src'),
        createFile('src/foo-bar2.xxx.coffee', 'src'),
        createFile('src/extra/foo-bar.xxx.jsx', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when options.extension is an object with strings', function (done) {
      var stream = cleanDest('lib', {extension: {
        '.coffee': '.js',
        '.jade': '.html',
      }});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar2.xxx.js',
          '!lib/extra',
          '!lib/extra/foo-bar.xxx.html',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.coffee', 'src'),
        createFile('src/foo-bar2.xxx.coffee', 'src'),
        createFile('src/extra/foo-bar.xxx.jade', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('when options.extension is an object with arrays of strings', function (done) {
      var stream = cleanDest('lib', {extension: {
        '.coffee': ['.js', '.js.map'],
        '.jade': '.html',
      }});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib',
          '!lib/foo-bar.xxx.js',
          '!lib/foo-bar.xxx.js.map',
          '!lib/foo-bar2.xxx.js',
          '!lib/foo-bar2.xxx.js.map',
          '!lib/extra',
          '!lib/extra/foo-bar.xxx.html',
        ].sort());
        done();
      });

      [
        createFile('src/foo-bar.xxx.coffee', 'src'),
        createFile('src/foo-bar2.xxx.coffee', 'src'),
        createFile('src/extra/foo-bar.xxx.jade', 'src'),
      ].forEach(file => stream.write(file));
      stream.end();
    });

    it('directories should be included but without applying extension transforms', function (done) {
      var stream = cleanDest('lib', {extension: '.js'});
      stream.on('data', () => {});
      stream.on('end', function() {
        sinon.assert.calledOnce(delMock);
        assert.deepEqual(delMock.firstCall.args[0].sort(), [
          'lib/**', '!lib', '!lib/foo-bar',
        ].sort());
        done();
      });

      stream.write(createFile('src/foo-bar', 'src', '', true));
      stream.end();
    });
  });
});
