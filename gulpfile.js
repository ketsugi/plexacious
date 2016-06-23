const gulp = require('gulp');
const babel = require('gulp-babel');

const srcDir = './src';
const buildDir = './lib';

gulp.task('babelify', () => {
  return gulp.src(`${srcDir}/**/*.js`)
    .pipe(babel())
    .pipe(gulp.dest(buildDir));
});

gulp.task('watch', () => {
  gulp.watch(`${srcDir}/**/*.js`, ['babelify']);
})

gulp.task('default', ['babelify', 'watch']);