import type { Router } from 'vue-router';
import { useTitle } from '@vueuse/core';
import { $t } from '@/locales';

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    const documentTitle = to.meta.i18nKey ? $t(to.meta.i18nKey) : to.meta.title;
    useTitle(documentTitle || '图寻后台管理');
  });
}
