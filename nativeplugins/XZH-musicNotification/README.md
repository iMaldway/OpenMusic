## 介绍

本插件是android原生插件，仅支持Android app版本的 uni-app 项目使用。

本插件适配 android 5.0 以上（minSdkVersion 21）

本插件的使用方法在插件包里的 musicNotification.vue 有详细使用说明

## 方法：

- init( Object ); 初始化通知栏 

- update(Object); 更新通知栏信息

- playOrPause(Boolean); 切换播放状态

- openLockActivity(Boolean); 切换锁屏状态

- cancel(); 移除通知栏

- favour(Boolean);切换收藏状态

- openPermissionSetting()  打开通知栏权限页面

- ~~initSongs(Funcion )~~   getLocalSong(Funcion )  获取本地音乐

- setWidgetStyle(Object) 设置桌面小部件风格 **2.0.6 新增**

- createNotification( Funcion ) 创建通知栏 **3.0.1 新增**

- switchNotification(Boolean) 是否使用系统通知栏模板 **3.0.3 新增**

- checkOverlayDisplayPermission() 判断是否有悬浮窗权限 **3.0.6 新增**

- showFloatWindow (String) 显示桌面歌词浮窗 **3.0.6 新增**

- hideFloatWindow(); 关闭桌面歌词浮窗**3.0.6 新增**

- setPosition(number); 设置播放进度，单位毫秒**3.1.4 新增**

  

##### plus.globalEvent.addEventListener 添加监听

##### plus.globalEvent.removeEventListener 取消监听

| 类型                       | 说明                           |
| -------------------------- | ------------------------------ |
| musicNotificationPause     | 播放按钮事件回调               |
| musicNotificationPrevious  | 上一首按钮事件回调             |
| musicNotificationNext      | 下一首按钮事件回调             |
| musicNotificationFavourite | 收藏按钮事件回调               |
| musicMediaButton           | 耳机事件回调**（3.0.4 新增）** |
| musicLifecycle             | 生命周期事件回调               |
| musicNotificationClose     | 关闭按钮事件回调**（3.1.5 新增）** |
| musicSeekTo | 系统样式通知栏进度条拖动事件**（3.1.9 新增）** |



  例：

  ```javascript
// 添加监听
plus.globalEvent.addEventListener('musicNotificationPause', function(e) {
    //初始化回调
});

// 添加移除
plus.globalEvent.removeEventListener('musicNotificationPause')
  ```

##### 隐藏搜藏按钮：

  请打开 manifest.json -> 原生插件配置 -> XZH-musicNotification -> favour 内填写**`true（开启）`**或者**`false`**（关闭），不支持动态改变

## 注意：

1. 开启锁屏页， 因为各个手机品牌对该功能的限制不同，所以要根据自己的需求调整。比喻小米手机，需要用户手动开启”开启锁屏显示“、”后台弹出界面“这两个权限才可以。

~~2. 关于自定义 icon，复制新的图片覆盖 插件文件夹 res 里面的所有 drawable 开头的文件里面的对应图片就行了，不过我个人建议除了 music_icon.png 图片其他而已不要动最好，因为可能有分辨率适配问题。~~
3. 监听耳机事件回调，注意只能在应用播放音乐的时候才能接收到事件，如果有的耳机按键按了没反应，不要怀疑是插件问题，插件已经把事件直接返回了，没有事件，那就是耳机根本没发起事件。
4. 离线打包集成：


在 dcloud_uniplugins.json 进入下面代码

```json
{
    "plugins": [{
        "type": "module",
        "name": "XZH-musicNotification",
        "class": "com.xzh.musicnotification.MusicNotificationModule"
    }]
}
```

在 AndroidManifest.xml 进入下面代码

```xml
<application>
    .......
    
    <meta-data
               android:name="xzh_favour"
               android:value="true"/>

    <meta-data
               android:name="xzh_theme_color"
               android:value="#55000000"/>

    <meta-data
               android:name="xzh_title_color"
               android:value="#ffffff"/>

    <meta-data
               android:name="xzh_artist_color"
               android:value="#ffffff"/>
</application>
```



## 关于原生插件使用方法 ：

[官方文档](https://uniapp.dcloud.io/api/extend/native-plugin)