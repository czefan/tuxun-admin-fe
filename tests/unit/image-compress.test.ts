import { beforeEach, describe, expect, it, vi } from 'vitest';
const compress = vi.hoisted(() => vi.fn());
vi.mock('compressorjs', () => ({
  default: function Compressor(file: File, options: unknown) {
    compress(file, options);
  }
}));
import { compressImageToTarget } from '@/utils/image-compress';

beforeEach(() => {
  compress.mockReset();
});
describe('图片压缩', () => {
  it('未超限不重新编码', async () => {
    const file = new File(['small'], 'a.png', { type: 'image/png' });
    expect(await compressImageToTarget(file, 10)).toBe(file);
    expect(compress).not.toHaveBeenCalled();
  });
  it('按实际大小继续缩小，并保留 PNG 格式', async () => {
    compress.mockImplementationOnce((_file, options) =>
      options.success(new Blob(['123456789012345'], { type: 'image/png' }))
    );
    compress.mockImplementationOnce((_file, options) => options.success(new Blob(['12345'], { type: 'image/png' })));
    const file = new File(['x'.repeat(30)], 'a.png', { type: 'image/png' });
    const result = await compressImageToTarget(file, 10);
    expect(result.size).toBeLessThanOrEqual(10);
    expect(result.type).toBe('image/png');
    expect(compress.mock.calls[1][1].maxWidth).toBeLessThan(compress.mock.calls[0][1].maxWidth);
  });
  it('压缩失败拒绝上传，不能静默回退超限原图', async () => {
    compress.mockImplementation((_file, options) => options.error(new Error('decode failed')));
    await expect(compressImageToTarget(new File(['x'.repeat(30)], 'a.png'), 10)).rejects.toThrow('decode failed');
  });
  it('异常压缩器不能引发无限循环', async () => {
    compress.mockImplementation((_file, options) => options.success(new Blob(['x'.repeat(30)])));
    await expect(compressImageToTarget(new File(['x'.repeat(30)], 'a.png'), 10)).rejects.toThrow('仍超出');
    expect(compress).toHaveBeenCalledTimes(8);
  });
});
