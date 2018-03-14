const gulp = require('gulp');

const less = require('gulp-less');
const minifyCSS = require('gulp-csso');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;

const rename = require('gulp-rename');

const webserver = require('gulp-webserver');

gulp.task('index', function () {
  return gulp.src('index.build.html')
    .pipe(rename('index.html'))
    .pipe(gulp.dest('build/'));
});

gulp.task('root', function () {
  return gulp.src([
    'sw.js',
    '404.html',
    'orbit360.webmanifest',
    'robots.txt'
  ])
    .pipe(gulp.dest('build/'));
});

gulp.task('views', function () {
  return gulp.src('views/*.html')
    .pipe(gulp.dest('build/views'));
});

gulp.task('less', function () {
  return gulp.src('styles/*.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/styles'));
});

gulp.task('lib_css', function () {
  return gulp.src('node_modules/angular-material/angular-material.min.css')
    .pipe(gulp.dest('build/styles'));
});

gulp.task('css', ['less', 'lib_css']);

gulp.task('js', function () {
  return gulp.src('scripts/**/*.js')
    .pipe(concat('bundle.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('build/'));
});

gulp.task('resources', function () {
  return gulp.src('resources/**/*')
    .pipe(gulp.dest('build/resources'));
});

gulp.task('lib', function () {
  return gulp.src('lib/*.js')
    .pipe(gulp.dest('build/lib'));
});

gulp.task('node_modules', function () {
  return gulp.src([
    'node_modules/fg-loadcss/dist/cssrelpreload.min.js',
    'node_modules/angular/angular.min.js',
    'node_modules/angular-animate/angular-animate.min.js',
    'node_modules/angular-messages/angular-messages.min.js',
    'node_modules/angular-resource/angular-resource.min.js',
    'node_modules/angular-material/angular-material.min.js',
    'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
    'node_modules/jszip/dist/jszip.min.js',
    'node_modules/file-saver/FileSaver.min.js',
    'node_modules/angular-aria/angular-aria.min.js'
  ])
    .pipe(gulp.dest('build/lib'));
});

gulp.task('fa', function () {
  return gulp.src('node_modules/font-awesome/**/*')
    .pipe(gulp.dest('build/lib/font-awesome'));
});

gulp.task('libs', ['lib', 'node_modules', 'fa']);

gulp.task('ws-build', function() {
  gulp.src('build')
    .pipe(webserver({
      livereload: false,
      directoryListing: false,
      open: true
    }));
});

gulp.task('ws-dev', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

gulp.task('build', [ 'index', 'root', 'views', 'css', 'js', 'resources', 'libs' ]);

gulp.task('build-n-serve', ['build', 'ws-build']);


