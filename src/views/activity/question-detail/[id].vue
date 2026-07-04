<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { createQuestionImage } from '../shared/question-detail';
import type { QuestionDetailRow } from '../shared/question-detail';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap: Record<string, QuestionDetailRow> = {
  'Q-6101': {
    id: 'Q-6101',
    title: '图书馆西侧台阶机位',
    author: '运营小助手',
    location: '校图书馆附近',
    status: '已归档',
    answerCount: 126,
    updatedAt: '2026-06-20 21:40',
    imageUrl: createQuestionImage('图书馆西侧台阶机位', 'library'),
    description: '以图书馆西侧台阶为主体，画面应包含入口门廊、三组窗体和前景台阶边线。',
    locationPoint: {
      address: '校图书馆西侧台阶',
      latitude: 31.23058,
      longitude: 121.47374,
      radiusMeters: 50,
      mapPosition: {
        x: 54,
        y: 52
      }
    }
  },
  'Q-6102': {
    id: 'Q-6102',
    title: '湖边长椅倒影',
    author: '运营小助手',
    location: '校园湖区',
    status: '已归档',
    answerCount: 98,
    updatedAt: '2026-06-20 21:32',
    imageUrl: createQuestionImage('湖边长椅倒影', 'lake'),
    description: '拍摄点位于校园湖区北侧步道，画面应包含湖边长椅、湖面倒影和对岸树线。',
    locationPoint: {
      address: '校园湖区北侧长椅',
      latitude: 31.23118,
      longitude: 121.47438,
      radiusMeters: 60,
      mapPosition: {
        x: 42,
        y: 60
      }
    }
  },
  'Q-7001': {
    id: 'Q-7001',
    title: '校园门口机位',
    author: '官方管理员',
    location: '校园主入口',
    status: '已归档',
    answerCount: 88,
    updatedAt: '2026-06-24 16:00',
    imageUrl: createQuestionImage('校园门口机位', 'gate'),
    description: '以校园主入口门头为主体，画面应包含入口立柱、道路前景和两侧绿植参照物。',
    locationPoint: {
      address: '校园主入口',
      latitude: 31.22986,
      longitude: 121.47295,
      radiusMeters: 45,
      mapPosition: {
        x: 58,
        y: 46
      }
    }
  }
};

const questionId = computed(() => route.params.id as string);
const detail = computed<QuestionDetailRow | undefined>(() => {
  const baseDetail = detailMap[questionId.value];

  if (!baseDetail) return undefined;

  if (route.query.from === 'activity_question' && questionId.value === 'Q-7001') {
    return {
      ...baseDetail,
      status: '草稿',
      answerCount: undefined
    };
  }

  return baseDetail;
});
const pageTitle = computed(() => (detail.value ? `${detail.value.title}详情` : '题目详情'));
const markerStyle = computed(() => {
  const position = detail.value?.locationPoint.mapPosition ?? {
    x: 50,
    y: 50
  };

  return {
    left: `${position.x}%`,
    top: `${position.y}%`
  };
});
const radiusStyle = computed(() => {
  const diameter = Math.min(Math.max((detail.value?.locationPoint.radiusMeters ?? 50) * 2, 88), 160);

  return {
    width: `${diameter}px`,
    height: `${diameter}px`
  };
});

function backToList() {
  if (route.name === 'activity_list-question-detail' && typeof route.query.activityId === 'string') {
    routerPushByKey('activity_list-question', {
      params: {
        id: route.query.activityId
      }
    });

    return;
  }

  routerPushByKey('activity_question');
}

watchEffect(() => {
  tabStore.setTabLabel(pageTitle.value);
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">{{ pageTitle }}</h2>
          <p v-if="detail" class="mt-6px text-13px text-#777">
            {{ detail.id }} · {{ detail.author }} · {{ detail.updatedAt }}
          </p>
        </div>
        <NButton @click="backToList">返回列表</NButton>
      </div>
    </NCard>

    <template v-if="detail">
      <NCard :bordered="false" class="card-wrapper">
        <NDescriptions :column="4" label-placement="left" bordered>
          <NDescriptionsItem label="题目编号">{{ detail.id }}</NDescriptionsItem>
          <NDescriptionsItem label="作者">{{ detail.author }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ detail.status }}</NDescriptionsItem>
          <NDescriptionsItem label="答题人数">{{ detail.answerCount ?? '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="机位位置">{{ detail.location }}</NDescriptionsItem>
          <NDescriptionsItem label="定位地址">{{ detail.locationPoint.address }}</NDescriptionsItem>
          <NDescriptionsItem label="允许范围">{{ detail.locationPoint.radiusMeters }}m</NDescriptionsItem>
          <NDescriptionsItem label="更新时间">{{ detail.updatedAt }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-12px flex items-center justify-between">
          <h3 class="m-0 text-16px font-semibold">题目图片</h3>
          <NTag type="info">{{ detail.status }}</NTag>
        </div>
        <NImage
          :src="detail.imageUrl"
          object-fit="cover"
          class="h-360px w-full overflow-hidden rounded-6px border border-#eee border-solid"
        />
        <NAlert class="mt-14px" type="info" :show-icon="false">
          {{ detail.description }}
        </NAlert>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <div class="mb-12px flex items-center justify-between">
          <h3 class="m-0 text-16px font-semibold">定位地图</h3>
          <NTag type="success">{{ detail.locationPoint.radiusMeters }}m</NTag>
        </div>
        <div class="question-map">
          <div class="map-water" />
          <div class="map-green map-green-left" />
          <div class="map-green map-green-right" />
          <div class="map-road map-road-main" />
          <div class="map-road map-road-cross" />
          <div class="map-building map-building-library" />
          <div class="map-building map-building-gate" />
          <div class="map-marker" :style="markerStyle">
            <span class="map-radius" :style="radiusStyle" />
            <span class="map-pin" />
          </div>
        </div>
        <NDescriptions class="mt-14px" :column="3" label-placement="left" bordered>
          <NDescriptionsItem label="地址">{{ detail.locationPoint.address }}</NDescriptionsItem>
          <NDescriptionsItem label="纬度">{{ detail.locationPoint.latitude }}</NDescriptionsItem>
          <NDescriptionsItem label="经度">{{ detail.locationPoint.longitude }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </template>

    <NCard v-else :bordered="false" class="card-wrapper">
      <NEmpty description="未找到题目">
        <template #extra>
          <NButton @click="backToList">返回列表</NButton>
        </template>
      </NEmpty>
    </NCard>
  </NSpace>
</template>

<style scoped>
.question-map {
  position: relative;
  height: 320px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #eef5f1;
}

.map-water {
  position: absolute;
  right: -8%;
  bottom: -24%;
  width: 48%;
  height: 58%;
  border-radius: 50%;
  background: #9fcbd0;
}

.map-green {
  position: absolute;
  border-radius: 16px;
  background: #b8d2a3;
}

.map-green-left {
  left: 6%;
  top: 8%;
  width: 24%;
  height: 34%;
}

.map-green-right {
  right: 9%;
  top: 11%;
  width: 23%;
  height: 26%;
}

.map-road {
  position: absolute;
  background: #d0c6ac;
}

.map-road-main {
  left: -4%;
  top: 49%;
  width: 108%;
  height: 34px;
  transform: rotate(-8deg);
}

.map-road-cross {
  left: 48%;
  top: -8%;
  width: 30px;
  height: 116%;
  transform: rotate(18deg);
}

.map-building {
  position: absolute;
  border: 1px solid #d5c49c;
  border-radius: 8px;
  background: #f0e2c0;
}

.map-building-library {
  left: 17%;
  top: 56%;
  width: 18%;
  height: 18%;
}

.map-building-gate {
  right: 24%;
  top: 42%;
  width: 16%;
  height: 16%;
}

.map-marker {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
}

.map-radius {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 2px solid rgba(24, 160, 88, 0.38);
  border-radius: 50%;
  background: rgba(24, 160, 88, 0.12);
  transform: translate(-50%, -50%);
}

.map-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #18a058;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.26);
  transform: translate(-50%, -50%);
}
</style>
