const path = require('path')
const mime = require('mime')
const { tag } = require('diy-log')
const { accessFile } = require('file-access')

const remoteRegex = /^(https?:\/\/).+/i

/**
 * 转换扩展名为数组
 *
 * @param {string|string[]} extensions - 源扩展名
 * @return {string[]}
 */
const convertExtensions = (extensions) => {
  if (typeof extensions === 'string') {
    if (extensions.includes(',')) {
      extensions = extensions.split(',')
    } else {
      extensions = [extensions]
    }
  }
  return extensions.map(ext => {
    return ext.startsWith('.') ? ext : `.${ext}`
  })
}

/**
 * 使用正则获取文件内所有文件路径
 *
 * @param {string} content - 待提取的内容
 * @return {Array}
 */
const getAllFiles = (content) => {
  const regex = /(?:<img[^>]+?src=["']([^"']+?)["'][^>]*?>)|(?:url\(["']?([^"'\)]+)["']?\))/gi;
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    // match[1] 匹配HTML中的<img>标签中的图片路径
    // match[2] 匹配CSS中的url()函数中的图片路径
    let _path = match[1] || match[2];

    // 将图片路径添加到数组中
    matches.push(_path);
  }

  // 输出匹配到的图片路径
  return matches
}

/**
 * 校验图片是否符合规则
 *
 * @param {string} file - 要验证的文件 URL 或文件路径
 * @param {object} options - 验证选项
 * @param {boolean} options.remote - 是否支持远程图像
 * @param {string[]} options.extensions - 支持的扩展名
 * @param {string|string[]} options.include - 匹配规则模式
 * @param {string|string[]} options.exclude - 排除规则模式
 * @return {boolean}
 */
const isValidFile = (file, { remote, extensions, include, exclude }) => {
  if (!file) return false

  const isLocal = !remoteRegex.test(file)

  // 不处理远程图片
  if (!remote && !isLocal) return false

  // 是否符合扩展名
  if (extensions) {
    if (!extensions.includes(path.extname(file).split('?')[0])) return false
  }

  // 是否符合include规则
  if (include) {
    const matchesInclude = [].concat(include).some(r => {
      return (r instanceof RegExp) ? r.test(file) : file.includes(r)
    })
    if (!matchesInclude) return false;
  }

  // exclude排除文件
  if (exclude) {
    const matchesExclude = [].concat(exclude).some(r => {
      return (r instanceof RegExp) ? r.test(file) : file.includes(r)
    })
    if (matchesExclude) return false;
  }

  return true
}

/**
 * 将文件编码为 base64 格式
 *
 * @param {string} url - 要编码的文件的路径或 URL
 * @param {object} file - 待编码内容中文件的文件对象
 * @param {number} limit - 图像大小限制
 * @return {string} 文件base64编码
 */
const base64Encode = async (url, file, limit) => {
  try {
    const isLocal = !remoteRegex.test(url)
    let mineType = ''

    if (isLocal) {
      url = path.join(path.dirname(file.path), url)
      mineType = mime.getType(url)
    }

    const data = await accessFile(url)
    
    // !待优化: 文件超出大小限制
    if (limit && data.byteLength > limit) {
      return ''
    }

    // 远程文件 mime
    if (data.contentType) {
      mineType = data.contentType
    }

    return `data:${mineType};base64,${data.toString('base64')}`
  } catch (err) {
    tag.error(err?.message)
    return ''
  }
}

module.exports = {
  convertExtensions,
  getAllFiles,
  isValidFile,
  base64Encode
}
