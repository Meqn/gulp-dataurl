const path = require('path')
const mime = require('mime')
const { tag } = require('diy-log')
const { accessFile } = require('file-access')

jest.mock('mime', () => ({ getType: jest.fn() }))
jest.mock('file-access', () => ({ accessFile: jest.fn() }))
jest.mock('diy-log', () => ({
  tag: { error: jest.fn() }
}))

const {
  convertExtensions,
  getAllFiles,
  isValidFile,
  base64Encode
} = require('../lib/utils')

describe('convertExtensions', () => {
  it('should convert a string to an array', () => {
    expect(convertExtensions('.jpg')).toEqual(['.jpg'])
  })

  it('should handle comma separated strings', () => {
    expect(convertExtensions('.jpg,.png')).toEqual(['.jpg', '.png'])
  })

  it('should return the input array if already an array', () => {
    expect(convertExtensions(['.jpg', '.png'])).toEqual(['.jpg', '.png'])
  })

  it('should not add dot if already present', () => {
    expect(convertExtensions(['jpg', 'png'])).toEqual(['.jpg', '.png'])
  })
})

describe('getAllFiles', () => {
  it('should extract all file paths from HTML content', () => {
    const content = `
      <img src="image1.jpg">
      <img src="image2.jpg">
      <img src="image3.jpg">
    `
    expect(getAllFiles(content)).toEqual([
      'image1.jpg',
      'image2.jpg',
      'image3.jpg'
    ])
  })

  it('should extract all file paths from CSS content', () => {
    const content = `
      background-image: url(image1.jpg);
      background-image: url(image2.jpg);
      @font-face {
        font-family: 'iconfont';
        src: url('font.woff') format('woff');
    `
    expect(getAllFiles(content)).toEqual([
      'image1.jpg',
      'image2.jpg',
      'font.woff'
    ])
  })

  it('should extract all file paths from mixed content', () => {
    const content = `
      <img src="image1.jpg">
      background-image: url(image2.jpg);
    `
    expect(getAllFiles(content)).toEqual(['image1.jpg', 'image2.jpg'])
  })

  it('Return an empty array if no file paths are found', () => {
    const content = `
      <div>Hello, World!</div>
      <p>This is a paragraph.</p>
    `
    expect(getAllFiles(content)).toEqual([])
  })
})

describe('isValidFile', () => {
  it('should validate remote files', () => {
    expect(isValidFile('https://example.com/image.jpg', {
      remote: true,
      extensions: ['.jpg', '.jpeg', '.png']
    })).toBe(true);
  })

  it('should validate local files', () => {
    expect(isValidFile('image.jpg', {
      extensions: ['.jpg', '.jpeg', '.png']
    })).toBe(true);
  })

  it('should invalid file with unsupported extension', () => {
    expect(isValidFile('font.woff', {
      extensions: ['.png', 'svg']
    })).toBe(false);
  })

  it('should valid file matching include pattern', () => {
    expect(isValidFile('assets/image.jpg', {
      include: ['assets']
    })).toBe(true);
  })

  it('should invalid file matching include pattern', () => {
    expect(isValidFile('assets/image.jpg', {
      include: /\*\.png$/i
    })).toBe(false);
  })

  it('should valid file matching exclude pattern', () => {
    expect(isValidFile('assets/image.jpg', {
      exclude: ['assets']
    })).toBe(false);
  })

  it('should invalid file matching exclude pattern', () => {
    expect(isValidFile('assets/image.jpg', {
      exclude: /\*\.png$/i
    })).toBe(true);
  })

  it('should valid file matching include and exclude pattern', () => {
    expect(isValidFile('assets/image.jpg', {
      include: /\*\.jpg$/i,
      exclude: ['static']
    })).toBe(false);
  })
})

describe('base64Encode', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should encode a local file to base64', async () => {
    const url = 'localFile.jpg';
    const file = { path: '/some/path/', content: 'file' };
    const limit = 1000;
    const filePath = path.join(path.dirname(file.path), url)

    mime.getType.mockReturnValueOnce('image/jpeg');
    accessFile.mockResolvedValueOnce(Buffer.from(file.content));

    const result = await base64Encode(url, file, limit);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(mime.getType).toHaveBeenCalledWith(filePath);
    expect(accessFile).toHaveBeenCalledWith(filePath);
  });

  it('should use remote file content type if available', async () => {
    const url = 'https://example.com/remoteFile.jpg';
    const file = { path: '/some/path', content: 'file' };
    const limit = 1000;

    accessFile.mockResolvedValueOnce({ contentType: 'image/jpeg', content: Buffer.from(file.content) });

    const result = await base64Encode(url, file, limit);

    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(accessFile).toHaveBeenCalledWith(url);
  });

  it('should handle file size limit', async () => {
    const url = 'localFile.jpg';
    const file = { path: '/some/path', content: 'file' };
    const limit = 1; // Limit set to 1 byte to trigger size limit

    accessFile.mockResolvedValueOnce(Buffer.from(file.content));

    const result = await base64Encode(url, file, limit);

    expect(result).toBe('');
  });

  it('should handle errors and log them', async () => {
    const url = 'localFile.jpg';
    const file = { path: '/some/path', content: 'file-content' };
    const limit = 1000;

    accessFile.mockRejectedValueOnce(new Error('File access error'));

    const result = await base64Encode(url, file, limit);

    expect(result).toBe('');
    expect(tag.error).toHaveBeenCalledWith('File access error');
  });
});