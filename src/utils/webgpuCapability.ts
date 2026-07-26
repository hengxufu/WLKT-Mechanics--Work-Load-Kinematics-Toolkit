import type { WebGPUCapability } from '@/types/computeBackend';

let cachedCapability: WebGPUCapability | null = null;

const capability = (
  supported: boolean,
  adapterAvailable: boolean,
  deviceAvailable: boolean,
  message: string
): WebGPUCapability => ({
  supported,
  adapterAvailable,
  deviceAvailable,
  message,
  checkedAt: Date.now(),
});

export const detectWebGPUCapability = async (
  powerPreference: GPUPowerPreference = 'high-performance',
  forceRefresh = false
): Promise<WebGPUCapability> => {
  if (cachedCapability && !forceRefresh) return cachedCapability;

  if (typeof navigator === 'undefined' || !navigator.gpu) {
    cachedCapability = capability(false, false, false, '当前运行环境不支持 WebGPU Compute。');
    return cachedCapability;
  }

  try {
    const adapterOptions = /Windows/i.test(navigator.userAgent) ? undefined : { powerPreference };
    const adapter = await navigator.gpu.requestAdapter(adapterOptions);
    if (!adapter) {
      cachedCapability = capability(true, false, false, 'WebGPU 可用，但未找到可用的 GPUAdapter。');
      return cachedCapability;
    }

    const device = await adapter.requestDevice();
    device.destroy();
    cachedCapability = capability(true, true, true, 'WebGPU 设备可用；数值求解内核仍处于实验开发阶段。');
    return cachedCapability;
  } catch (error) {
    cachedCapability = capability(
      true,
      false,
      false,
      `WebGPU 初始化失败：${error instanceof Error ? error.message : '未知设备错误'}`
    );
    return cachedCapability;
  }
};

export const clearWebGPUCapabilityCache = () => {
  cachedCapability = null;
};
