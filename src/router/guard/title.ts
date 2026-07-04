import type { Router } from 'vue-router';
import { useTitle } from '@vueuse/core';
import { getRouteTitle } from '@/utils/route-title';

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    useTitle(getRouteTitle(to));
  });
}
