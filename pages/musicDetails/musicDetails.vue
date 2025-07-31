<template>
	<view class="music">
		<view class="music_info">
			<lyric ref="lyricRef" :name="playerSongInfo.name" :path="playerSongInfo.path" @selectLyric="selectLyric">
			</lyric>
		</view>
		<view class="music_player">
			<player ref="playerRef" source="details" :name="playerSongInfo.name" :path="playerSongInfo.path"
				:parentPath="playerSongInfo.parentPath" @slide="slideSpeed">
			</player>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		watch,
		onMounted
	} from 'vue'
	import lyric from '../../components/lyric/lyric.vue';
	import player from '../../components/player/player.vue';
	import {
		useAppStore,
		useSongSheetListStore,
		useSongSheetStore,
		usePlayMusicInfoStore,
		useStatisticsInfoStore
	} from '../../stores/index'
	// 当前播放歌单信息
	let playerSongInfo = usePlayMusicInfoStore().getStoreData
	// 应用信息
	let appData = useAppStore().getStoreData
	// 播放器
	let playerRef = ref(null)
	// 歌词
	let lyricRef = ref(null)
	// 定时器
	const timerInterval = ref()

	// 监听定时播放
	// #ifdef APP-PLUS
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
					plus.push.createMessage('定时完成，播放完当前曲目后将暂停播放');
					// 清除定时器
					clearInterval(timerInterval.value)
				}
			}, 2000)
		}
	});
	// #endif

	// 监听双击歌词事件
	const selectLyric = (item) => {
		if (playerRef && playerRef.value && lyricRef && lyricRef.value) {
			// 设置时间
			playerRef.value.setSpeed(item.time)
			// 同步滚动歌词
			lyricRef.value.rollLyric()
		}
	}

	// 手动滚动滑动条
	const slideSpeed = () => {
		if (lyricRef && lyricRef.value) {
			// 同步滚动歌词
			lyricRef.value.rollLyric()
		}
	}
</script>

<style lang="scss">
	@import "@/css/music_info.scss";
</style>