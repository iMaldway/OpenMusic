<template>
	<view class="musicList">
		<uni-search-bar class="musicList_search" @confirm="search" v-model="searchValue" @input="inputSearch">
		</uni-search-bar>
		<view class="musicList_list">
			<scroll-view class="musicList_list_scroll" scroll-y="true" scroll-with-animation>
				<uni-list v-show="fileList.length>0 && searchValue == ''">
					<uni-list-item v-for="item in fileList" :title="item.name" clickable @click="selectItem(item)">
						<template v-slot:header>
							<uni-icons class="musicList_icon" fontFamily="iconfont"
								size="20">{{ "&#xe637;" }}</uni-icons>
						</template>
					</uni-list-item>
				</uni-list>
				<uni-list class="musicList_list" v-show="searchList.length>0 && searchValue != ''">
					<uni-list-item v-for="item in searchList" :title="item.name" clickable @click="selectItem(item)">
						<template v-slot:header>
							<uni-icons class="musicList_icon" fontFamily="iconfont"
								size="20">{{ "&#xe637;" }}</uni-icons>
						</template>
					</uni-list-item>
				</uni-list>
			</scroll-view>
		</view>
		<Load :isShow="fileList.length<=0"></Load>
	</view>
</template>

<script setup>
	import {
		ref,
		defineEmits,
		onUnmounted,
		defineProps,
		watch
	} from 'vue'

	import Load from '../Load/Load.vue';

	import {
		useSongSheetListStore,
		usePlayMusicInfoStore,
		useAppStore
	} from '../../stores/index'

	import {
		GetMusicFileForPath
	} from '@/utils/file.js'


	// 音乐列表
	let fileList = ref([])
	// 搜索
	let searchValue = ref('')
	// 搜索集合
	let searchList = ref([])
	// 事件
	const emit = defineEmits(['select']);
	// 歌曲集合
	const allSongSheetList = useSongSheetListStore().getStoreData.value;
	// 应用状态
	let appData = useAppStore().getStoreData

	const props = defineProps({
		name: {
			type: String,
			default: '',
			required: true
		},
		path: {
			type: String,
			default: '',
			required: true
		},
		source: {
			type: String,
			default: 'index'
		},
	})

	watch(() => props.path, async (newValue, oldValue) => {
		if (newValue && newValue != oldValue) {
			// 监听上个页面传递过来的数据
			if (props.path === appData.value.setup.fixedPath) {
				fileList.value = allSongSheetList[0].list
			} else {
				// 如果是首页等地方调用则重新遍历改路径的歌曲，否则则调用缓存数据以加快访问
				if (props.source == 'index') {
					const res = await GetMusicFileForPath(newValue, props.name)
					if (res && res.length) {
						fileList.value = res
					} else {
						console.error(res)
					}
				} else {
					for (let i in allSongSheetList) {
						let item = allSongSheetList[i]
						if (item.path == newValue) {
							fileList.value = item.list
							break;
						}
					}
				}
			}
		}
	}, {
		deep: true,
		immediate: true
	})

	// 输入事件
	const inputSearch = (item) => {
		if (!item || item === '') {
			return
		}
		searchList.value = fileList.value.filter((i) => {
			return i.name.includes(item)
		})
	}
	// 搜索事件
	const search = () => {
		console.log("搜索事件")
	}
	// 选择音乐
	const selectItem = (item) => {
		emit('select', item);
		usePlayMusicInfoStore().setStoreData({
			name: item.name,
			path: item.path,
			song: item.song,
			singer: item.singer,
			parentPath: props.path
		})
	}
</script>

<style lang="scss">
	.musicList {
		height: 100%;

		&_icon {
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
			margin-right: 0.5rem;
		}

		&_search {
			height: 3rem;
			background-color: #fff;

			.uni-list--border-top,
			.uni-border-top-bottom,
			.uni-list--border-bottom {
				background-color: #fff !important;

			}
		}

		&_list {
			height: calc(100% - 3rem);
			transition: height 0.5s ease;

			&_scroll {
				display: inline-block !important;
				word-break: break-all;
				white-space: normal !important;
				overflow-y: auto;
				scrollbar-width: none;
				scroll-behavior: smooth;
				height: 100%;
			}
		}
	}
</style>