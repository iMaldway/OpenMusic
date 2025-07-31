<template>
	<view class="hd_index">
		<view class="content">
			<uni-row class="content_logo">
				<uni-col :span="24">OpenMusic | {{ timeState }} </uni-col>
			</uni-row>
			<uni-row class="overview">
				<uni-col :span="6" class="overview_centered">
					<!-- <view class="iconfont overview_music" @click="openMusicDetails">&#xe601;</view> -->
					<image mode="widthFix" class="overview_music" @click="openMusicDetails"
						src="../../static/image/largeLogo.png">
					</image>
				</uni-col>
				<uni-col :span="18" class="overview_projectData">
					<uni-row class="overview_data">
						<uni-col :span="24">
							<view class="overview_number">{{statisticsInfo.song}}</view>
							<view class="overview_project">song</view>
						</uni-col>
					</uni-row>
					<uni-row class="overview_data">
						<uni-col :span="24">
							<view class="overview_number">{{statisticsInfo.singer}}</view>
							<view class="overview_project">singer</view>
						</uni-col>
					</uni-row>
					<uni-row class="overview_data">
						<uni-col :span="24">
							<view class="overview_number">{{statisticsInfo.type}}</view>
							<view class="overview_project">type</view>
						</uni-col>
					</uni-row>
				</uni-col>
			</uni-row>
			<view class="sheet_menu_row">
				<view class="sheet_menu" @click="playerMod">
					<view>
						<uni-icons class="sheet_menu_icon" type="settings" size="20"></uni-icons>
					</view>
					<view class="sheet_text">
						播放设置
					</view>
				</view>
				<view class="sheet_menu" @click="newMusicSong">
					<view>
						<uni-icons class="sheet_menu_icon" type="plusempty" size="20"></uni-icons>
					</view>
					<view class="sheet_text">
						新建歌单
					</view>
				</view>
				<view class="sheet_menu" @click="openTiming">
					<view>
						<uni-icons class="sheet_menu_icon" type="notification" size="20"></uni-icons>
					</view>
					<view class="sheet_text">
						定时播放
					</view>
				</view>
			</view>
			<uni-row class="player_show">
				<uni-col :span="24">
					<player v-if="isShowPlayer" ref="playerRef" @details="openMusicDetails" :name="playerSongInfo.name"
						:path="playerSongInfo.path" :parentPath="playerSongInfo.parentPath">
					</player>
				</uni-col>
			</uni-row>
			<view class="title">本地歌单</view>
			<view class="sheet">
				<uni-swipe-action class="sheet_list">
					<!-- 使用插槽 （请自行给定插槽内容宽度）-->
					<uni-swipe-action-item v-for="item in musicList" :key="item.path">
						<view class="sheet_item" @click="openMusicList(item)">
							<uni-icons class="sheet_item_icon icon_file" fontFamily="iconfont"
								size="20">{{ '&#xe637;' }}</uni-icons>
							<view class="sheet_item_right">
								<view class="sheet_item_name">{{item.name}}
								</view>
								<view class="sheet_item_path">{{item.path.replace("file:///storage/emulated/0", "")}}
								</view>
							</view>
						</view>
						<template v-slot:right>
							<view class="sheet_item_delete" @click="deleteSheet(item)"><uni-icons type="trash"
									color="red" size="20"></uni-icons>
							</view>
						</template>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>
		</view>
		<match-media v-if="HDinfo.landscape && HDinfo.matches" :min-width="1200" orientation="landscape"
			class="hd_lyric">
			<view class="music_info">
				<lyric ref="lyricRef" :name="playerSongInfo.name" :path="playerSongInfo.path"
					@selectLyric="selectLyric">
				</lyric>
			</view>
		</match-media>
	</view>

</template>

<script setup>
	import {
		ref,
		watch,
		onMounted,
		onBeforeUnmount,
		getCurrentInstance
	} from 'vue'
	import {
		onShow
	} from '@dcloudio/uni-app'
	import lyric from '@/components/lyric/lyric.vue';
	import player from '@/components/player/player.vue';
	import OpenFile from '@/components/OpenFile/OpenFile.vue';
	import {
		useAppStore,
		useSongSheetListStore,
		useSongSheetStore,
		usePlayMusicInfoStore,
		useStatisticsInfoStore
	} from '@/stores/index'

	import {
		useNotificationStore
	} from '@/stores/notification'

	import {
		GetMusicFileForPath
	} from '@/utils/file.js'

	let addMusicUrl = ref({
		color: '#4cd964',
		size: '22',
		type: 'plusempty'
	})

	const instance = getCurrentInstance();
	const that = instance.proxy;

	let playerNote = ref('播放所有歌单内容')

	// 定时状态
	let timeState = ref('音乐无界')
	// 统计信息
	let statisticsInfo = useStatisticsInfoStore().getStoreData
	// 当前播放歌单信息
	let playerSongInfo = usePlayMusicInfoStore().getStoreData
	// 本地歌单合集
	let musicList = useSongSheetStore().getStoreData
	// 本地所有歌单详细信息
	let musicAllList = useSongSheetListStore().getStoreData
	// 应用信息
	let appData = useAppStore().getStoreData
	// 播放器
	let playerRef = ref(null)
	// 歌词组件
	let lyricRef = ref(null)
	// 显示播放器
	let isShowPlayer = ref(true)
	// 定时器
	const timerInterval = ref()
	// 屏幕监听
	let mediaQueryOb = ref()
	// 是否是横屏
	let landscapeOb = ref()
	//hd
	let HDinfo = ref({
		matches: false,
		landscape: false,
		mediaQueryOb: null
	})

	onShow(() => {
		isShowPlayer.value = true
	})

	// 监听屏幕方向以及宽度
	onMounted(() => {
		mediaQueryOb.value = uni.createMediaQueryObserver(that)
		landscapeOb.value = uni.createMediaQueryObserver(that)
		mediaQueryOb.value.observe({
			minWidth: 1200, //页面最小宽度 1200px
		}, matches => {
			HDinfo.value.matches = matches;
		})
		console.log("监听")
		// 是否是横屏
		landscapeOb.value.observe({
			orientation: 'landscape' //屏幕方向为纵向
		}, matches => {
			HDinfo.value.landscape = matches
		})
	})

	onBeforeUnmount(() => {
		if (mediaQueryOb.value && mediaQueryOb.value !== null && mediaQueryOb.value.disconnect) {
			mediaQueryOb.disconnect()
		}
		if (landscapeOb.value && landscapeOb.value !== null && landscapeOb.value.disconnect) {
			landscapeOb.disconnect()
		}
	})

	// 监听定时播放
	watch(() => appData.value.timing, (newValue, oldValue) => {
		// 只有在开启定时的时候才触发
		if (appData.value.isTiming) {
			// 先清除之前的，只保留最后一次变更时间
			clearInterval(timerInterval.value)
			// 定时器2秒执行一次
			timerInterval.value = setInterval(() => {
				const nowTime = new Date().getTime()
				// 如果当前时间大于等于定时的时间则结束定时
				if (nowTime >= appData.value.timing) {
					useAppStore().setStoreData('isTiming', false)
					useAppStore().setStoreData('timingRecord', 0)
					useAppStore().setStoreData('timing', 0)
					useAppStore().setStoreData('timingIndex', 0)
					// 暂停音乐，播完当前内容
					playerRef.value.setContinue(false)
					// #ifdef APP-PLUS
					plus.push.createMessage('定时完成，播放完当前曲目后将暂停播放');
					// #endif
					// 清除定时器
					clearInterval(timerInterval.value)
				}
			}, 2000)
		}
	});

	const playerMod = () => {
		uni.navigateTo({
			url: '/pages/setup/setup',
			animationType: 'slide-in-left'
		})
	}


	// 点击进入歌单列表
	const openMusicList = (item) => {
		uni.navigateTo({
			url: '/pages/musicList/musicList',
			success: function(res) {
				// 通过eventChannel向被打开页面传送数据
				res.eventChannel.emit('setDataToMusicList', item)
			}
		})
	}

	// 点击删除歌单
	const deleteSheet = (item) => {
		console.log('点击删除歌单')
		// 删除歌单信息
		useSongSheetStore().updateStoreData((data) => {
			return data.value.filter(i => i.path !== item.path);
		})
		// 删除歌单集合
		useSongSheetListStore().updateStoreData((data) => {
			return data.value.filter(i => i.path !== item.path);
		})
	}
	// 定时播放
	const openTiming = () => {
		uni.navigateTo({
			url: '/pages/timing/timing'
		})
	}
	// 打开音乐详情页面
	const openMusicDetails = () => {
		// 宽度大于1200并且是横屏不进入详情页
		if (HDinfo.value.matches && HDinfo.value.landscape) {
			return
		}
		// 清理当前页面的播放器信息
		uni.navigateTo({
			url: '/pages/musicDetails/musicDetails',
			success: () => {
				isShowPlayer.value = false
			}
		})
	}
	//点击新建歌单
	const newMusicSong = () => {
		uni.navigateTo({
			url: '/components/OpenFile/OpenFile',
			events: {
				// 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
				acceptDataFromOpenedPage: function(data) {
					// 获取上个页面传递过来的数据
					uni.showModal({
						title: '提示',
						content: data.data,
						editable: true,
						placeholderText: '为歌单取个名字',
						success: async function(res) {
							if (res.confirm) {
								try {
									const value = useSongSheetStore().getStoreData.value;
									if (value) {
										// 判断是否存在相同的路径
										let isAllTrue = value.every((currentValue) => {
											return currentValue.path !== data
												.data;
										});
										// 不存在相同路径则添加
										if (isAllTrue) {
											value.push({
												path: data.data,
												name: res.content
											})
											useSongSheetStore().setStoreData(value)
											GetMusicFileForPath(data.data, res.content)
										} else {
											uni.showToast({
												icon: "none",
												title: '此路径已经添加过',
												duration: 2000
											});
										}
									} else {
										// 这里是第一个歌单创建的时机
										useSongSheetStore().setStoreData([{
											path: data.data,
											name: res.content
										}])
										// 获取此路径下所有歌曲并设置播放歌曲信息
										const musicList = await GetMusicFileForPath(data
											.data, res
											.content)
										if (musicList && musicList.length) {
											// 随机选取一首歌曲
											const nextIndex = Math.floor(Math.random() * (
												musicList.length - 1));
											usePlayMusicInfoStore().setStoreData({
												name: musicList[nextIndex].name,
												path: musicList[nextIndex].path,
												song: musicList[nextIndex].song,
												singer: musicList[nextIndex].singer,
												parentPath: data.data
											})
										} else {
											console.error(res)
										}
									}
								} catch (e) {
									// error
									console.log(e)
								}
							}
						}
					});
				}
			},
			success: function(res) {
				// 通过eventChannel向被打开页面传送数据
				res.eventChannel.emit('acceptDataFromOpenerPage', {
					openFilePath: ''
				})
			}
		});
	}

	// 监听双击歌词事件
	const selectLyric = (item) => {
		if (playerRef && playerRef.value && lyricRef && lyricRef.value) {
			// 设置时间
			playerRef.value.setSpeed(item.time)
			// 同步滚动歌词
			lyricRef.value.rollLyric()
		}
	}
</script>

<style lang="scss">
	@import "@/css/music_info.scss";

	.uni-page-body {
		height: 100% !important;
		background-color: #f5f5f5;
	}

	.content {
		position: absolute;
		bottom: 0;
		top: 0;
		padding: 1rem;
		padding-top: 4rem;
		height: 100% !important;
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: flex-start;
		align-items: center;
		background-color: #f5f5f5;

		&_logo {
			width: 100%;
			height: 2rem;
			color: #333;
		}
	}

	.title {
		color: #333;
		margin-top: 1rem;
		margin-left: 0.4rem;
		margin-bottom: 1rem;
		text-align: left;
		font-size: .9rem;
	}

	.overview {
		position: relative;
		margin-top: 1rem;
		width: 100%;
		background-color: #fff;
		border-radius: 1rem;

		&_centered {
			height: 4rem;
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
		}

		&_music {
			color: #fff;
			width: 2.5rem;
			height: 2.5rem;
			font-size: 1.5rem;
			border-radius: 50%;
			// border: 0.1rem solid #2c2c2c;
			box-shadow: 0px 0px 8px #c8c8c8;
			text-align: center;
			// background-color: rgba(44, 44, 44, 1);
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;

			// animation: overviewMusic 3s linear infinite;
		}

		@keyframes overviewMusic {
			from {
				transform: rotate(0deg);
			}

			to {
				transform: rotate(360deg);
			}
		}

		&_projectData {
			padding-left: 1rem !important;
			padding-right: 1rem !important;
			height: 4rem;
			display: flex;
			flex-wrap: nowrap;
			align-content: flex-end;
			justify-content: flex-start;
			align-items: flex-end;
			// padding-bottom: .4rem;
			// background-color: rgba(255, 255, 255, 1);
			// border-radius: .3rem;
			// box-shadow: 0px 0px 3px #000
		}

		&_data {
			width: 4rem;
			text-align: center;
			display: flex;
			flex-wrap: wrap;
			align-content: space-around;
			justify-content: flex-start;
			align-items: center;
			padding-bottom: .7rem;
		}

		&_number {
			// font-style: italic;
			font-size: 1.2rem;
		}

		&_project {
			font-size: .5rem;
			color: rgba(44, 44, 44, .8);
		}
	}

	.sheet_menu_row {
		width: 100%;
		height: 6rem;
		margin-top: 1rem;
		display: flex;
		align-content: flex-start;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		flex-direction: column;
		background-color: #fff;
		border-radius: 1rem;
		padding-top: 0.4rem;
		padding-left: 0.7rem;
	}

	.sheet {
		width: 100%;
		background-color: #fff;
		border-radius: 1rem;
		border: #fff solid 1rem;
		height: calc(100% - 27.3rem);
		overflow: auto;

		&_list {
			padding: 0.6rem;
		}

		&_menu {
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
			flex-wrap: wrap;
			flex-direction: column;
			width: 4rem;
			margin-right: 0.8rem;
			text-align: center;
			cursor: pointer;
		}

		&_menu_icon {
			background-color: rgba(44, 44, 44, 0.8);
			// border: 0.15rem solid #ccc;
			// box-shadow: 0px 0px 9px #ccc;
			border-radius: .3rem;
			width: 2.5rem;
			height: 2.5rem;
			display: flex;
			color: #fff !important;
			align-content: center;
			justify-content: center;
			align-items: center;
		}

		&_text {
			margin-top: 0.5rem;
			font-size: 0.8rem;
			color: #666;
		}

		&_icon {
			background-color: rgba(44, 44, 44, .2);
			border-radius: .3rem;
			width: 2.5rem;
			height: 2.5rem;
			margin-right: 1rem;
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
		}

		.icon_file {
			background-color: rgba(231, 195, 87, 0.8);
			color: #fff !important;
		}

		&_item {
			display: flex;
			align-content: center;
			justify-content: flex-start;
			align-items: center;
			padding-bottom: 1rem;
			// border-bottom: 0.1rem solid #cccccc;

			&_icon {
				background-color: rgba(44, 44, 44, .2);
				border-radius: .3rem;
				width: 2.5rem;
				height: 2.5rem;
				margin-right: 1rem;
				display: flex;
				align-content: center;
				justify-content: center;
				align-items: center;
			}

			&_right {
				width: calc(100% - 3.5rem);
			}

			&_name {
				width: 100%;
			}

			&_path {
				font-size: 0.8rem;
				color: #999;
				width: 90%;
				margin-right: 10%;
				overflow: hidden;
				text-overflow: ellipsis;
				position: relative;
			}

			&_path::after {
				content: "...";
				color: #999;
				font-size: 0.8rem;
				width: 1rem;
				height: 1rem;
				position: absolute;
				right: -1rem;
				top: 0;
			}

			&_delete {
				display: flex;
				align-content: center;
				justify-content: center;
				align-items: center;
				margin-right: 1rem;
				color: red !important;
			}
		}
	}

	.player_show {
		width: 100%;
		height: 9rem;
		margin-top: 1rem;
		background-color: #fff;
		border-radius: 1rem;
		padding-left: 2rem;
		padding-right: 2rem;
		padding-top: 2rem;
		padding-bottom: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
		align-content: center;
	}


	/* 横屏且宽度至少为 768px 的设备 */
	@media screen and (orientation: landscape) and (min-width: 1200px) {

		.hd_index {
			position: absolute;
			bottom: 0;
			top: 0;
			// padding: 1rem;
			// padding-top: 4rem;
			height: 100% !important;
			width: 100% !important;
			display: flex;
			display: flex;
			justify-content: space-around;
			align-items: center;
			align-content: center;
		}

		.content {
			position: relative;
			width: 50%;
		}

		.music_info {
			position: relative;
			width: 100%;
			overflow-x: hidden;
			height: 100%;
			padding-right: 2rem;
			border-radius: 1rem;
			background-color: #fff;
		}
	}
</style>