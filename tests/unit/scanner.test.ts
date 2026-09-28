import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  verify: vi.fn(),
  start: vi.fn(),
  destroy: vi.fn(),
  warning: vi.fn()
}));
vi.mock('@/service/api/mall', () => ({ fetchExchanges: mocks.query, verifyExchange: mocks.verify }));
vi.mock('@/components/custom/svg-icon.vue', () => ({ default: { template: '<span />' } }));
vi.mock('qr-scanner', () => ({
  default: class {
    start = mocks.start;
    stop = vi.fn();
    destroy = mocks.destroy;
  }
}));
vi.mock('naive-ui', async importOriginal => ({
  ...(await importOriginal<typeof import('naive-ui')>()),
  useMessage: () => ({ warning: mocks.warning, success: vi.fn(), error: vi.fn() })
}));
import VerifyCodeModal from '@/components/advanced/verify-code-modal.vue';

function setup() {
  const wrapper = mount(VerifyCodeModal, {
    props: { show: true },
    global: { stubs: { NModal: { template: '<div><slot /></div>' }, NImage: true } }
  });
  const vm = wrapper.vm as unknown as { onScanned: (code: string) => Promise<void>; record: unknown };
  return { wrapper, vm };
}

beforeEach(() => {
  mocks.start.mockResolvedValue(undefined);
});
describe('扫码生命周期', () => {
  it('关闭窗口后忽略迟到的查单结果，不重启摄像头', async () => {
    let finish!: (value: unknown) => void;
    mocks.query.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const { wrapper, vm } = setup();
    await flushPromises();
    const scanning = vm.onScanned('EXCH8881');
    await wrapper.setProps({ show: false });
    finish({ data: { list: [{ id: 1 }] } });
    await scanning;
    expect(vm.record).toBeNull();
    expect(mocks.start).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it('无效二维码不会查询后端', async () => {
    const { wrapper, vm } = setup();
    await flushPromises();
    await vm.onScanned('https://example.test');
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.warning).toHaveBeenCalled();
    wrapper.unmount();
  });
  it('未完成的查单阻止重复扫描', async () => {
    let finish!: (value: unknown) => void;
    mocks.query.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const { wrapper, vm } = setup();
    await flushPromises();
    const first = vm.onScanned('EXCH8881');
    await vm.onScanned('EXCH8881');
    expect(mocks.query).toHaveBeenCalledTimes(1);
    finish({ data: { list: [] } });
    await first;
    wrapper.unmount();
  });
});
