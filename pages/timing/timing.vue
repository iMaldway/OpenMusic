<template>
	<view class="timing">
		<uni-list class="timing_list">
			<uni-list-item v-for="item in timeList" clickable @click="selectTime(item)" class="timing_list_item"
				:data-index="item.index">
				<template v-slot:header>
					<view class="timing_list_item_box">
						{{ item.name }}
					</view>
				</template>
				<!-- 自定义 body -->
				<template v-slot:body>
					<view v-if="activation == item.index && item.nowValue > 0" class="timing_list_item_time">
						<uni-countdown class="timing_list_item_time_countdown" color="#666" :show-day="false"
							:minute="item.nowValue" @timeup="timeup(item)"></uni-countdown>
					</view>
				</template>
				<!-- 自定义 footer-->
				<template v-slot:footer>
					<view v-show="activation == item.index" class="timing_list_item_icon">
						<uni-icons type="checkbox-filled" color="#2ec724" size="20"></uni-icons>
					</view>
				</template>
			</uni-list-item>
		</uni-list>
		<uni-popup ref="inputDialog" type="dialog">
			<uni-popup-dialog ref="inputClose" mode="input" title="输入时间" value="" placeholder="请输入0~720之间的数值"
				@confirm="inputTimeClick"></uni-popup-dialog>
		</uni-popup>

	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import {
		useAppStore
	} from '../../stores/index'
	import {
		timestampToYMDHMS,
		getTimeDifference
	} from '../../utils/time.js'
	// 弹窗
	let inputDialog = ref()
	// 当前激活
	let activation = ref(0)
	// 时间集合
	let timeList = ref([{
			index: 0,
			name: '不开启',
			value: 0,
			nowValue: 0,
		},
		{
			index: 1,
			name: '15分钟后',
			value: 15,
			nowValue: 15,
		},
		{
			index: 2,
			name: '30分钟后',
			value: 30,
			nowValue: 30,
		},
		{
			index: 3,
			name: '1小时后',
			value: 60,
			nowValue: 60,
		},
		{
			index: 4,
			name: '1小时30分钟后',
			value: 90,
			nowValue: 90,
		},
		{
			index: 5,
			name: '2小时后',
			value: 120,
			nowValue: 120,
		},
		{
			index: 6,
			name: '自定义时间',
			value: 0,
			nowValue: 0,
		}
	])
	onMounted(() => {
		const appData = useAppStore().getStoreData
		let nowTime = new Date().getTime()
		// 如果不为不开启，则计算时间差，以及当前的时间
		if (appData.value.timingIndex !== 0) {
			// 如果当前时间已经大于定时时间则重置
			if (nowTime >= appData.value.timing) {
				activation.value = 0
				useAppStore().setStoreData('isTiming', false)
				useAppStore().setStoreData('timingRecord', 0)
				useAppStore().setStoreData('timing', 0)
				useAppStore().setStoreData('timingIndex', 0)
			} else {
				// 如果当前时间小于定时时间则计算时间差
				activation.value = appData.value.timingIndex
				let notBadDate = getTimeDifference(nowTime, appData.value.timing)
				let nowValue = (notBadDate.hours * 60 + notBadDate.minutes + notBadDate.seconds / 60).toFixed(2)
				console.log(nowValue, notBadDate)
				timeList.value[activation.value].nowValue = nowValue
			}
		}
	})
	// 选择时间
	const selectTime = (item) => {
		activation.value = item.index
		// 如果为0
		if (item.index === 0) {
			useAppStore().setStoreData('isTiming', false)
			useAppStore().setStoreData('timingRecord', 0)
			useAppStore().setStoreData('timing', 0)
			useAppStore().setStoreData('timingIndex', 0)
			return
		}
		// 选择操作在0~6之间
		if (item.index !== 6 && item.index !== 0) {
			let nowTime = new Date().getTime()
			let nextTime = (item.value * 60 * 1000) + nowTime
			useAppStore().setStoreData('isTiming', true)
			useAppStore().setStoreData('timingRecord', nowTime)
			useAppStore().setStoreData('timing', nextTime)
			useAppStore().setStoreData('timingIndex', item.index)
			let nextDate = timestampToYMDHMS(nextTime)
			uni.showToast({
				icon: "none",
				title: nextDate + '关闭',
				duration: 2000
			});
			return
		}
		if (item.index === 6 && inputDialog.value) {
			inputDialog.value.open()
		}
	}
	// 时间到
	const timeup = (item) => {
		// 时间到变更为不开启
		activation.value = 0
		// 重置倒计时
		timeList.value[item.index].nowValue = timeList.value[item.index].value
	}
	// 手动输入时间
	const inputTimeClick = (res) => {
		res = Number(res)
		if (!res || (typeof res !== 'number') || isNaN(res)) {
			uni.showToast({
				icon: "none",
				title: '请输入0~720之间的数字',
				duration: 2000
			});
			return
		}
		if (res <= 0) {
			uni.showToast({
				icon: "none",
				title: '时间必须大于0',
				duration: 2000
			});
			return
		}
		if (res > 720) {
			uni.showToast({
				icon: "none",
				title: '时间不能超过12小时',
				duration: 2000
			});
			return
		}
		timeList.value[6].value = res
		timeList.value[6].nowValue = res
		let nowTime = new Date().getTime()
		let nextTime = (res * 60 * 1000) + nowTime
		useAppStore().setStoreData('isTiming', true)
		useAppStore().setStoreData('timingRecord', nowTime)
		useAppStore().setStoreData('timing', nextTime)
		useAppStore().setStoreData('timingIndex', 6)
		let nextDate = timestampToYMDHMS(nextTime)
		uni.showToast({
			icon: "none",
			title: nextDate + '关闭',
			duration: 2000
		});
	}
</script>

<style lang="scss">
	.timing {
		&_list {
			&_item {
				display: flex;
				align-content: center;
				align-items: center;
				color: #3b4144;
				height: 3rem;

				&_input {}

				&_box {
					font-size: 1rem;
				}

				&_time {
					margin-left: 0.5rem;
					display: flex;
					align-content: center;
					align-items: center;

					&_countdown {

						.uni-countdown__number,
						.uni-countdown__splitor {
							font-size: 0.7rem !important;
							color: #999;

							span {
								font-size: 0.7rem !important;
								color: #999;
							}
						}
					}
				}

				&_icon {
					position: absolute;
					right: 1rem;
				}
			}
		}
	}
</style>