const through = require('through2')
const { tag } = require('diy-log')
const { convertExtensions, getAllFiles, isValidFile, base64Encode } = require('./utils')

const pluginName = 'gulp-dataurl'

/**
 * 将匹配规则的文件转成base64格式
 * @param {object} options - 配置选项
 * @param {boolean} [options.remote=false] - 是否支持远程文件
 * @param {(string|string[])} [options.extensions] - 支持的扩展名
 * @param {(RegExp|string|string[])} [options.include] - 匹配规则模式
 * @param {(string|RegExp)} [options.exclude] - 排除规则模式
 * @param {number} [options.limit=4096] - 文件大小限制
 */
module.exports = function (options) {
  options = Object.assign({
    limit: 4096
  }, options)
  if (options.extensions) {
    options.extensions = convertExtensions(options.extensions)
  }

  //缓存已处理的图片
  const cache = {}

  return through.obj(async (file, enc, callback) => {
    if (file.isNull()) {
      // 返回空文件
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new Error(`${pluginName}: Streaming not supported`));
    }

    try {
      const fileUrls = getAllFiles(file.contents.toString())
      for (const url of fileUrls) {
        // 未命中缓存且符合规则
        if (undefined === cache[url]) {
          if (isValidFile(url, options)) {
            const base64 = await base64Encode(url, file, options.limit)
            cache[url] = base64
          } else {
            // 不符合规则的无需再次验证
            cache[url] = false
          }
        }
        const cached = cache[url]
        if (cached) { // base64Encode可能会返回空字符串
          file.contents = Buffer.from(file.contents.toString().replace(url, cached))
        }
      }
    } catch (err) {
      // 出错, 无需处理
      tag.error(err?.message)
    }
    callback(null, file)
  })
}
