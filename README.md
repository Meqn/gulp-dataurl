# gulp-dataurl

> A gulp plugin that converts matched file paths into base64-encoded data URI strings.

一个 gulp 插件，用于将匹配到的文件路径转换为 `base64` 编码的 data URI 字符串。



## features

- Support for remote files
- Customizable file type extensions
- Inclusion/exclusion rulesets for selective file encoding
- File size limits to prevent overly large Data URLs
- Cache duplicate processed files



## Usage

Install with npm
```bash
npm install -D gulp-dataurl
```

gulp task:
```js
const gulp = require('gulp');
const dataurl = require('gulp-dataurl');

gulp.task('html', function() {
  return gulp.src('src/**/*.html')
    .pipe(dataurl({
      remote: true,
      extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
      include: /\?inline$/i,
      exclude: 'node_modules',
      limit: 2048 //2kb
    }))
    .pipe(gulp.dest('dist')); 
});
```



## Options


#### remote
- Type: `boolean`
- Default: `false`

Whether remote files are supported.

#### extensions
- Type: `string | string[]`
- Default: `['.png', '.jpg', '.jpeg', '.gif', '.svg']`

Supported extensions.

#### include
- Type: `string | string[] | RegExp | RegExp[]`

Matching rule patterns.

#### exclude
- Type: `string | string[] | RegExp | RegExp[]`

Exclusion rule patterns.


#### limit
- Type: `number`
- Default: `4096`

File Size Limit.

