<script>
	import {
		getCurrentInstance
	} from 'vue'
	import {
		useAppStore
	} from './stores/index'

	import {
		useNotificationStore
	} from './stores/notification'


	export default {
		onLaunch: async function() {
			console.log('App Launch')
			await useNotificationStore().init()
		},
		onShow: function() {
			console.log('App Show')
			useAppStore().setStoreData('appActiva', true)
		},
		onHide: function() {
			console.log('App Hide')
			useAppStore().setStoreData('appActiva', false)
		},
		onError: function(e) {
			console.log('App Error :', e)
		},
		onExit: function() {
			// 页面退出清除通知
			useNotificationStore().cancel()
		}
	}
</script>

<style>
	#app {
		background-color: #f5f5f5;
	}

	/*每个页面公共css */
	@font-face {
		font-family: 'iconfont';
		src: url('./css/iconfont/iconfont.woff2') format('woff2'),
			url('./css/iconfont/iconfont.woff') format('woff'),
			url('./css/iconfont/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 16px;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	* {
		box-sizing: border-box;
	}

	.uni-page-body {
		height: 100%;
	}
</style>