<template>
	<view class="load" v-if="props.isShow" :style="{'backgroundColor':props.loadBackgroundColor}">
		<uni-icons class="load_icon" type="loop" :color="props.loadColor" size="30"></uni-icons>
		<view class="load_text" :style="{'color':props.loadColor}">{{props.loadText}}</view>
	</view>
</template>

<script setup>
	import {
		defineProps,
	} from 'vue'

	const props = defineProps({
		isShow: {
			type: Boolean,
			default: true,
		},
		loadText: {
			type: String,
			default: '加载中...',
		},
		loadColor: {
			type: String,
			default: '#333',
		},
		loadBackgroundColor: {
			type: String,
			default: '#fff',
		},
	})
</script>

<style lang="scss">
	.load {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #ccc;
		display: flex;
		align-content: center;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		flex-direction: column;

		&_icon {
			color: #fff;
			animation: uni-loading 1s steps(12) infinite;
		}

		&_text {
			color: #fff;
			font-size: 0.6rem;
		}
	}
</style>