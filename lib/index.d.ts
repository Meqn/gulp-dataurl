/// <reference types="node" />

interface IOptions {
  /**
   * Whether remote files are supported
   */
  remote?: boolean

  /**
   * Supported extensions
   * @default ['.svg', '.png', '.jpg', '.jpeg', '.gif']
   */
  extensions?: string | string[]

  /**
   * Matching rule patterns
   */
  include?: string | string[] | RegExp | RegExp[]

  /**
   * Exclusion rule patterns
   */
  exclude?: string | string[] | RegExp | RegExp[]

  /**
   * File Size Limit
   * @default 4096
   */
  limit?: number
}

declare function dataURL(options?: IOptions): NodeJS.ReadWriteStream
export = dataURL
