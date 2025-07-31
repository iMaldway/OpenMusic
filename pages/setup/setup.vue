<template>
	<view class="setup" :style="SETUP_STYLE">
		<view class="setup_info">
			<view class="setup_info_imge">
				<image mode="widthFix" class="imge" src="../../static/image/mimi.png"></image>
			</view>
			<view class="setup_info_app">
				<view>iMaldway</view>
				<view>Version: 1.1.2</view>
			</view>
		</view>
		<view class="setup_list">
			<view class="setup_list_text">播放设置</view>
			<view class="setup_list_item">
				<view class="setup_list_item_row">
					<uni-data-select v-model="setupPlay" :localdata="setupData" @change="changeSetupPlay"
						:clear="false"></uni-data-select>
				</view>
			</view>
			<view class="setup_list_text">颜色设置</view>
			<view class="setup_list_item">
				<view class="setup_list_item_row both_sides line" @click="selectColor('--playerColor')">
					<text class="setup_list_item_row_text">播放器组件按钮颜色</text>
					<text class="setup_list_item_row_color" :style="{'backgroundColor':'var(--playerColor)'}"></text>
				</view>
				<view class="setup_list_item_row both_sides line" @click="selectColor('--playerSongColor')">
					<text class="setup_list_item_row_text">播放器歌曲名字颜色</text>
					<text class="setup_list_item_row_color"
						:style="{'backgroundColor':'var(--playerSongColor)'}"></text>
				</view>
				<view class="setup_list_item_row both_sides line" @click="selectColor('--playerSingerColor')">
					<text class="setup_list_item_row_text">播放器歌手名字颜色</text>
					<text class="setup_list_item_row_color"
						:style="{'backgroundColor':'var(--playerSingerColor)'}"></text>
				</view>
				<view class="setup_list_item_row both_sides line" @click="selectColor('--lyricColor')">
					<text class="setup_list_item_row_text">歌词总体颜色</text>
					<text class="setup_list_item_row_color" :style="{'backgroundColor':'var(--lyricColor)'}"></text>
				</view>
				<view class="setup_list_item_row both_sides " @click="selectColor('--lyricActivColor')">
					<text class="setup_list_item_row_text">歌词激活颜色</text>
					<text class="setup_list_item_row_color"
						:style="{'backgroundColor':'var(--lyricActivColor)'}"></text>
				</view>
			</view>
			<view class="setup_list_text"></view>
			<view class="setup_list_item">
				<view class="setup_list_item_row centered" @click="setDefault">
					还原成默认设置
				</view>
			</view>
		</view>
		<!-- 颜色选择框 -->
		<uv-pick-color ref="pickerColor" :color="nowColor" @confirm="inputColorConfirm"></uv-pick-color>
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
		onUnmounted
	} from 'vue'

	import {
		useAppStore,
	} from '../../stores/index'

	import uvPickColor from '@/uni_modules/uv-pick-color/components/uv-pick-color/uv-pick-color.vue';

	const setupData = ref([{
			value: 'current',
			text: '播放当前歌单内容'
		},
		{
			value: 'all',
			text: '播放所有歌单内容'
		}
	])

	// 应用信息
	let appData = useAppStore().getStoreData
	// 播放信息选择
	let setupPlay = ref('')
	// 颜色合集
	let SETUP_STYLE = computed(() => {
		return useAppStore().getSetupColor
	})
	// 颜色选择插件
	let pickerColor = ref()
	// 当前操作颜色值
	let nowColor = ref({
		r: '',
		g: '',
		b: '',
		a: ''
	})
	// 当前操作颜色名字
	let nowColorName = ref('')

	onMounted(() => {
		setupPlay.value = appData.value.setup.play
	})

	const changeSetupPlay = (res) => {
		if (res == 'all') {
			useAppStore().updateSetUpData('play', 'all')
		} else {
			useAppStore().updateSetUpData('play', 'current')
		}
		uni.showToast({
			icon: "none",
			title: '设置成功',
			duration: 2000
		});
	}
	// 选择颜色
	const selectColor = (res) => {
		if (pickerColor && pickerColor.value) {
			nowColor.value = hexToRgba(SETUP_STYLE.value[res])
			nowColorName.value = res
			pickerColor.value.open()
		}
	}
	// 输入颜色值
	const inputColorConfirm = (res) => {
		const colorRegex = /^#[0-9A-Fa-f]{6}$/;
		if (!colorRegex.test(res.hex)) {
			uni.showToast({
				icon: "none",
				title: '格式错误，请以#开头后面以6位16进制数据结束',
				duration: 2000
			});
		} else {
			useAppStore().updateSetUpData(nowColorName.value, res.hex)
			uni.showToast({
				icon: "none",
				title: '设置成功',
				duration: 2000
			});
		}
	}
	// 将16进制颜色转换成rgba颜色
	const hexToRgba = (hex, alpha = 1) => {
		// 确保输入的hex值是正确的格式
		hex = hex.replace(/#/g, '');
		if (hex.length === 3) {
			// 如果是短格式（如 #fff），则扩展为长格式
			hex = hex.split('').map(c => c + c).join('');
		}

		// 将每个颜色通道的值从十六进制转换为十进制
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);

		// 返回一个对象
		return {
			r: Number(r.toString()),
			g: Number(g.toString()),
			b: Number(b.toString()),
			a: Number(alpha.toString())
		};
	}

	// 还原成默认设置
	const setDefault = () => {
		uni.showModal({
			title: '还原设置',
			content: '要将设置还原成默认状态吗？',
			success: function(res) {
				if (res.confirm) {
					useAppStore().reduction()
				}
			}
		});
	}
</script>

<style lang="scss">
	.setup {
		width: 100%;
		height: 100%;
		padding: 1rem;
		background-color: #f5f5f5;

		.both_sides {
			display: flex;
			align-content: center;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
		}

		.dialog_color {
			margin-left: 1rem;
			width: 2rem;
			height: 2rem;
		}

		.centered {
			text-align: center;
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
			flex-wrap: wrap;
		}

		&_info {
			display: flex;
			align-content: center;
			justify-content: center;
			align-items: center;
			flex-wrap: wrap;
			background-color: #fff;
			border-radius: 1rem;

			&_imge {
				width: 100%;
				display: flex;
				align-content: center;
				justify-content: center;
				align-items: center;
				flex-wrap: wrap;

				.imge {
					margin-top: 1rem;
					border-radius: 50%;
					height: 5rem;
					width: 5rem;
				}
			}

			&_app {
				view {
					font-size: 0.9rem;
					text-align: center;
					margin-top: 0.5rem;
					margin-bottom: 0.5rem;
					color: #333;
				}
			}
		}

		&_list {
			margin-top: 2rem;

			&_text {

				margin-left: 1rem;
				color: #666;
				margin-top: 1rem;
				margin-bottom: 0.5rem;
			}

			&_item {
				display: flex;
				align-content: center;
				justify-content: flex-start;
				align-items: center;
				flex-wrap: wrap;
				background-color: #fff;
				border-radius: 1rem;
				margin-top: 0.5rem;
				color: #6a6a6a;
				font-size: 0.8rem !important;

				.uni-stat__select,
				.uni-select,
				.uni-select__input-placeholder,
				.uni-select__input-text {
					font-size: 0.8rem !important;
					color: #6a6a6a !important;
					border: 0px solid #fff !important;
					padding-left: 0;
					padding-right: 0;
				}

				.line {
					position: relative;
					width: 100%;
				}

				.line::after {
					content: ' ';
					position: absolute;
					left: 10;
					right: -10;
					bottom: 0rem;
					width: 90%;
					height: 0.05rem;
					background-color: #ececec;
				}

				&_row {
					padding-left: 1rem;
					padding-right: 1rem;
					padding-top: 0.5rem;
					padding-bottom: 0.5rem;
					color: #6a6a6a;
					font-size: 0.8rem;
					width: 100%;
					height: 3rem;

					&_text {}

					&_color {
						width: 1rem;
						height: 1rem;
						border-radius: 0.2rem;
						display: inline-block;
					}
				}

				&_row:active {
					background-color: #f7f7f7;
				}
			}
		}
	}
</style>