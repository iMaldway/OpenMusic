// 格式化时间
export const timestampToYMDHMS = (timestamp) => {
	function padZero(num) {
		return num < 10 ? '0' + num : num;
	}
	const date = new Date(timestamp)
	const year = date.getFullYear();
	const month = padZero(date.getMonth() + 1); // 月份是从0开始的
	const day = padZero(date.getDate());
	const hours = padZero(date.getHours());
	const minutes = padZero(date.getMinutes());
	const seconds = padZero(date.getSeconds());

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// 计算时间差
export const getTimeDifference = (timestamp1, timestamp2) => {
	// 将时间戳转换为毫秒级别
	let date1 = new Date(timestamp1);
	let date2 = new Date(timestamp2);

	// 比较两个日期对象的毫秒数差值
	let difference = date2.getTime() - date1.getTime();

	// 计算差值的具体时间单位
	let seconds = Math.floor(difference / 1000);
	let minutes = Math.floor(seconds / 60);
	let hours = Math.floor(minutes / 60);
	let days = Math.floor(hours / 24);

	return {
		days: days,
		hours: hours % 24,
		minutes: minutes % 60,
		seconds: seconds % 60
	};
}