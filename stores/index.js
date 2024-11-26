// stores/counter.js
import {
	defineStore
} from 'pinia';

import {
	ref,
	computed,
	watch
} from 'vue'

const setData = (key, value) => {
	let res = false
	try {
		uni.setStorageSync(key, value)
		res = true
	} catch (e) {
		//TODO handle the exception
		console.error('设置数据失败', e)
	}
	return res
}
const getData = (key) => {
	let data = null
	try {
		data = uni.getStorageSync(key);
	} catch (e) {
		//TODO handle the exception
		console.error('获取数据失败', e)
	}
	return data
}
//应用内数据：不需要持久化
export const useAppStore = defineStore('app_data', () => {
	let isInit = false
	// setup白名单下的内容会持久化
	const whiteList = ['isNotification', 'play', 'backgroundImge', '--lyricColor', '--lyricActivColor',
		'--playerColor',
		'--playerSingerColor', '--playerSongColor'
	]
	// 默认属性
	const default_setup = {
		'isNotification': 'no',
		'backgroundImge': '',
		'fixedPath': 'file:///storage/emulated/0/',
		'play': 'current', // 播放设置 当前：current 所有：all
		'--lyricColor': '#999999',
		'--lyricActivColor': '#5a5a5a',
		'--playerColor': '#333333',
		'--playerSongColor': '#333333',
		'--playerSingerColor': '#666666'
	}
	const data = ref({
		appActiva: false, // 应用状态
		isTiming: false, // 是否定时
		timingRecord: 0, //时间记录
		timing: 0, // 定时时间
		timingIndex: 0, // 定时索引
		playName: '', // 当前播放歌曲名称
		lrcInfoList: [], // 当前播放歌曲头部信息
		lrcContentList: [], // 当前播放歌曲歌词主体信息
		setup: {

		}
	});
	// 设置基本属性
	data.value.setup = {
		...default_setup
	}

	watch(() => data.value.setup.play, (newValue, oldValue) => {
		// #ifdef APP-PLUS
		// 当播放设置中发生改变
		if (data.value.setup.play === 'all') {
			usePlayMusicInfoStore().updateStoreDataByKey('parentPath', data.value.setup.fixedPath)
		} else {
			let info = usePlayMusicInfoStore().getStoreData
			if (info.value.path && info.value.path != '') {
				// let parentPath = info.value.path.replace(info.value.name, '')
				console.log('----手动设置parentPath', info.value)
				usePlayMusicInfoStore().updateStoreDataByKey('parentPath', info.value.parentPath)
			}
		}
		// #endif
	}, {
		deep: true,
		immediate: true
	})

	// 获取颜色设置
	const getSetupColor = computed(() => {
		let result = {}
		// #ifdef APP-PLUS
		if (!isInit) {
			// 获取持久化
			let valueObj = getData('app_data')
			if (valueObj && valueObj.setup) {
				// 复制持久化
				for (let i in whiteList) {
					let item = whiteList[i]
					data.value.setup[item] = valueObj.setup[item]
				}
			}
			valueObj = null
			isInit = true
		}
		for (let i in whiteList) {
			let item = whiteList[i]
			result[item] = data.value.setup[item]
		}
		// #endif
		return result
	})

	const getStoreData = computed(() => {
		// #ifdef APP-PLUS
		if (!isInit) {
			// 获取持久化
			let valueObj = getData('app_data')
			if (valueObj && valueObj.setup) {
				// 复制持久化
				for (let i in whiteList) {
					let item = whiteList[i]
					data.value.setup[item] = valueObj.setup[item]
				}
			}

			valueObj = null
			isInit = true
		}
		if (data.value.setup.backgroundImge == '') {
			plus.io.getImageInfo({
				src: '_www/static/background/logo.png',
				success: (res) => {
					data.value.setup.backgroundImge = res.path
					// 更新持久化
					updateSetUpData('backgroundImge', res.path)
				},
				fail: (res) => {
					console.log('----获取背景图片失败', res)
				}
			});
		}
		// #endif
		return data
	})

	function setStoreData(key, value) {
		data.value[key] = value
	}

	function updateSetUpData(key, value) {
		// 如果是白名单中的值则需要持久化
		if (whiteList.includes(key)) {
			// 首先复制好所有的白名单中的对象
			let valueObj = {
				setup: {}
			}
			for (let i in whiteList) {
				let item = whiteList[i]
				valueObj.setup[item] = data.value.setup[item]
			}
			// 变更此次操作的对象
			valueObj.setup[key] = value
			// 持久化
			console.log('----设置持久化', valueObj)
			setData('app_data', valueObj)
		}
		data.value.setup[key] = value
	}

	function reduction() {
		const backgroundImge = data.value.setup.backgroundImge
		data.value.setup = {
			...default_setup
		}
		data.value.setup.backgroundImge = backgroundImge
		// 首先复制好所有的白名单中的对象
		let valueObj = {
			setup: {}
		}
		for (let i in whiteList) {
			let item = whiteList[i]
			valueObj.setup[item] = data.value.setup[item]
		}
		// 持久化
		console.log('----设置持久化', valueObj)
		setData('app_data', valueObj)
	}

	return {
		data,
		getStoreData,
		getSetupColor,
		setStoreData,
		updateSetUpData,
		reduction
	};
})

// 歌单集合,包含歌曲信息
export const useSongSheetListStore = defineStore('song_sheet_list', () => {
	const data = ref([]);
	let isInit = false
	const getStoreData = computed(() => {
		if (!isInit) {
			data.value = getData('song_sheet_list') || []
			isInit = true
		}
		return data
	})

	function setStoreData(value) {
		const result = setData('song_sheet_list', value)
		if (result) {
			data.value = value
			let song = 0;
			let singerSet = new Set()
			// 0 位是所有歌单歌曲内容
			if (data.value.length > 1) {
				for (let i = 1; i < data.value.length; i++) {
					let item = data.value[i]
					song += item.size
					// 歌手
					for (let t = 0; t < item.list.length; t++) {
						let info = item.list[t]
						const match = info.name.match(/(?<=\-)[^.]+/);
						if (match && match[0]) {
							singerSet.add(match[0])
						}
					}
				}
			}
			useStatisticsInfoStore().setStoreDataByKey('song', song)
			useStatisticsInfoStore().setStoreDataByKey('singer', singerSet.size)
		}
	}

	function updateStoreData(verification) {
		if (!data || data.value.length <= 0) {
			return
		}
		const result = verification(data)
		setStoreData(result)
	}

	return {
		data,
		getStoreData,
		setStoreData,
		updateStoreData
	};
});
// 歌单
export const useSongSheetStore = defineStore('song_sheet', () => {
	const data = ref([]);
	let isInit = false
	const getStoreData = computed(() => {
		if (!isInit) {
			data.value = getData('song_sheet')
			isInit = true
		}
		return data
	})

	function setStoreData(value) {
		const result = setData('song_sheet', value)
		if (result) {
			data.value = value
			let num = data.value.length >= 999 ? '999+' : data.value.length
			useStatisticsInfoStore().setStoreDataByKey('type', num)
		}
	}

	function updateStoreData(verification) {
		if (!data || data.value.length <= 0) {
			return
		}
		const result = verification(data)
		setStoreData(result)
	}

	return {
		data,
		getStoreData,
		setStoreData,
		updateStoreData
	};
});
// 播放信息
export const usePlayMusicInfoStore = defineStore('play_music_info', () => {
	const data = ref({
		name: '',
		path: '',
		song: '',
		singer: '',
		parentPath: '',
	});
	let isInit = false

	const getStoreData = computed(() => {
		if (!isInit) {
			data.value = getData('play_music_info')
			// 如果父级地址信息不存在，则手动添加它的上一级为父级信息
			if (data.value && (!data.value.parentPath || data.value.parentPath === '')) {
				data.value.parentPath = data.value.path.replace(data.value.name, '')
			}
			isInit = true
		}
		return data
	})

	function setStoreData(value) {
		let appData = useAppStore().getStoreData
		// 如果父级地址信息不存在，则手动添加它的上一级为父级信息
		if (value && (!value.parentPath || value.parentPath === '')) {
			value.parentPath = value.path.replace(value.name, '')
		}
		// 如果是播放所有内容则父级路径固定
		if (appData.value.setup.play === 'all') {
			value.parentPath = appData.value.setup.fixedPath
		}
		const result = setData('play_music_info', value)
		if (result) {
			data.value = value
		}
	}

	function updateStoreDataByKey(key, value) {
		data.value[key] = value
	}

	function updateStoreData(verification) {
		const result = verification(data)
		setStoreData(result)
	}

	return {
		data,
		getStoreData,
		setStoreData,
		updateStoreData,
		updateStoreDataByKey
	};
});
// 统计信息
export const useStatisticsInfoStore = defineStore('statistics_info', () => {
	const data = ref({
		song: 0,
		singer: 0,
		type: 0
	});
	let isInit = false
	const getStoreData = computed(() => {
		if (!isInit) {
			const res = getData('statistics_info')
			if (res) {
				data.value = res
			}
			isInit = true
		}
		return data
	})

	function setStoreData(value) {
		const result = setData('statistics_info', value)
		if (result) {
			data.value = value
		}
	}

	function setStoreDataByKey(key, value) {
		let item = data.value
		item['' + key] = value
		const result = setData('statistics_info', item)
		if (result) {
			data.value[key] = value
		}
	}

	function updateStoreData(verification) {
		const result = verification(data)
		setStoreData(result)
	}

	return {
		data,
		getStoreData,
		setStoreData,
		setStoreDataByKey,
		updateStoreData
	};
});