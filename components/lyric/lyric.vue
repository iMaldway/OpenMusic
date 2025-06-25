<template>
	<view class="lrc" :style="SETUP_STYLE">
		<view class="lrc_info" :style="infoStyle">
			<view v-for="item in infoList" :key="item.tag" class="lrc_info_item">
				<text :class="{'ti':item.tag ==='ti','other':item.tag !='ti'}">{{ item.value }}</text>
			</view>
		</view>
		<view class="lrc_content" id="lrcContentRef" :style="contentStyle">
			<scroll-view class="lrc_content_lyric" :scroll-y="true" scroll-with-animation :scroll-top="scrollNumber">
				<view v-for="(item,index) in contentList" :key="item.time" id="lrcContentLyricItemActivation"
					class="lrc_content_lyric_item" :class="{'lrc_content_lyric_item_activation':lyricIndex==index}"
					:data-text="item.value" :data-time="item.time" @dblclick="selectLyric(item)">
					{{ item.value }}
				</view>
				<view v-show="contentList.length <= 0" class="lrc_content_lyric_no">{{ loadLyric }}</view>
				<view class="lrc_content_lyric_fill"></view>
			</scroll-view>
		</view>
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
		useAudioManagerStore
	} from '@/stores/audioManager'

	import {
		useAppStore,
		usePlayMusicInfoStore
	} from '@/stores/index'

	import {
		formatToMilliseconds
	} from '@/utils/utils.js'

	import {
		readLRC
	} from '@/utils/file.js'

	const props = defineProps({
		name: {
			type: String,
			default: '',
		},
		path: {
			type: String,
			default: '',
		}
	})
	let infoList = ref([])
	// 歌词指针
	let lyricIndex = ref(0)
	// 歌词集合
	let contentList = ref([])
	// 音乐播放器
	let audioContext = useAudioManagerStore().getStoreData.value.audioContext
	// 窗口滚动
	let scrollNumber = ref(0)
	// 窗口信息
	let lrcContentRefHeight = ref(0)
	// 一半的高度
	let halfHeight = ref(0)
	// 应用状态
	let appStore = useAppStore().getStoreData
	// 播放歌曲信息
	let playMusicInfoStore = usePlayMusicInfoStore().getStoreData
	// 时间差动态变量
	let timeDiff = ref({
		'--timeDiff': '2s'
	})
	// 歌词信息样式
	const infoStyle = computed(() => {
		let height = (infoList.value.length * 1.1 + 2) + 'rem'
		if (infoList.value.length <= 0) {
			// 歌词信息样式
			height = ' 0rem !important'
		}
		return {
			height
		}
	})
	// 歌词主体样式
	const contentStyle = computed(() => {
		let height = 'calc(100% - ' + ((infoList.value.length * 1.1) + 2) + 'rem)'
		if (infoList.value.length <= 0) {
			// 歌词主体样式
			height = ' 100% !important'
		}
		return {
			height
		}
	})
	let loadLyric = ref('歌词加载中')
	// 颜色
	let SETUP_STYLE = computed(() => {
		return {
			...useAppStore().getSetupColor,
			...timeDiff.value
		}
	})
	// 事件
	const emit = defineEmits(['selectLyric']);
	// #ifdef APP-PLUS
	const instance = getCurrentInstance();
	const query = uni.createSelectorQuery().in(instance.proxy);
	// #endif


	let exception = {
		'onCanplay': null,
		'onError': null,
		'onTimeUpdate': null,
		'onPause': null,
		'onEnded': null
	}

	// 监听歌单路径变化
	watch(() => props.path, async (newValue, oldValue) => {
		await init()
	});

	exception.onTimeUpdate = () => {
		rollLyric()
	}

	onMounted(async () => {
		// #ifdef APP-PLUS
		// 获取布局信息
		query
			.select("#lrcContentRef")
			.boundingClientRect((data) => {
				// console.log("得到布局位置信息" + JSON.stringify(data));
				// console.log("节点离页面顶部的距离为" + data.top);
				lrcContentRefHeight.value = Number(data.height.toFixed(2))
				// 0.6 总高度的60%
				halfHeight.value = Number((lrcContentRefHeight.value * 0.45).toFixed(2))
			})
			.exec();

		await init()
		// 音频播放进度更新事件
		useAudioManagerStore().setException(exception)
		// #endif
	})

	// 初始化
	const init = async () => {
		// #ifdef APP-PLUS
		// 重置
		scrollNumber.value = 0;
		lyricIndex.value = 0;
		if (appStore.value.playName === props.name) {
			loadLyric.value = '歌词加载中'
			infoList.value = appStore.value.lrcInfoList
			contentList.value = appStore.value.lrcContentList
		} else {
			let path = props.path.split('.').shift();
			let result = null
			loadLyric.value = '歌词加载中'
			// 读取歌词
			let res = await readLRC(path + '.lrc')
			// 比较原始字符串和编码后的字符串是否相同。
			// if (res && res.target && checkIfGarbled(res.target.result)) {
			// 	console.log('文本中存在常见的乱码字符。将更换utf-8编码进行读取。')
			// 	res = await readLRC(path + '.lrc', 'utf-8')
			// }
			if (res.code == 200) {
				result = res.target.result
				handleLRC(result)
				// 如果没有从歌词文件中获取到歌词
				if (infoList.value.length == 0 && contentList.value.length == 0) {
					loadLyric.value = '歌词加载失败'
				}
				// 缓存当前播放歌曲的歌词信息
				useAppStore().setStoreData('playName', props.name)
				useAppStore().setStoreData('lrcInfoList', infoList.value)
				useAppStore().setStoreData('lrcContentList', contentList.value)
			} else {
				loadLyric.value = '没有找到歌词'
				infoList.value = []
				contentList.value = []
			}
		}
		// #endif
	}
	/**
	 * 滚动歌词
	 * 
	 */
	const rollLyric = () => {
		try {
			// 找到比当前播放【默认0】最近的一条大于它的时间指针
			let index = -1;
			// 变更之前
			for (let i in contentList.value) {
				let item = contentList.value[i]
				let nowTime = formatToMilliseconds(item.time)
				if (nowTime >= audioContext.currentTime) {
					// 往回退一位
					index = i - 1 < 0 ? i : i - 1
					break
				}
			}
			// 变更之前
			lyricIndex.value = index === -1 ? contentList.value.length - 1 : index
			/**
			 * 设置动画时间
			 * 当前行数--->下一行时间数 之间的差为 当前歌词播放完需要的时间
			 * lrcContentLyricItemActivation
			 * */

			if (lyricIndex.value + 1 < contentList.value.length) {
				// 当前行数时间
				const bTime = contentList.value[lyricIndex.value] ? contentList.value[lyricIndex.value].time :
					'00:00.00'
				const nowTime = formatToMilliseconds(bTime).toFixed(1)
				// 下一行时间数
				const aTime = contentList.value[lyricIndex.value + 1] ? contentList.value[lyricIndex.value + 1]
					.time : '00:00.00'
				const afterTime = formatToMilliseconds(aTime).toFixed(1)
				// 时间差
				let timeDiffer = (afterTime - nowTime).toFixed(1)
				// 减少过渡时间
				timeDiffer = timeDiffer >= 1 ? timeDiffer - 0.4 : timeDiffer
				// 过渡时间时候除以2
				timeDiffer = timeDiffer >= 12 ? (timeDiffer / 2).toFixed(1) : timeDiffer
				// 自定义样式
				timeDiff.value['--timeDiff'] = timeDiffer + 's'
			}
			// 当前高度：每一行的高度*行数(2.25rem基数，14px基数)
			const nowHeight = Number((lyricIndex.value * 2.22 * 14).toFixed(2))
			// 保证在一定高度
			if (nowHeight >= halfHeight.value) {
				scrollNumber.value = (nowHeight - halfHeight.value).toFixed(2)
			}
		} catch (e) {
			//TODO handle the exception
			console.log(e)
		}
	}
	const checkIfGarbled = (text) => {
		// 正则表达式用于匹配非中文、非英文、非数字、非常见标点符号的字符
		// 排除时间戳和歌词标记
		// 匹配非标准字符
		const nonCommonCharsRegex =
			/(?![\u4e00-\u9fa5a-zA-Z0-9\u0020-\u007E\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u000A\u000D\u0009\u000B\u000C\u2000-\u206F])(?![0-9:.\[\]])[^\u0000-\u007F\uFF01-\uFF5E\u3000-\u303F\u000A\u000D\u0009\u000B\u000C\u2000-\u206F]+/g;

		// 使用正则表达式测试字符串
		return nonCommonCharsRegex.test(text);
	};

	// 处理歌词
	const handleLRC = (result) => {
		// 将 LRC 文件内容按行分割
		// const list = result.split('\n');
		const rList = result.split('\r')
		let list = []
		for (let i in rList) {
			let item = rList[i]
			let nList = item.split('\n');
			list = list.concat(nList)
		}
		// 分离歌曲信息与歌词部分
		let info = []
		let content = []
		// 判断是否存在[offset:0]
		let isAllTrue = list.every((item) => {
			return item !== '[offset:0]';
		});
		if (isAllTrue) {
			info = [list[0]]
			content = list.slice(1, list.length)
		} else {
			for (let i = 0; i < list.length; i++) {
				let item = list[i]
				if (item === '[offset:0]') {
					info = list.slice(0, i - 1)
					content = list.slice(i + 1, list.length)
					break
				}
			}
		}
		// 处理info 歌词信息
		let infoObjList = []
		for (let i = 0; i < info.length; i++) {
			let item = info[i]
			let res = extractTagAndValue(item)
			if (res.value && res.value !== '') {
				infoObjList.push(res)
			}
		}
		infoList.value = infoObjList
		if (infoList.value.length <= 0) {
			infoList.value = [{
					tag: 'ti',
					value: playMusicInfoStore.value.song
				},
				{
					tag: 'ar',
					value: playMusicInfoStore.value.singer
				}
			]
		}
		// 处理content 歌词内容;0位置一般是歌曲名字，重复展示。
		let contentObjList = []
		for (let i = 1; i < content.length; i++) {
			let item = content[i]
			if (item !== '') {
				let res = extractContent(item)
				if (res.value && res.value !== '') {
					contentObjList.push(res)
				}
			}

		}
		contentList.value = contentObjList

	}
	// 秒转成分钟
	const secondsToMinutes = (seconds) => {
		let remainingSeconds = Math.floor(seconds % 60);
		let minutes = Math.floor((seconds - remainingSeconds) / 60);
		if (minutes < 10) {
			minutes = '0' + minutes
		}
		if (remainingSeconds < 10) {
			remainingSeconds = '0' + remainingSeconds
		}
		return minutes + ":" + remainingSeconds;
	}

	const extractContent = (str) => {
		// 正则表达式用于匹配方括号中的内容
		const regex = /\[(.*?)\]/;
		const match = str.match(regex);
		let time, value;
		if (match) {
			// 提取方括号中的内容
			time = match[1];
			// 提取方括号之后的内容
			value = str.substring(match[0].length);
		} else {
			time = '';
			value = str;
		}
		return {
			time,
			value
		};
	}
	const extractTagAndValue = (str) => {
		// 更通用的正则表达式，匹配方括号内的标签和值
		const regex = /\[(\w+:.*?)\]/;
		const match = str.match(regex);
		let tag, value;
		if (match) {
			// 提取完整的标签和值
			const fullTagValue = match[1];
			// 分割标签和值
			const parts = fullTagValue.split(':');
			tag = parts[0]; // 标签
			value = parts[1]; // 值
		} else {
			tag = '';
			value = '';
		}
		return {
			tag,
			value
		};
	}

	/**
	 * 双击歌词
	 */
	const selectLyric = (item) => {
		emit('selectLyric', item);
	}

	// 暴露可调用的方法
	defineExpose({
		rollLyric
	})
</script>

<style lang="scss">
	.lrc {
		overflow: hidden;
		height: 100%;

		&_info {
			// height: 6rem;
			// min-height: 3rem;
			transition: height 0.5s ease;


			&_item {
				.ti {
					font-size: 1.1rem;
					// font-weight: bold;
					color: #333;
					// border-bottom: 0.1rem solid #666;
				}

				.ti::after {
					content: " ";
					color: #666;
					font-size: 0.8rem;
					width: 2rem;
					height: 1rem;
					position: absolute;
					right: -1rem;
					top: 0;
				}

				.other {
					font-size: 0.8rem;
					color: #999;
				}

			}
		}

		&_content {
			// height: calc(100% - 6rem);
			// min-height: calc(100% - 3rem);
			// border-top: 0.2rem solid #666;
			transition: height 0.5s ease;
			overflow-x: hidden;

			&_lyric {
				display: inline-block !important;
				word-break: break-all;
				white-space: normal !important;
				overflow-y: auto;
				scrollbar-width: none;
				scroll-behavior: smooth;
				height: 100%;
				padding-top: 0.4rem;

				&_item {
					color: var(--lyricColor);
					font-size: 0.85rem;
					margin-top: 0.7rem;
					margin-bottom: 0.7rem;

					&_activation {
						color: var(--lyricColor);
						font-weight: bold;
						font-size: 0.95rem;
						position: relative;
					}

					&_activation::before {
						content: attr(data-text);
						position: absolute;
						left: 0px;
						top: 0px;
						color: var(--lyricActivColor);
						clip-path: inset(0 100% 0 0);
						transition: clip-path var(--timeDiff) linear;
						/* 动画属性展开写法 */
						animation-name: revealText;
						animation-duration: var(--timeDiff, 2s);
						animation-timing-function: linear;
						animation-delay: 0s;
						animation-iteration-count: 1;
						animation-direction: normal;
						animation-fill-mode: forwards;
						animation-play-state: running;
					}

					@keyframes revealText {
						from {
							clip-path: inset(0 100% 0 0);
						}

						to {
							clip-path: inset(0 0 0 0);
						}
					}
				}

				&_fill {
					height: 7rem;
				}

				&_no {
					color: var(--lyricColor);
					font-weight: bold;
					font-size: 0.95rem;
					position: relative;
				}

			}
		}
	}
</style>