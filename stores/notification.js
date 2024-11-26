import {
	defineStore
} from 'pinia';

import {
	ref,
	watch,
	computed
} from 'vue'

import {
	usePlayMusicInfoStore,
} from './index.js'

import {
	useAudioManagerStore,
} from './audioManager.js'

import {
	useAppStore,
} from './index.js'


// 通知组件
export const useNotificationStore = defineStore('notification', () => {
	const innerAudioContext = useAudioManagerStore().getStoreData.value.audioContext
	const appData = useAppStore().getStoreData
	const data = ref({
		'notification': null,
		'isLockActivity': false, // 是否开启锁屏页
		'isCreateNotification': false, // 是否创建了Notification
		'systemNotification': false, // 是否使用系统的 Notification, 只有 android 8.0 以上才有效
		'activation': 'index',
		'events': {
			'details': {
				'musicNotificationPause': null,
				'musicNotificationPrevious': null,
				'musicNotificationNext': null,
				'musicSeekTo': null,
				'musicLifecycle': null,
				'musicNotificationFavourite': null,
				'musicNotificationClose': null
			},
			'index': {
				'musicNotificationPause': null,
				'musicNotificationPrevious': null,
				'musicNotificationNext': null,
				'musicSeekTo': null,
				'musicLifecycle': null,
				'musicNotificationFavourite': null,
				'musicNotificationClose': null
			}
		}
	})

	// #ifdef APP-PLUS
	try {
		// 设置获取插件
		data.value.notification = uni.requireNativePlugin(
			'XZH-musicNotification');
	} catch (e) {
		//TODO handle the exception
		console.log('----获取插件异常', e)
	}
	// #endif

	const getStoreData = computed(() => {
		return data
	})

	watch(() => data.value.activation, (newValue, oldValue) => {
		if (oldValue && oldValue !== '') {
			data.value.events[oldValue] = {
				'musicNotificationPause': null,
				'musicNotificationPrevious': null,
				'musicNotificationNext': null,
				'musicSeekTo': null,
				'musicLifecycle': null,
				'musicNotificationFavourite': null,
				'musicNotificationClose': null
			}
		}
	})
	// 初始化
	async function init(obj = {}) {
		try {
			// #ifdef APP-PLUS
			// 初始化
			data.value.notification.init(obj);
			data.value.notification.switchNotification(true)
			// #endif
			const res = await createNotification()
			console.log('----通知插件初始化', res)
		} catch (e) {
			//TODO handle the exception
			console.log('----通知插件初始化异常', e)
		}

	}

	function getJurisdiction() {
		uni.showModal({
			title: '授权提示',
			content: '使用本应用需要开启通知权限',
			success: function(res) {
				if (res.confirm) {
					data.value.notification
						.openPermissionSetting(); //没有权限，跳转设置页面
					useAppStore().updateSetUpData('isNotification', 'yes')
				} else if (res.cancel) {
					uni.showToast({
						icon: "none",
						title: '用户取消授权',
						duration: 2000
					});
				}
			}
		});
	}

	// 创建通知
	function createNotification() {
		// #ifdef APP-PLUS
		// 创建通知栏，要创建通知栏成功才能做别的操作
		return new Promise((resolve, reject) => {
			data.value.notification.createNotification((res) => {
				data.value.isCreateNotification = true;
				plus.push.clear();
				resolve(res);
			})
		})
		// #endif
	}

	// 更新通知内容
	async function updateNotification(item) {
		// #ifdef APP-PLUS
		try {

			if (data.value.notification === null) {
				console.error('请先获取实例')
				return
			}
			if (!data.value.isCreateNotification) {
				await init()
			}
			// 更新播放信息
			usePlayMusicInfoStore().setStoreData({
				name: item.name,
				path: item.path,
				song: item.song,
				singer: item.singer,
				parentPath: item.parentPath,
			})
			// 更新通知内容
			let res = data.value.notification.update({
				//歌曲名字
				songName: item.song || 'OpenMusic',
				//专辑名字
				artistsName: item.singer || 'OpenMusic',
				//收藏
				favour: false,
				//专辑图片 _www/static/background/hai.jpg  
				picUrl: item.picUrl || appData.value.setup.backgroundImge,
				// 时长
				duration: Number((innerAudioContext.duration * 1000).toFixed(0))
			});
			// 设置当前播放时间
			data.value.notification.setPosition(Number((innerAudioContext.currentTime * 1000).toFixed(0)));
			switch (res.code) {
				case -1: //未知错误
					console.log(data.value.activation, "未知错误", res);
					return;
				case -2: //没有权限
					getJurisdiction()
					return;
			}
			console.log('更新当前播放音乐', item)
		} catch (e) {
			//TODO handle the exception
			console.log('更新通知内容失败', e)
		}
		// #endif
	}

	function setEvents(key, value) {
		data.value.events[key] = value
	}

	function setActivation(value) {
		data.value.activation = value
	}

	function cancel() {
		// #ifdef APP-PLUS
		// 移除暂停或播放按钮事件回调监听
		plus.globalEvent.removeEventListener('musicNotificationPause')
		// 移除播放上一首按钮事件回调监听
		plus.globalEvent.removeEventListener('musicNotificationPrevious')
		// 移除播放下一首按钮事件回调监听
		plus.globalEvent.removeEventListener('musicNotificationNext')
		// 移除收藏按钮事件回调监听
		plus.globalEvent.removeEventListener('musicNotificationFavourite')
		// 移除关闭按钮事件回调
		plus.globalEvent.removeEventListener('musicNotificationClose')
		// 移除耳机事件回调监听
		plus.globalEvent.removeEventListener('musicMediaButton')
		// 移除通知栏进度条拖动事件回调
		plus.globalEvent.removeEventListener('musicSeekTo')
		// 移除监听生命周期事件回调
		plus.globalEvent.removeEventListener('musicLifecycle')
		// 移除通知栏
		data.value.notification.cancel()
		// #endif
	}
	// #ifdef APP-PLUS
	// 监听生命周期事件回调
	plus.globalEvent.addEventListener('musicLifecycle', (e) => {
		if (!data.value.events[data.value.activation].musicLifecycle) {
			return
		}
		data.value.events[data.value.activation].musicLifecycle(e)
	});
	// 监听暂停或播放按钮事件回调
	plus.globalEvent.addEventListener('musicNotificationPause', (e) => {
		if (!data.value.events[data.value.activation].musicNotificationPause) {
			return
		}
		data.value.events[data.value.activation].musicNotificationPause(e)
	});

	// 监听播放上一首按钮事件回调
	plus.globalEvent.addEventListener('musicNotificationPrevious', (e) => {
		if (!data.value.events[data.value.activation].musicNotificationPrevious) {
			return
		}
		data.value.events[data.value.activation].musicNotificationPrevious(e)
	});
	// 监听播放下一首按钮事件回调
	plus.globalEvent.addEventListener('musicNotificationNext', (e) => {
		if (!data.value.events[data.value.activation].musicNotificationNext) {
			return
		}
		data.value.events[data.value.activation].musicNotificationNext(e)

	});
	// 监听收藏按钮事件回调
	plus.globalEvent.addEventListener('musicNotificationFavourite', (e) => {
		if (!data.value.events[data.value.activation].musicNotificationFavourite) {
			return
		}
		data.value.events[data.value.activation].musicNotificationFavourite(e)
	});
	// 监听关闭按钮事件回调
	plus.globalEvent.addEventListener('musicNotificationClose', (e) => {
		if (!data.value.events[data.value.activation].musicNotificationClose) {
			return
		}
		data.value.events[data.value.activation].musicNotificationClose(e)
	});
	// 通知栏进度条拖动事件回调
	plus.globalEvent.addEventListener('musicSeekTo', (e) => {
		if (!data.value.events[data.value.activation].musicSeekTo) {
			return
		}
		data.value.events[data.value.activation].musicSeekTo(e)
	});
	// #endif
	return {
		data,
		init,
		getStoreData,
		updateNotification,
		setEvents,
		setActivation,
		cancel
	};
})