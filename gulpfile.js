'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');
var map = require('map-stream');
var events = require('events');
var emmitter = new events.EventEmitter();
var path = require('path');


var jsHintErrorReporter = map(function (file, cb) {
  if (!file.jshint.success) {
    file.jshint.results.forEach(function (err) {
      if (err) {
        //console.log(err);

        // Error message
        var msg = [
          path.basename(file.path),
          'Line: ' + err.error.line,
          'Reason: ' + err.error.reason
        ];

        // Emit this error event
        emmitter.emit('error', new Error(msg.join('\n')));

      }
    });

  }
  cb(null, file);
});

gulp.task('jshint', function() {
  gulp.src('js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jsHintErrorReporter)
    .on('error', notify.onError(function (error) {
      return error.message;
    }));
});

gulp.task('watch', function() {
  gulp.watch('js/**/*.js', ['jshint']);
});

gulp.task('default', ['jshint'], function () {
  gulp.start('watch');
});
