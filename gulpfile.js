const gulp = require('gulp');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');

const srcDir = './src';

gulp.task('lint', () => {
  return gulp.src(`${srcDir}/**/*.js`)
    .pipe(eslint({
        extends: 'eslint:recommended',
        ecmaFeatures: {
            'modules': true
        },
        rules: {
          'comma-dangle': ['error', 'always-multiline'],
          'no-console': 'off'
        },
        env: {
          node: true,
          es6: true
        }
    }))
    .pipe(eslint.format())
});

gulp.task('test', () => {
  return gulp.src('test/**/*.js', {read: false})
    .pipe(mocha({reporter: 'progress'}))
    .once('error', () => gutil.beep());
});

gulp.task('watch', () => {
  gulp.watch(`${srcDir}/**/*.js`, ['lint', 'test']);
});

gulp.task('default', ['test', 'watch']);