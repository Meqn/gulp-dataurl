const through = require('through2')
const plugin = require('../lib/index') // Replace with the actual path

jest.mock('through2')
jest.mock('../lib/utils', () => ({
  convertExtensions: jest.fn(),
  getAllFiles: jest.fn(),
  isValidFile: jest.fn(),
  base64Encode: jest.fn()
}))

describe('Gulp DataURL Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process a file with valid content', async () => {
    const fileContents = `
      <img src="assets/image1.png" style="background: url('assets/image2.jpg');">
      <img src="assets/image2.png">
    `
    const file = {
      isNull: jest.fn().mockReturnValue(false),
      isStream: jest.fn().mockReturnValue(false),
      contents: Buffer.from(fileContents)
    }

    const url1 = 'assets/image1.png'
    const url2 = 'assets/image2.jpg'
    const fileUrls = [url1, url2]

    through.obj.mockImplementationOnce(transformFunction =>
      transformFunction(file, 'utf-8', jest.fn())
    )

    require('../lib/utils').getAllFiles.mockReturnValueOnce(fileUrls)
    require('../lib/utils').isValidFile.mockReturnValue(true)
    require('../lib/utils')
      .base64Encode.mockResolvedValueOnce('base64data1')
      .mockResolvedValueOnce('base64data2')

    // Execute the plugin
    await plugin({ limit: 4096, extensions: ['png', 'jpg'] })

    expect(through.obj).toHaveBeenCalled()
    expect(require('../lib/utils').getAllFiles).toHaveBeenCalledWith(fileContents)
    expect(require('../lib/utils').isValidFile).toHaveBeenCalledWith(url1, expect.any(Object))
    expect(require('../lib/utils').isValidFile).toHaveBeenCalledWith(url2, expect.any(Object))
    expect(require('../lib/utils').base64Encode).toHaveBeenCalledWith(url1, file, 4096)
    expect(require('../lib/utils').base64Encode).toHaveBeenCalledWith(url2, file, 4096)

    // Ensure file contents are updated with base64 data
    expect(file.contents.toString()).toContain('base64data1')
    expect(file.contents.toString()).toContain('base64data2')
  })

  it('should handle null files', async () => {
    const file = {
      isNull: jest.fn().mockReturnValue(true)
    }

    through.obj.mockImplementationOnce(transformFunction =>
      transformFunction(file, 'utf-8', jest.fn())
    )

    await plugin({ limit: 4096 })

    expect(through.obj).toHaveBeenCalled()
    expect(require('../lib/utils').getAllFiles).not.toHaveBeenCalled()
    expect(require('../lib/utils').isValidFile).not.toHaveBeenCalled()
    expect(require('../lib/utils').base64Encode).not.toHaveBeenCalled()
    expect(file.contents).toBeUndefined() // No modifications for null files
  })
})
