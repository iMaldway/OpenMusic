/**
 * @method 将歌曲文件名分割为歌曲名歌手
 * @todo 将歌曲文件名分割为歌曲名歌手
 * @param {String} str 字符串
 * @throws 输入的字符串格式不正确
 * @return {Object} beforeDash:歌曲名，afterDashBeforeDot歌手名
 */
export const extractParts = (str) => {
	// 使用正则表达式匹配最后一个 '-' 之前的内容
	const beforeDashMatch = str.match(/^(.*?)-/);
	const beforeDash = beforeDashMatch ? beforeDashMatch[1].trim() : '';

	// 使用正则表达式匹配最后一个 '-' 之后与下一个 '.' 之间的内容
	const afterDashBeforeDotMatch = str.match(/-(.*?)\./);
	const afterDashBeforeDot = afterDashBeforeDotMatch ? afterDashBeforeDotMatch[1].trim() : '';

	// 检查是否有匹配结果
	if (!beforeDash && !afterDashBeforeDot) {
		throw new Error('----输入的字符串格式不正确----');
	}

	return {
		beforeDash: beforeDash || '未知',
		afterDashBeforeDot: afterDashBeforeDot || '未知歌手'
	};
}

/**
 * @method 获取一个随机数，在一定范围内确保不能是同一个数
 * @todo 获取一个随机数，在一定范围内确保不能是同一个数
 * @param {Number} now 当前数值
 * @param {Number} max 最大数值
 * @param {Number} runningState  运行状态 0（随机） 2（顺序）
 * @param {String} operationState 操作状态  increase(增加) reduce(减少)
 * @return {Number} 一个随机数
 */
export const getNextIndex = (now, max, runningState, operationState) => {
	let nextIndex = now;
	if (runningState === 0) {
		// 循环次数限制为max
		for (let i = 0; i < max; i++) {
			nextIndex = Math.floor(Math.random() * (max - 1));
			if (nextIndex !== now) {
				break;
			}
		}
	} else if (runningState === 2) {
		if (operationState === 'increase') {
			// 当下一次的值等于最大值的时候说明该从头开始了
			nextIndex = nextIndex + 1 >= max ? 0 : nextIndex + 1
		} else {
			nextIndex = nextIndex - 1 <= 0 ? max - 1 : nextIndex - 1
		}
	}
	return nextIndex
}
/**
 * @method 将秒转换成分钟
 * @param {Number} seconds 秒
 * @return {String} 分钟:秒钟
 */
export const secondsToMinutes = (seconds) => {
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
/**
 * @method 分钟装换成秒
 * @param {String} formattedTime 格式为： 01:21.03
 * @throws 字符串格式不正确
 * @return {Number} totalSeconds (1 * 60) + 21 + (3 / 1000)
 * 
 */
export const formatToMilliseconds = (formattedTime) => {
	// 使用正则表达式来解析字符串
	const regex = /^(\d{2}):(\d{2})(?:\.(\d{2,3}))?$/;
	const match = formattedTime.match(regex);
	if (!match) {
		throw new Error('Invalid time format：' + formattedTime);
	}
	// 解析出分钟、秒和毫秒
	const minutes = parseInt(match[1], 10);
	const seconds = parseInt(match[2], 10);
	const millisecondsStr = match[3] || '00'; // 如果没有毫秒部分，默认为 '00'
	const milliseconds = parseInt(millisecondsStr, 10);

	// 计算总秒数
	const totalSeconds = (minutes * 60) + seconds + (milliseconds / 1000);

	return totalSeconds;
}