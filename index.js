'use strict';

var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');

const PLUGIN_NAME = 'gulp-dest-clean';

function destClean(destPath, options = {}) {
  var delPatterns = new Set();

  var extensions = options.extension;
  var exclude = options.exclude;
  var dryRun = options.dryRun || false;

  // Process destPath
  if (typeof destPath !== 'string') {
    throw new gutil.PluginError(PLUGIN_NAME, '"destPath" parameter required');
  }
  if (destPath.includes('*')) {
    throw new gutil.PluginError(PLUGIN_NAME, '"destPath" parameter must not contain "*"');
  }
  delPatterns.add(path.join(destPath, '/**'));
  delPatterns.add('!' + destPath);

  // Generalize options.extension
  if (typeof extensions === 'string') {
    extensions = [extensions];
  }
  if (Array.isArray(extensions)) {
    extensions = {'': extensions};
  }
  if (extensions) {
    for (let key in extensions) {
      if (!Array.isArray(extensions[key])) {
        extensions[key] = [extensions[key]];
      }
    }
  }

  /**
   * Helper to add as exclussion to the delPatterns the passed path and every
   * parent directory
   */
  function excludePathAndParents(parent) {
    while (!delPatterns.has('!' + parent)) {
      delPatterns.add('!' + parent);
      parent = path.dirname(parent);
    }
  }

  // Add explicitely excluded paths
  if (typeof exclude === 'string') {
    exclude = [exclude];
  }
  if (!Array.isArray(exclude)) {
    exclude = [];
  }
  exclude.map(pattern => {
    if (pattern.startsWith('!')) {
      return path.join(destPath, pattern.slice(1));
    }
    return path.join(destPath, pattern);
  }).forEach(pattern => {
    excludePathAndParents(pattern);
  });

  function replaceExtension(file) {
    if (file.stat.isDirectory() || !extensions) {
      return [file.relative];
    }
    for (let oldExtension in extensions) {
      if (file.relative.includes(oldExtension)) {
        return extensions[oldExtension].map(newExtension => {
          return gutil.replaceExtension(file.relative, newExtension);
        });
      }
    }
  }

  function excludeFile(file) {
    replaceExtension(file).forEach(fileName => {
      delPatterns.add('!' + path.join(destPath, fileName));
    });
  }

  return through.obj(function (file, enc, cb) {
    excludePathAndParents(path.join(destPath, path.dirname(file.relative)));
    excludeFile(file);
    cb(null, file);
  }, function (cb){
    var stream = this;
    if (dryRun) {
      gutil.log('Patterns for `del`:');
      gutil.log('\n', Array.from(delPatterns).join('\n '));
    }
    del(Array.from(delPatterns), {dryRun: dryRun}).then(deleted => {
      stream.deleted = deleted;
      gutil.log(
        gutil.colors.magenta(PLUGIN_NAME),
        'Deleted ' + deleted.length + ' files and/or directories'
      );
      if (dryRun) {
        gutil.log('\n', deleted.join('\n '));
      }
      cb();
    });
  });
}

module.exports = destClean;
