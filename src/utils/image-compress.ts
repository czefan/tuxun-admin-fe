import Compressor from 'compressorjs';

const DEFAULT_TARGET_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * 快速读取图片原始物理宽高（用于极端比例拦截）
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      return { width, height };
    } catch {
      // 异常时降级走 Image 加载
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.addEventListener('load', () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    });
    img.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片，请选择有效的 JPG 或 PNG 文件'));
    });
    img.src = url;
  });
}

/**
 * 智能图片压缩：
 * 1. <= 2MB 原样直传（零损耗、零耗时）；
 * 2. 超限时限制分辨率，并根据实际输出大小逐步缩小，最多尝试 8 次；
 * 3. 严格原格式进出，不破坏 PNG 透明通道。
 */
export async function compressImageToTarget(file: File, targetBytes: number = DEFAULT_TARGET_BYTES): Promise<File> {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) throw new Error('图片压缩目标大小无效');
  if (file.size <= targetBytes) {
    return file;
  }

  let maxDimension = 2560;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    // 每轮依据上一轮的实际大小调整尺寸，从原图压缩避免重复有损编码。
    // eslint-disable-next-line no-await-in-loop
    const result = await new Promise<Blob>((resolve, reject) => {
      // eslint-disable-next-line no-new
      new Compressor(file, {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
        quality: Math.max(0.55, 0.85 - attempt * 0.05),
        checkOrientation: true,
        convertTypes: [],
        success: resolve,
        error: reject
      });
    });
    if (result.size <= targetBytes) {
      return new File([result], file.name, { type: result.type || file.type, lastModified: file.lastModified });
    }
    maxDimension = Math.max(1, Math.floor(maxDimension * Math.min(0.8, Math.sqrt(targetBytes / result.size) * 0.9)));
  }
  throw new Error('图片压缩后仍超出目标大小，请缩小图片后重试');
}
