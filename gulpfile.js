const gulp 			= require('gulp');
const gulpPlugins 	= require('gulp-load-plugins');

const $ = gulpPlugins();

gulp.task('images', () => {
	return gulp.src('fotos/**/*')
	.pipe($.cache($.imagemin()))
	.pipe(gulp.dest('images'));
});

gulp.task('projects', () => {
	return gulp.src('fotos/projects/**/*')
	.pipe($.cache($.imagemin({
		optimizationLevel: 6,
		verbose: true
	})))
	.pipe(gulp.dest('images/projects'));
});

gulp.task('default', ['images', 'projects']);