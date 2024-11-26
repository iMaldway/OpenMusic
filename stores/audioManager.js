import {
	defineStore
} from 'pinia';

import {
	ref,
	watch,
	computed
} from 'vue'

//背景音频
export const useAudioManagerStore = defineStore('audioManager', () => {
	const data = ref({
		audioContext: null,
		activation: 'index',
		events: {
			'details': {
				'onCanplay': null,
				'onError': null,
				'onTimeUpdate': null,
				'onPause': null,
				'onEnded': null
			},
			'index': {
				'onCanplay': null,
				'onError': null,
				'onTimeUpdate': null,
				'onPause': null,
				'onEnded': null
			}
		},
		exception: {
			'onCanplay': null,
			'onError': null,
			'onTimeUpdate': null,
			'onPause': null,
			'onEnded': null
		}
	});

	// #ifdef APP-PLUS
	// 设置获取背景播放对象
	data.value.audioContext = uni.getBackgroundAudioManager();
	// #endif
	const getStoreData = computed(() => {
		return data
	})

	watch(() => data.value.activation, (newValue, oldValue) => {
		if (oldValue && oldValue !== '') {
			data.value.events[oldValue] = {
				'onCanplay': null,
				'onError': null,
				'onTimeUpdate': null,
				'onPause': null,
				'onEnded': null
			}
		}
	})

	function setEvents(key, value) {
		data.value.events[key] = value
	}

	function setActivation(value) {
		data.value.activation = value
	}

	function setException(value) {
		data.value.exception = value
	}

	// #ifdef APP-PLUS
	// 音频进入可播放状态
	data.value.audioContext.onCanplay((res) => {
		if (!data.value.events[data.value.activation].onCanplay) {
			return
		}
		data.value.events[data.value.activation].onCanplay(res)
		if (data.value.exception.onCanplay) {
			data.value.exception.onCanplay(res)
		}
	})
	// 异常处理
	data.value.audioContext.onError((res) => {
		if (!data.value.events[data.value.activation].onError) {
			console.log(data.value.activation, res)
		} else {
			data.value.events[data.value.activation].onError(res)
		}
	})
	// 音频播放进度更新事件
	data.value.audioContext.onTimeUpdate((res) => {
		if (!data.value.events[data.value.activation].onTimeUpdate) {
			return
		}
		data.value.events[data.value.activation].onTimeUpdate(res)
		if (data.value.exception.onTimeUpdate) {
			data.value.exception.onTimeUpdate(res)
		}
	})
	// 音频暂停事件
	data.value.audioContext.onPause((res) => {
		if (!data.value.events[data.value.activation].onPause) {
			return
		}
		data.value.events[data.value.activation].onPause(res)
		if (data.value.exception.onPause) {
			data.value.exception.onPause(res)
		}
	})
	// 音频自然结束事件
	data.value.audioContext.onEnded((res) => {
		if (!data.value.events[data.value.activation].onEnded) {
			return
		}
		data.value.events[data.value.activation].onEnded(res)
		if (data.value.exception.onEnded) {
			data.value.exception.onEnded(res)
		}
	})
	// #endif

	return {
		data,
		getStoreData,
		setEvents,
		setActivation,
		setException
	};
})