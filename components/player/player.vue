<template>
	<view class="player" :style="SETUP_STYLE">
		<uni-row class="player_name" @click.stop="musicDetails">
			<view v-if="!songInfo.song" class="player_name_song">当前没有歌曲播放</view>
			<view v-if="songInfo.song && songInfo.song.length <= 22" class="player_name_song">{{ songInfo.song }}</view>
			<uni-notice-bar v-if="songInfo.song && songInfo.song.length > 22" color="#333" background-color="#FFF"
				class="player_name_song" single scrollable :text="songInfo.song" />
			<view class="player_name_singer">{{songInfo.singer || 'OpenMusic'}}</view>
		</uni-row>
		<uni-row class="player_time" v-if="props.isShowTime">
			<uni-col :span="24">
				<view id="bgtotal" class="player_time_bgtotal" @click="slideSpeed($event)"></view>
				<view class="player_time_bg" :span="24"></view>
				<view class="player_time_dynamic" :span="24" :style="{'width':playerTime.width+'%'}"></view>
			</uni-col>
			<uni-col class="player_time_info" :span="24">
				<view class="player_time_current">
					{{ timeCurrent }}
				</view>
				<view class="player_time_total">
					{{ timeTotal }}
				</view>
			</uni-col>
		</uni-row>
		<uni-row class="player_control">
			<view class="player_control_icon" @click="updatePlayerState">
				<uni-icons class="icons" v-if=" playerState ==0 " fontFamily="iconfont"
					size="30">{{ '&#xe60e;' }}</uni-icons>
				<uni-icons class="icons" v-if=" playerState ==1 " fontFamily="iconfont"
					size="30">{{ '&#xea75;' }}</uni-icons>
				<uni-icons class="icons" v-if=" playerState ==2 " fontFamily="iconfont"
					size="30">{{ '&#xe6bd;' }}</uni-icons>
			</view>
			<view class="player_control_icon" @click="playerBefore"><uni-icons class="icons" fontFamily="iconfont"
					size="30">{{ '&#xe600;' }}</uni-icons>
			</view>
			<view class="player_control_icon" @click="updatePlayerControlState">
				<uni-icons class="icons" v-if="playerControlState == 0" fontFamily="iconfont"
					size="35">{{ '&#xe621;' }}</uni-icons>
				<uni-icons class="icons" v-if="playerControlState == 1" fontFamily="iconfont"
					size="35">{{ '&#xe662;' }}</uni-icons>
			</view>
			<view class="player_control_icon" @click="playerAfter"><uni-icons class="icons" fontFamily="iconfont"
					size="30">{{ '&#xea76;' }}</uni-icons>
			</view>
			<view class="player_control_icon" @click="musicList"><uni-icons class="icons" fontFamily="iconfont"
					size="25">{{ '&#xe75f;' }}</uni-icons>
			</view>
		</uni-row>
		<!-- 普通弹窗 -->
		<uni-popup v-if="props && props.name && props.parentPath" ref="popup" background-color="#fff">
			<view class="popup-content">
				<MusicList :name="props.name" :path="props.parentPath" source="player" @select="selectMusic">
				</MusicList>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
	import {
		watch,
		defineProps,
		defineEmits,
		ref,
		computed,
		onMounted,
		onUnmounted,
		getCurrentInstance
	} from 'vue'

	import {
		useSongSheetListStore,
		usePlayMusicInfoStore,
		useAppStore
	} from '../../stores/index'

	import {
		useNotificationStore
	} from '../../stores/notification'

	import {
		useAudioManagerStore
	} from '../../stores/audioManager'

	import {
		getNextIndex,
		secondsToMinutes,
		formatToMilliseconds
	} from '@/utils/utils.js'

	import MusicList from '../MusicList/MusicList.vue';

	const props = defineProps({
		source: {
			type: String,
			default: 'index'
		},
		isShowTime: {
			type: Boolean,
			default: true,
		},
		isShowMusicName: {
			type: Boolean,
			default: true,
		},
		name: {
			type: String,
			default: ''
		},
		path: {
			type: String,
			default: '',
		},
		parentPath: {
			type: String,
			default: ''
		}
	})
	let playerTime = ref({
		width: 0 + "%"
	})

	// 歌曲信息
	let songInfo = ref({
		name: '没有播放记录..........................',
		song: '',
		singer: '',
		path: '',
		parentPath: ''
	})
	// 父级路径
	let parentPath = ref('')
	// 总时长
	let timeTotal = ref('00:00')
	// 当前时长
	let timeCurrent = ref('00:00')
	// 当前状态
	let isNowPlay = ref('pause')
	// 播放状态控制
	let playerControlState = ref(0)
	// 音乐列表
	let fileList = ref([])
	// 音乐索引
	let musicIndexes = ref(0)
	// 应用状态
	let appData = useAppStore().getStoreData
	// 播完之后是否还播放
	let isContinue = ref(true)
	// 事件
	const emit = defineEmits(['details', 'slide']);
	// 弹出层
	const popup = ref()
	// 进度条宽度
	const bgtotalWidth = ref(0)
	// 进度条距离左边边界距离
	const bgtotalLeft = ref(0)
	// 歌曲播放异常指针，当等于2 则停止自动播放
	const errorIndex = ref(0)
	// 查询组件
	const instance = getCurrentInstance();
	const query = uni.createSelectorQuery().in(instance.proxy);
	// #ifdef APP-PLUS
	// 音频系统组件
	const innerAudioContext = useAudioManagerStore().getStoreData.value.audioContext
	// #endif
	// 颜色
	let SETUP_STYLE = computed(() => {
		return useAppStore().getSetupColor
	})

	// 方法
	const events = {
		'onCanplay': null,
		'onError': null,
		'onTimeUpdate': null,
		'onPause': null,
		'onEnded': null
	}
	// 监听
	const monitor = {
		'musicNotificationPause': null,
		'musicNotificationPrevious': null,
		'musicNotificationNext': null,
		'musicSeekTo': null,
		'musicLifecycle': null,
		'musicNotificationFavourite': null,
		'musicNotificationClose': null
	}
	// #ifdef APP-PLUS
	// 系统通知组件
	let musicNotification = useNotificationStore().getStoreData.value.notification;
	// #endif
	// 音频进入可播放状态
	events.onCanplay = async () => {
		try {
			timeTotal.value = secondsToMinutes(innerAudioContext.duration)
			console.log(props.source, '音频进入可播放状态', timeTotal.value, innerAudioContext.duration,
				innerAudioContext
				.src)
			// 更新状态栏
			await useNotificationStore().updateNotification(songInfo.value)

			if (isNowPlay.value === 'pause') {
				innerAudioContext.pause()
				console.log(props.source, '暂停', isNowPlay.value)
				musicNotification.playOrPause(false)
				playerControlState.value = 0
			} else {
				innerAudioContext.play()
				console.log(props.source, '播放', isNowPlay.value)
				musicNotification.playOrPause(true)
				playerControlState.value = 1
			}
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '音频进入可播放状态异常：', e)
		}
	}
	// 音频播放进度更新事件
	events.onTimeUpdate = (res) => {
		timeCurrent.value = secondsToMinutes(innerAudioContext.currentTime)
		playerTime.value.width = (innerAudioContext.currentTime / innerAudioContext.duration * 100).toFixed(1)
	}
	// 音频暂停事件
	events.onPause = (res) => {
		// 后台播放被打断
		if (!appData.value.appActiva) {
			playerControlState.value = 0;
			musicNotification.playOrPause(false)
			musicNotification.setPosition(Number((innerAudioContext.currentTime * 1000).toFixed(0)));
			console.log(props.source, '后台播放被打断', appData.value.appActiva, playerControlState.value,
				res)
		}
	}

	// 音频自然结束事件
	events.onEnded = async (res) => {
		console.log(props.source, '歌曲自然播放结束', res)
	}

	// 播放异常事件事件
	events.onError = (res) => {
		console.log(props.source, '歌曲播放异常', res)
		// 歌曲播放异常指针，当等于2 则停止播放下一曲
		if (errorIndex.value < 2) {
			errorIndex.value = errorIndex.value + 1
			playerAfter()
		}
	}

	// 监听暂停或播放按钮事件回调
	monitor.musicLifecycle = (e) => {
		console.log(props.source, "生命周期事件", e);
	};

	// 监听暂停或播放按钮事件回调
	monitor.musicNotificationPause = (e) => {
		console.log(props.source, "暂停或播放按钮事件回调", e);
		updatePlayerControlState()
	};

	// 监听播放上一首按钮事件回调
	monitor.musicNotificationPrevious = (e) => {
		console.log(props.source, "播放上一首按钮事件回调", e);
		playerBefore()

	};
	// 监听播放下一首按钮事件回调
	monitor.musicNotificationNext = (e) => {
		console.log(props.source, "播放下一首按钮事件回调", e);
		playerAfter()
	};

	// 通知栏进度条拖动事件回调
	monitor.musicSeekTo = (e) => {
		console.log(props.source, "通知栏进度条拖动事件回调", e);
		innerAudioContext.seek(e.position)
		// 如果暂停状态调整进度条则手动处理
		if (playerControlState.value == 0) {
			timeCurrent.value = secondsToMinutes(e.position)
			playerTime.value.width = (e.position / innerAudioContext.duration * 100).toFixed(1)
			console.log(props.source, "手动调整进度条")
		}
	};
	// 自然结束事件不能稳定触发，所以改为手动监听
	watch(() => playerTime.value.width, async (newValue, oldValue) => {
		// 当进度条等于100%时
		if (playerTime.value.width && playerTime.value.width >= 99.5) {
			console.log(props.source, '音频自然结束监听版')
			try {
				// 如果播完后不播了直接返回
				if (!isContinue.value) {
					console.log(props.source, '定时播放触发')
					// 暂停播放
					updatePlayerControlState({}, 'pause')
					return
				}
				musicIndexes.value = getNextIndex(musicIndexes.value, fileList.value.length, playerState
					.value,
					'increase')
				if (playerState.value === 0 || playerState.value === 2) {
					// 变更当前数据后会触发监听。[如果随机到同一个数该如何？]
					usePlayMusicInfoStore().setStoreData(fileList.value[musicIndexes.value])
				} else {
					console.log(props.source, '单曲循环')
					// 更新数据
					let item = fileList.value[musicIndexes.value]
					// 设置播放路径
					innerAudioContext.src = item.path
					// 设置歌曲信息
					songInfo.value = item
					// 更新通知栏数据
					await useNotificationStore().updateNotification(item)
				}
			} catch (e) {
				//TODO handle the exception
				console.log(props.source, e)
			}
		}
	})
	// 监听歌单路径变化
	watch(() => props.path, (newValue, oldValue) => {
		try {
			// 当props的数据发生变化时，执行相应的逻辑
			console.log(props.source, '监听到watch数据变化', newValue, oldValue)
			if (newValue != oldValue) {
				songContent('automatic', 'play')
			}

		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '监听异常', e)
		}
	});

	// 监听播放设置
	// #ifdef APP-PLUS
	watch(() => appData.value.setup.play, (newValue, oldValue) => {
		if (newValue != oldValue) {
			getMusicPosition()
		}
	});
	// #endif
	// 
	onMounted(() => {
		try {
			// 初始化
			console.log(props.source, '激活')
			// #ifdef APP-PLUS
			// 设置激活组件名
			useAudioManagerStore().setActivation(props.source)
			// 设置监听方法
			useAudioManagerStore().setEvents(props.source, events)
			// 设置激活组件名
			useNotificationStore().setActivation(props.source)
			// 设置监听方法
			useNotificationStore().setEvents(props.source, monitor)
			// 获取布局信息
			query
				.select("#bgtotal")
				.boundingClientRect((data) => {
					// console.log("得到布局位置信息" + JSON.stringify(data));
					// console.log("节点离页面顶部的距离为" + data.top);
					bgtotalWidth.value = Number(data.width.toFixed(2))
					bgtotalLeft.value = Number(data.left.toFixed(2))
				})
				.exec();
			// 当当前播放器存在音乐播放时初始化将不更新
			if (!innerAudioContext.src || innerAudioContext.src === '') {
				// 歌单以及播放信息
				songContent('manual', 'pause')
				console.log(props.source, '歌单以及播放信息执行')
			} else {
				// 不更新内容，则要找到位置
				getMusicPosition()
				// 设置歌曲信息
				songInfo.value = fileList.value[musicIndexes.value]
				// 当前进度条
				timeCurrent.value = secondsToMinutes(innerAudioContext.currentTime)
				playerTime.value.width = (innerAudioContext.currentTime / innerAudioContext.duration * 100)
					.toFixed(1)
				// 设置总进度长度
				timeTotal.value = secondsToMinutes(innerAudioContext.duration)
				//当前状态来控制播放器状态
				let state = innerAudioContext.paused ? 'pause' : 'play'
				console.log(props.source, '是否继续播放', state)
				updatePlayerControlState({}, state)
			}
			// #endif
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '初始化异常')
		}
	})

	const musicDetails = () => {
		emit('details');
	}
	// 控制歌单详情内容 automatic/manual play/pause
	const songContent = (pattern, state) => {
		// 获取歌单
		try {
			// 寻找位置
			getMusicPosition()
			// 设置播放路径
			innerAudioContext.src = props.path
			// 设置歌曲信息
			songInfo.value = usePlayMusicInfoStore().getStoreData.value;
			// 更新状态:自动
			if (pattern === 'automatic') {
				updatePlayerControlState({}, state)
			}
			// 更新状态:手动
			if (pattern === 'manual') {
				isNowPlay.value = state
			}
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, e)
		}
	}
	// 找到歌曲位置
	const getMusicPosition = () => {
		try {
			if (parentPath.value != props.parentPath) {
				let songSheetList = useSongSheetListStore().getStoreData.value || [];
				// 播放所有歌单内容
				if (appData.value.setup.play === 'all') {
					fileList.value = songSheetList[0].list
				} else {
					// 在集合中找到该歌单
					for (let i = 0; i < songSheetList.length; i++) {
						let item = songSheetList[i]
						if (item.path === props.parentPath) {
							fileList.value = songSheetList[i].list
							break;
						}
					}
				}
				parentPath.value = props.parentPath
			}

			// 在歌单中找到播放曲目的位置信息
			for (let i = 0; i < fileList.value.length; i++) {
				let item = fileList.value[i]
				if (item.path === props.path) {
					musicIndexes.value = i
					break;
				}
			}
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, "寻找歌曲位置失败", e)
		}
	}
	// 控制器状态:暂停，播放
	const playerControlStates = ['&#xe662;', '&#xe621;']

	/**
	 * 控制播放器与通知栏的状态
	 */
	const updatePlayerControlState = (obj, state) => {
		// #ifdef APP-PLUS
		try {
			if (state && state !== '') {
				// 不是播放就是暂停
				playerControlState.value = state === 'play' ? 1 : 0;
			} else {
				playerControlState.value = playerControlState.value >= 1 ? 0 : playerControlState.value + 1
			}
			// 通知播放或者暂停事件
			musicNotification.setPosition(Number((innerAudioContext.currentTime * 1000).toFixed(0)));
			console.log(props.source, '控制器', playerControlState.value, state)
			if (playerControlState.value == 0) {
				// 后续可以继续播放
				isContinue.value = true
				isNowPlay.value = 'pause'
				innerAudioContext.pause()
				musicNotification.playOrPause(false)
			} else {
				isNowPlay.value = 'play'
				innerAudioContext.play()
				musicNotification.playOrPause(true)
			}
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '控制器异常', e)
		}
		// #endif
	}

	// 播放状态：随机，单曲循环，列表循环
	const playerStates = ['&#xe60e;', '&#xea75;', '&#xe6bd;']
	let playerState = ref(0)
	const updatePlayerState = () => {
		playerState.value = playerState.value >= 2 ? 0 : playerState.value + 1
	}

	// 控制上一曲
	const playerBefore = () => {
		musicIndexes.value = getNextIndex(musicIndexes.value, fileList.value.length, playerState.value, 'reduce')
		let item = fileList.value[musicIndexes.value]
		// 更新数据
		usePlayMusicInfoStore().setStoreData({
			name: item.name,
			path: item.path,
			song: item.song,
			singer: item.singer,
			parentPath: item.parentPath,
		})
	}

	//控制下一曲
	const playerAfter = () => {
		musicIndexes.value = getNextIndex(musicIndexes.value, fileList.value.length, playerState.value, 'increase')
		let item = fileList.value[musicIndexes.value]
		console.log(props.source, '下一曲', item, musicIndexes.value, fileList.value.length)
		// 更新数据
		usePlayMusicInfoStore().setStoreData({
			name: item.name,
			path: item.path,
			song: item.song,
			singer: item.singer,
			parentPath: item.parentPath,
		})
	}

	// 播完后是否还播放
	const setContinue = (state) => {
		if (typeof state === 'boolean') {
			isContinue.value = state
		}
	}

	//列表
	const musicList = () => {
		if (popup && popup.value) {
			popup.value.open('bottom')
		}
	}

	// 列表选择音乐
	const selectMusic = (item) => {
		if (popup && popup.value) {
			popup.value.close()
		}
	}

	// 滑动进度条
	const slideSpeed = (event) => {
		try {
			// 当前位置
			let nowPosition = (event.detail.x - bgtotalLeft.value).toFixed(2)
			nowPosition = nowPosition < 0 ? 0 : nowPosition
			// 占比
			const proportion = (nowPosition / bgtotalWidth.value * 100).toFixed(1)
			playerTime.value.width = proportion
			// 设置
			const position = (proportion / 100 * innerAudioContext.duration).toFixed(1)
			timeCurrent.value = secondsToMinutes(position)
			innerAudioContext.seek(position)
			emit('slide');
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '进度条异常', e)
		}
		// console.log(event.detail.x, bgtotalLeft.value, bgtotalWidth.value, proportion, position)
	}

	/**
	 * 手动设置播放时间
	 * 
	 * @param {String} time 事件 格式为：00:00.000
	 */
	const setSpeed = (time) => {
		if (!time || time == '') {
			console.error('字符串格式错误')
			return
		}
		try {
			const position = formatToMilliseconds(time)
			innerAudioContext.seek(position)
			timeCurrent.value = secondsToMinutes(position)
			playerTime.value.width = (position / innerAudioContext.duration * 100).toFixed(1)
		} catch (e) {
			//TODO handle the exception
			console.log(props.source, '手动设置播放时间失败')
		}
	}
	// 暴露可调用的方法
	defineExpose({
		setContinue,
		setSpeed
	})
</script>

<style lang="scss">
	.player {
		width: 100%;

		&_name {
			margin-bottom: 1rem;

			&_song {
				font-size: 1rem;
				height: 2.2rem;
				line-height: 2.2rem;
				text-align: left;
				margin-bottom: 0rem !important;
				color: var(--playerSongColor) !important;
				overflow: hidden;
				text-overflow: ellipsis;
				padding-left: 0rem !important;
				padding-right: 0rem !important;
			}

			&_singer {
				font-size: 0.7rem;
				color: var(--playerSingerColor);
			}
		}

		&_time {
			width: 100%;


			&_bg {
				width: 100%;
				background-color: rgba(44, 44, 44, .2);
				height: .2rem;
				z-index: 1;
				position: absolute;
				border-radius: .3rem;
				margin-left: 0.2rem;
				margin-right: 0.2rem;
			}

			&_bgtotal {
				width: 100%;
				background-color: rgba(44, 44, 44, 0);
				height: .2rem;
				z-index: 3;
				position: absolute;
				border-radius: .3rem;
				margin-left: 0.2rem;
				margin-right: 0.2rem;
			}

			&_dynamic {
				width: 0%;
				background-color: var(--playerColor);
				height: .2rem;
				z-index: 2;
				// border-radius: .3rem;
				border-top-left-radius: 0.3rem;
				border-bottom-left-radius: 0.3rem;
				text-align: center;
				position: absolute;
				display: flex;
				justify-content: center;
				align-items: center;
				align-content: space-around;
			}

			.player_time_dynamic::after {
				content: " ";
				width: .5rem;
				height: .5rem;
				left: 100%;
				display: table;
				font-size: 1rem;
				border-radius: 50%;
				position: absolute;
				background-color: var(--playerColor);
			}

			&_info {
				margin-top: .4rem;
				display: flex;
				justify-content: space-between;
				align-items: center;
				align-content: center;
			}

			&_current {
				font-size: .5rem;
				color: var(--playerColor);
			}

			&_total {
				font-size: .5rem;
				color: var(--playerColor);
			}
		}

		&_control {
			display: flex;
			justify-content: space-between;
			align-items: center;
			align-content: center;
			flex-wrap: nowrap;
			margin-top: .5rem;

			&_icon {
				color: var(--playerColor);
				width: 20%;
				text-align: center;

				.icons {
					color: var(--playerColor) !important;
				}
			}
		}

		.popup-content {
			align-items: center;
			justify-content: center;
			padding: 15px;
			height: 25rem;
			background-color: #fff;
			overflow: hidden;
		}
	}
</style>