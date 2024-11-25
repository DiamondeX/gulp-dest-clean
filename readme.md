# [gulp](https://github.com/gulpjs/gulp)-dest-clean [![Build Status](https://secure.travis-ci.org/DiamondeX/gulp-dest-clean.png?branch=master)](https://travis-ci.org/DiamondeX/gulp-dest-clean) [![NPM version](https://badge.fury.io/js/gulp-dest-clean.png)](http://badge.fury.io/js/gulp-dest-clean)

> The gulp plugin `gulp-dest-clean` allows you to remove files from the
> destination folder which do not exist in the stream and do not match
> optionally supplied patterns. Based on
> [del](https://github.com/sindresorhus/del).

Though, there is other ways to remove some files or folders from the destination
or any other folder, this plugin will make it more comfortable in certain cases
and the code of build file more readable.

> [!IMPORTANT]
> I don't have time to support this plugin anymore, but if you have suggestions on how to improve it, you can create a PR request and I will try to review and approve it.

## Install

Install with [npm](https://npmjs.org/package/gulp-dest-clean).

```bash
npm install --save-dev gulp-dest-clean
# or
npm i -D gulp-dest-clean
```

## Examples

The next code shows a basic usage example:

```js
var gulp = require('gulp');
var clean = require('gulp-dest-clean');
var changed = require('gulp-changed');

const src = 'src/**/*';
const build = 'build';

gulp.task('default', function() {
  return gulp.src(src)
    .pipe(cleanDest(build))
    .pipe(changed(build))
    // Apply more transformations here...
    .pipe(gulp.dest(build));
});
```

Every time this gulp task is executed the next will happen:

-   Files existing in src that are already in build and have not been changed
are kept without changes.
-   Files existing in build that no longer exist in src are removed.
-   Files existing in src that are not present in build or that have been
updated are regenerated.

This way, both directories will be synchronized with the minimum possible work.

### Changing extensions

This is useful when the extension is different in the destination and in the
source.

```js
gulp.task('default', function() {
  var options = {
    extension: '.js',
  };
  return gulp.src('src/**/*.coffee')
    .pipe(cleanDest('lib', options))
    .pipe(changed('lib', options))
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});
```

You can even use an array if each source file generates more than one file at
the destination directory. This is really useful when using sourcemaps:

```js
gulp.task('default', function() {
  var options = {
    extension: ['.js', '.js.map'],
  };
  return gulp.src('src/**/*.js')
    .pipe(cleanDest('lib', options))
    .pipe(changed('lib'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('lib'));
});
```

### Excluding some directory

Imagine the following file structure:

```
.
├── build
│   └── img
│       ├── foo.png
│       ├── bar.png
│       ├── baz
│       │   ├── a.png
│       │   ├── b.png
│       │   └── c.png
│       └── extras
│           ├── leaf.png
│           ├── root.png
│           └── flower.png
└── src
    └── img
        ├── foo.png
        ├── floor.png
        └── baz
            ├── a.png
            └── c.png
```

Suppose you want to synchronize `build/img` with `src/img`, but preserve
`build/img/extras` and it's contents. Then, a gulpfile like this will help you:

```js
const imgSrc = 'src/img/**';
const imgDest = 'build/img';

gulp.task('images', function() {
  return gulp.src(imgSrc)
    .pipe(clean(imgDest, {exclude: 'extras/**'}))
    .pipe(newer(imgDest))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDest));
});
```

Please note that old (or, in other words, unchanged in `src/img`) files are not
deleted nor overwritten in `build/img`.

### Used as a dependency:

```js
const jsSrc = 'src/scripts/*.js';
const jsDest = 'dist/js';

gulp.task('clean-scripts', function() {
  return gulp.src(jsSrc, {read: false})
    .pipe(clean(jsDest));
});

gulp.task('default', ['clean-scripts'], function() {
  return gulp.src(jsSrc)
    .pipe(gulp.dest(jsDest));
});
```

Option `read:false` prevents gulp from reading the contents of the file and
makes this task a lot faster. If you need the file and its contents after
cleaning in the same stream, do not set the read option to `false`.

Make sure to return the stream so that gulp knows the clean task is
[asynchronous](https://github.com/gulpjs/gulp/blob/master/docs/API.md#async-task-support)
and waits for it to terminate before starting the dependent one.


## API

### clean(destPath[, options])

A list of deleted files is available as a `deleted` property on the stream.

#### destPath

Type: `string` *(Required*)

#### options

Type: `object`

##### options.exclude

Type: `string` or `array`

See supported minimatch [patterns](https://github.com/isaacs/minimatch#usage).

-   [Pattern examples with expected matches](https://github.com/sindresorhus/multimatch/blob/master/test.js)
-   [Quick globbing pattern overview](https://github.com/sindresorhus/multimatch#globbing-patterns)

**Remember that actual patterns will be negated** and then negative ones will be supplemented with all parent folders negated. So you don't need to supply additional `'parent'` pattern to preserve `'parent/child.file'`.

#### options.extension

Type: `string`, `object` or `array`

Default: `null`

-   If `string` is supplied, then extension of each file in the stream will be
changed to supplied before exclusion from deletion. e.g.: `".css"`

-   If `array` is supplied, then extension of each file in the stream will be
changed to every extension supplied before exclusion from deletion.
`[".js", ".js.map"]`

-   If `object` is supplied, then for each file with extension matching some of
`object`'s key that extension will be changed to extension in corresponding
`object`'s value before exclusion from deletion. Note that `object`'s value can
be a `string` or an `array`. e.g.: `{".less": ".css", ".yml": ".json"}`

#### options.dryRun

Type: `boolean`
Default: `false`

Output all patterns supplied to [del](https://github.com/sindresorhus/del)
and the path of every file that would be deleted but it doesn't remove them.

## TODO

-   [ ] use travis CI

## License

[MIT](http://en.wikipedia.org/wiki/MIT_License) @ Ruslan Zhomir
