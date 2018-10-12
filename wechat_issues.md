#### 1、微信分享接口不支持hash传递。
  带有hash的url分享朋友圈的时候，跳转信息中 不包含hash信息。例如：
  live/tuwen/#/home
  只能得到：
  live/tuwen/
  建议：分享的时候不要带hash信息。如果一定要带附加信息，可以转为：
  live/tuwen/?#/home
#### 2、微信分享接口中，分享信息有字数限制。
  分享标题、分享描述、分享链接有字数限制，不能传太长的字符。否则可能出现分享链接无法跳转的问题。
  建议：分享的时候检查分享信息长度。  
#### 3、oauth2鉴权不支持hash传递。
  带有hash的url进行oauth2鉴权时，跳转信息中不包含hash信息。例如：
  https://open.weixin.qq.com/connect/oauth2/authorize?appid=xxx& redirect_uri=http://live.tuwenzhibo.com/dev/live/#/news/121）
  只能得到:
  http://live.tuwenzhibo.com/dev/live/
  建议：鉴权时不要带hash信息。如果一定要带附加信息，可以转为：
  http://live.tuwenzhibo.com/dev/live/?#/news/121
  (同问题1 hash仅作为前端书签，所以服务端是拿不到)
#### 4、oauth2鉴权很耗时
  采用oauth2很耗时，严重影响用户体验。
  建议：只对需要的页面使用鉴权。首页不要用oauth2鉴权。  
#### 5、ios中锁屏状态下，定时器失效。
  手机锁屏后，iphone、ipad进入休眠状态后，会杀死js定时器进程。所以无法进行倒计时。  
#### 6、微信中，onbeforeunload无法阻止页面后退。
    Js中的onbeoreunload事件在微信中无法阻止页面后退。
    建议：不要实现回退确认功能。  
#### 7、支付目录官方说明错误
  支付授权目录应该为当前页面链接的上一级目录
  比如 
  访问url为：http://live.tuwenzhibo.com/dev/live/#/news/121 
  授权目录应为：http://live.tuwenzhibo.com/dev/live/#/news/

  授权目录不会忽略hash，微信会认为是一个目录，导致url与授权目录不一致

  但会忽略queryparams

  spa可以使用hash router 然后修改为
  http://live.tuwenzhibo.com/dev/live/?#/news/121 
  授权目录 设置为: http://live.tuwenzhibo.com/dev/live/ 即可
#### 8、微信中，navigator.onLine不靠谱。
  例如 ws重连，根据navigator.onLine获取网络状态没有意义
  建议：不要用navigator.onLine判断是否在线。  

#### [9、微信去除"防欺诈盗号请勿支付"或"输入qq密码以及防欺诈或盗号，请不要输入qq密码"的方法](http://www.cnblogs.com/txw1958/p/weixin-set-business-domain.html)

#### 10、微信中单页跳转，页面URL地址不变
  点击复制链接，URL地址还是原来进入页面的URL。
  建议： location.href 进行跳转

#### 11、x5 浏览器视频播放
三种播放形式

(1) 全屏播放
   X5内核视频默认播放形态，用户点击视频区域后开始进入全屏播放，视频区域内的所有事件行为会由X5内核视频组件全权托管。视频层级最高，会遮挡所在区域所有html元素。（仅使用于安卓微信、手机QQ等非安卓QQ浏览器的X5内核场景）
   https://yongling8808.github.io/test/video_demo/video.html
 
(2) 页面内播放
   X5内核视频在用户点击后默认会进入全屏播放，前端可以设置video的x5-playsinline属性来将视频限定于网页内部播放
   https://yongling8808.github.io/test/video/video_inpage_playsinline.html

(3) 同层全屏播放
    同层全屏播放是X5内核一种特殊的视频播放形态，在video标签中添加x5-video-player-type=”h5”属性后，用户点击视频区域后，X5内核会先截取当前页面可视区域并动画撑满全屏，延时1s后，无缝切入视频播放界面，为了让用户有良好的体验，在播放前请勿移除页面元素，避免X5内核截取的屏幕与最终的视频播放视觉差距较大。
   https://yongling8808.github.io/test/video_demo/video_fullscreen_samelayer_1.html
    横竖屏，是否全屏都有x5都有自己的一套属性
    [参考](https://x5.tencent.com/tbs/guide/video.html)

#### 12、 微信无法长按保存图片
  （1）、blob生成url，无法长按保存
  （2）、png格式有部分安卓手机，无法长按保存

BTW：[如何让你的动画更自然](https://x5.tencent.com/tbs/guide/web/native-animation.html)


