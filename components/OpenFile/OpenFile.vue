<template>
	<view class="fileSelect">
		<view class="fileSelect_info">{{ folderPath.join("/") }}</view>
		<uni-list v-show="fileList.length>0">
			<uni-list-item v-for="item in fileList" :title="item.name" clickable @click="selectItem(item)">
				<template v-slot:header>
					<uni-icons v-if="item.isDirectory" class="fileSelect_icon" fontFamily="iconfont"
						size="20">{{ "&#xec17;" }}</uni-icons>
					<uni-icons v-if="item.isFile" class="fileSelect_icon" fontFamily="iconfont"
						size="20">{{ '&#xe623;' }}</uni-icons>
					<uni-icons v-if="item.isBack" class="fileSelect_icon" fontFamily="iconfont"
						size="20">{{ '&#xe669;' }}</uni-icons>
				</template>
			</uni-list-item>
		</uni-list>
		<Load :isShow="fileList.length<=0"></Load>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		getCurrentInstance
	} from 'vue'
	import {
		onNavigationBarButtonTap
	} from '@dcloudio/uni-app'
	import Load from '../../components/Load/Load.vue';
	const folderPath = ref(['file:///storage/emulated/0'])
	let fileList = ref([]);

	onMounted(() => {
		const instance = getCurrentInstance().proxy
		const eventChannel = instance.getOpenerEventChannel();
		// 监听上个页面传递过来的数据
		eventChannel.on('acceptDataFromOpenerPage', function(data) {
			if (data && data.openFilePath && data.openFilePath !== '') {
				folderPath.value[0] = data.openFilePath
			}
			openFilePath(folderPath.value[0])
		})

		// 监听页面确认事件
		onNavigationBarButtonTap((e) => {
			uni.showModal({
				title: '确认选择',
				content: folderPath.value.join("/") + "/",
				success: function(res) {
					if (res.confirm) {
						eventChannel.emit('acceptDataFromOpenedPage', {
							data: folderPath.value.join("/") + "/"
						});
						uni.navigateBack()
					} else if (res.cancel) {
						console.log('用户点击取消');
					}
				}
			});
		})
	})

	// 点击事件
	const selectItem = (item) => {
		if (item.isBack) {
			backFile()
		} else if (item.isDirectory) {
			selectFile(item)
		}
	}
	// 选择一个目录
	const selectFile = (item) => {
		folderPath.value.push(item.name)
		openFilePath(folderPath.value.join('/'))
	}
	// 返回上个目录
	const backFile = () => {
		if (folderPath.value.length > 1) {
			folderPath.value.pop()
			openFilePath(folderPath.value.join('/'))
		}
	}
	// 打开一个目录
	const openFilePath = (filePath) => {
		// #ifdef APP-PLUS
		//指定的目录
		plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
				//获取读取目录对象
				let directoryReader = entry.createReader();
				directoryReader.readEntries((entries) => {
					//返回的是指定文件夹下的文件列表
					if (folderPath.value.length <= 1) {
						fileList.value = entries
					} else {
						let back = [{
							name: '...',
							isDirectory: false,
							isBack: true
						}]
						fileList.value = back.concat(entries)
					}
				}, (err) => {
					directoryReader = undefined;
					requestPermission()
					console.log("访问目录失败" + err.message);
				});
			},
			(err) => {
				console.log("访问指定目录失败:" + err.message);
			});
		// #endif
	}
	// 打开获取权限界面
	const requestPermission = () => {
		uni.showModal({
			title: '授权提示',
			content: '授予所有文件管理权限',
			success: function(res) {
				if (res.confirm) {
					// #ifdef APP-PLUS
					let main = plus.android.runtimeMainActivity();
					let pkName = main.getPackageName();
					let Intent = plus.android.importClass("android.content.Intent");
					let Build = plus.android.importClass("android.os.Build");
					let Settings = plus.android.importClass("android.provider.Settings");
					let Environment = plus.android.importClass("android.os.Environment");
					if (Build.VERSION.SDK_INT >= 30) {
						// 权限未获取跳转到设置页  
						if (!Environment.isExternalStorageManager()) {
							let intent = new Intent(
								Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION
							);
							const Uri = plus.android.importClass("android.net.Uri");
							const uri = Uri.fromParts("package", pkName, null);
							intent.setData(uri);
							main.startActivity(intent);
						}
						// 权限已获取，自定义处理  
						else {
							main = undefined;
							pkName = undefined;
							Intent = undefined;
							Build = undefined;
							Settings = undefined;
							Environment = undefined;
						}
					}
					main = undefined;
					pkName = undefined;
					Intent = undefined;
					Build = undefined;
					Settings = undefined;
					Environment = undefined;
					uni.navigateBack();
					// #endif
				} else if (res.cancel) {
					uni.showToast({
						title: '用户取消授权',
						duration: 2000
					});
				}
			}
		});
	}
</script>

<style lang="scss">
	.fileSelect {
		&_info {
			padding: 0.5rem;
			color: #999;
			font-size: 0.5rem;
		}

		&_icon {
			margin-right: 0.5rem;
		}
	}
</style>