const gulp = require('gulp');
const eslint = require('gulp-eslint');

const srcDir = './src';
const buildDir = './lib';

gulp.task("lint", function () {
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
    .pipe(eslint.failAfterError());
});

gulp.task('watch', () => {
  gulp.watch(`${srcDir}/**/*.js`, ['lint']);
});

gulp.task('default', ['watch']);