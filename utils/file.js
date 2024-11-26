import {
	useSongSheetListStore
} from '../stores/index'

import {
	extractParts
} from '@/utils/utils.js'

/**
 * 获取指定路径下所有的音乐文件，将自动持久化数据
 * 
 * @param {String} filePath 指定的路径
 * @param {String} typeName  路径的别名
 */
export const OpenFilePathToGetList = async (filePath, typeName, fileList = [], level = 0) => {
	// 不做深层遍历
	if (level > 2) {
		console.warn('层级过深结束遍历', filePath, typeName)
		return
	}
	// #ifdef APP-PLUS
	//判断最后一位是否是 / 不是则增加
	const regex = /\/$/;
	if (!regex.test(filePath)) {
		filePath = filePath + '/'
	}
	// 正则表达式
	let reg = RegExp(/\.(?:ncm|mgg|mflac|flac|kgm|ofl_en|mp3|ogg)$/)
	try {
		// 文件夹集合
		let direList = []
		// 读取文件
		const entries = await GetMusicFileList(filePath, typeName)
		for (let i = 0; i < entries.length; i++) {
			let item = entries[i]
			// 是否是文件夹
			if (item && item.isDirectory) {
				direList.push({
					name: item.name,
					path: filePath + item.name
				})
			}
			// 是否是歌曲文件
			if (item && item.isFile && item.name && reg.test(item.name)) {
				const result = extractParts(item.name)
				fileList.push({
					name: item.name,
					song: result.beforeDash,
					singer: result.afterDashBeforeDot,
					path: filePath + item.name,
					parentPath: ''
				})
			}
		}
		if (level <= 2 && direList && direList.length > 0) {
			for (let i = 0; i < direList.length; i++) {
				let item = direList[i]
				const newLevel = level + 1
				await OpenFilePathToGetList(item.path, item.name, fileList,
					newLevel)
			}
		}
	} catch (e) {
		//TODO handle the exception
		console.log('读取异常', e)
	}
	return fileList
	// #endif
}
/**
 * 获取指定路径下所有的文件
 * 
 * @param {String} filePath 指定的路径
 * @param {String} typeName  路径的别名
 */
export const GetMusicFileList = (filePath, typeName) => {
	return new Promise((resolve, reject) => {
		//指定的目录
		plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
			//获取读取目录对象
			try {
				let directoryReader = entry.createReader();
				directoryReader.readEntries((entries) => {
					resolve(entries)
				})
			} catch (e) {
				//TODO handle the exception
				reject(e)
			}
		})
	})
}
/**
 * 获取指定路径下所有的音乐文件，将自动持久化数据
 * 
 * @param {String} filePath 指定的路径
 * @param {String} typeName  路径的别名
 */
export const GetMusicFileForPath = async (filePath, typeName) => {
	let fileList = []
	try {
		await OpenFilePathToGetList(filePath, typeName, fileList)
		// 设置父级路径
		for (let i = 0; i < fileList.length; i++) {
			fileList[i].parentPath = filePath
		}
		// 获取歌单集合
		let songSheetList = useSongSheetListStore().getStoreData.value;
		// 存在
		if (songSheetList && songSheetList.length > 0) {
			// 判断是否存在相同的路径
			let isAllTrue = songSheetList.every((currentValue) => {
				return currentValue.path !== filePath;
			});
			// 不存在则添加
			if (isAllTrue) {
				songSheetList.push({
					'name': typeName,
					'path': filePath,
					'size': fileList.length,
					'list': fileList
				})
			} else {
				// 在集合中找到该元素并更新该元素
				for (let i = 0; i < songSheetList.length; i++) {
					let item = songSheetList[i]
					if (item.path === filePath) {
						songSheetList[i].list = fileList
						break;
					}
				}
			}
			// 0 号位置是所有歌单集合
			if (songSheetList.length > 1) {
				let allList = []
				for (let i = 1; i < songSheetList.length; i++) {
					let item = songSheetList[i]
					allList = allList.concat(item.list)
				}
				songSheetList[0].size = allList.length
				songSheetList[0].list = allList
			}
			useSongSheetListStore().setStoreData(songSheetList)
		} else {
			useSongSheetListStore().setStoreData([{
					'name': '歌单集合',
					'path': 'file:///storage/emulated/0/',
					'size': fileList.length,
					'list': fileList
				},
				{
					'name': typeName,
					'path': filePath,
					'size': fileList.length,
					'list': fileList
				}
			])

		}
	} catch (e) {
		//TODO handle the exception
		console.log('读取歌曲文件异常：', e)
	}
	return fileList
}
/**
 * 获取指定路径下的文本文件
 * 
 * @param {String} path 指定的路径
 * @param {String} code  编码，默认GB18030
 * @return {Object} {code:Number,target?:Object,message?:String}
 */
export const readLRC = (path, code = 'GB18030') => {
	// #ifdef APP-PLUS
	return new Promise((resolve, reject) => {
		plus.io.resolveLocalFileSystemURL(path, (entry) => {
				// 可通过entry对象操作文件 
				entry.file(function(file) {
					let fileReader = new plus.io.FileReader();
					// 按文本形式读取 GB18030
					fileReader.readAsText(file, code);
					// 读取成功后
					fileReader.onloadend = function(evt) {
						/**
						 * evt.target
						 * evt.target.result
						 */
						fileReader = null
						entry = null
						evt.code = 200
						resolve(evt);
					}
				});
			},
			(err) => {
				resolve(err)
				console.log("访问指定文件失败:" + err.message, path);
			});
	})
	// #endif
}