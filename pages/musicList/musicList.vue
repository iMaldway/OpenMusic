<template>
	<MusicList :name="parameter.name" :path="parameter.path" @select="selectItem"></MusicList>
</template>

<script setup>
	import {
		ref,
		onMounted,
		getCurrentInstance,
	} from 'vue'

	// 传递过来的数据
	let parameter = ref({
		name: '',
		path: ''
	})

	const instance = getCurrentInstance().proxy
	const eventChannel = instance.getOpenerEventChannel();

	onMounted(() => {
		// 监听上个页面传递过来的数据
		eventChannel.on('setDataToMusicList', function(data) {
			if (data && data.path && data.path !== '') {
				uni.setNavigationBarTitle({
					title: data.name || '我的歌单'
				});
				parameter.value.name = data.name
				parameter.value.path = data.path
			}
		})

	})

	// 选择音乐
	const selectItem = (item) => {
		uni.navigateBack()
	}
</script>

<style lang="scss">

</style>