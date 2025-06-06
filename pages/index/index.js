// 获取导航栏高度
const menuButton = wx.getMenuButtonBoundingClientRect();
const navBarHeight = menuButton.top + menuButton.height;

// 计算音频列表项的宽度
let itemWidth = 0;
const windowInfo = wx.getWindowInfo(); // 直接同步获取
const screenWidth = windowInfo.windowWidth; // 使用可用窗口宽度

// 计算rpx与px的比例（750rpx = 屏幕宽度px）
const ratio = 750 / screenWidth;
const paddingPx = (48 * 2) / ratio;  // 左右padding换算为px
const itemSpacePx = 56 / ratio;      // 间距换算为px

itemWidth = (screenWidth - paddingPx - itemSpacePx) / 2;

const audioList = [
  {
    "id": "001",
    "name": "绵绵细雨",
    "icon": "/assets/mock-icons/fine-rain.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/fine-rain-back.png",
    "cover": "/assets/mock-back/fine-rain-back.png",
    "audioUrl": "https://example.com/rain.mp3",
    "color": "120,180,220"
  },
  {
    "id": "002",
    "name": "倾盆大雨",
    "icon": "/assets/mock-icons/thunderstorm.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/thunderstorm-back.png",
    "cover": "/assets/mock-back/thunderstorm-back.png",
    "audioUrl": "https://example.com/storm.mp3",
    "color": "80,120,160"
  },
  {
    "id": "003",
    "name": "浪花涌动",
    "icon": "/assets/mock-icons/wave.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/wave-back.png",
    "cover": "/assets/mock-back/wave-back.png",
    "audioUrl": "https://example.com/wave.mp3",
    "color": "60,140,200"
  },
  {
    "id": "004",
    "name": "篝火燃烧",
    "icon": "/assets/mock-icons/campfire.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/campfire-back.png",
    "cover": "/assets/mock-back/campfire-back.png",
    "audioUrl": "https://example.com/fire.mp3",
    "color": "200,120,60"
  },
  {
    "id": "005",
    "name": "稻田乐章",
    "icon": "/assets/mock-icons/rice-field.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/rice-field-back.png",
    "cover": "/assets/mock-back/rice-field-back.png",
    "audioUrl": "https://example.com/rice.mp3",
    "color": "100,160,80"
  }
];

const app = getApp();

Page({
  data: {
    navBarHeight: navBarHeight,
    audioList: audioList,
    itemWidth: itemWidth,
    
    // 从全局数据获取的显示数据
    currentMusic: {},
    isPlaying: false,
    remainingTime: 30 * 60,
    formattedTime: '30:00',
    
    // 控制播放面板显示
    showPlayPanel: false
  },
  
  onLoad() {
    // 获取音频管理器
    this.audioManager = app.globalData.backgroundAudioManager;
    
    // 设置音频事件监听
    this.setupAudioEvents();
    
    // 同步全局数据到页面
    this.syncGlobalData();
  },
  
  onShow() {
    // 页面显示时同步数据
    this.syncGlobalData();
  },
  
  onUnload() {
    // 页面卸载时清理定时器
    this.clearTimer();
  },
  
  onHide() {
    // 页面隐藏时不清理定时器，保持后台运行
  },
  
  // 同步全局数据到页面
  syncGlobalData() {
    const globalData = app.globalData;
    this.setData({
      currentMusic: globalData.currentMusic,
      isPlaying: globalData.isPlaying,
      remainingTime: globalData.timer.remaining,
      formattedTime: app.formatTime(globalData.timer.remaining),
      // 有音乐信息时显示面板
      showPlayPanel: !!globalData.currentMusic.id
    });
  },
  
  // 设置音频事件监听
  setupAudioEvents() {
    // 播放事件
    this.audioManager.onPlay(() => {
      app.setPlayState(true);
      this.setData({ isPlaying: true });
      console.log('音频开始播放');
    });
    
    // 暂停事件
    this.audioManager.onPause(() => {
      app.setPlayState(false);
      this.setData({ isPlaying: false });
      console.log('音频暂停播放');
    });
    
    // 停止事件
    this.audioManager.onStop(() => {
      app.setPlayState(false);
      this.clearTimer();
      this.setData({ isPlaying: false });
      console.log('音频停止播放');
    });
    
    // 播放结束事件
    this.audioManager.onEnded(() => {
      app.setPlayState(false);
      this.clearTimer();
      this.setData({ isPlaying: false });
      console.log('音频播放完成');
    });
    
    // 播放错误事件
    this.audioManager.onError((error) => {
      console.error('音频播放错误:', error);
      app.setPlayState(false);
      this.setData({ isPlaying: false });
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  },
  
  // 点击音频项
  onTapAudioItem(e) {
    const audioId = e.currentTarget.dataset.id;
    const audioItem = this.data.audioList.find(item => item.id === audioId);
    
    if (audioItem) {
      console.log('选择音乐：', audioItem.name);
      
      // 更新全局数据
      app.setCurrentMusic(audioItem);
      
      // 播放音乐
      this.playMusic(audioItem);
      
      // 启动倒计时
      this.startTimer();
      
      // 更新页面数据
      this.setData({
        currentMusic: audioItem,
        showPlayPanel: true // 显示播放面板
      });
    }
  },
  
  // 播放音乐
  playMusic(musicData) {
    // 设置音频信息
    this.audioManager.title = musicData.name;
    this.audioManager.singer = 'ZZZ睡眠助手';
    this.audioManager.coverImgUrl = musicData.cover;
    
    // 设置音频源，会自动开始播放
    this.audioManager.src = musicData.audioUrl;
    
    console.log('开始播放音乐:', musicData.name);
  },
  
  // 切换播放/暂停状态
  togglePlay() {
    if (this.data.isPlaying) {
      this.audioManager.pause();
    } else {
      // 如果没有音乐，提示选择
      if (!this.data.currentMusic.id) {
        wx.showToast({
          title: '请先选择音乐',
          icon: 'none'
        });
        return;
      }
      this.audioManager.play();
    }
  },
  
  // 启动倒计时
  startTimer() {
    // 重置倒计时
    app.resetTimer();
    
    // 清除之前的定时器
    this.clearTimer();
    
    const timer = app.globalData.timer;
    
    // 启动新的定时器
    timer.timerId = setInterval(() => {
      timer.remaining--;
      
      // 更新页面显示
      this.setData({
        remainingTime: timer.remaining,
        formattedTime: app.formatTime(timer.remaining)
      });
      
      // 倒计时结束
      if (timer.remaining <= 0) {
        console.log('倒计时结束，停止播放');
        this.audioManager.stop();
        this.clearTimer();
        
        wx.showToast({
          title: '倒计时结束',
          icon: 'success'
        });
      }
    }, 1000);
    
    console.log('倒计时开始:', app.formatTime(timer.remaining));
  },
  
  // 清除定时器
  clearTimer() {
    const timer = app.globalData.timer;
    if (timer.timerId) {
      clearInterval(timer.timerId);
      timer.timerId = null;
    }
  },
  
  // 处理播放器状态变化
  onPlayerStateChange(e) {
    const { isExpanded } = e.detail;
    console.log('播放器状态变化:', isExpanded ? '已展开' : '已收起');
  },
  
  // 处理播放器进度变化
  onPlayerProgressChange(e) {
    const { progress } = e.detail;
    // console.log('播放器展开进度:', progress);
  },
  
  // 显示倒计时选择器
  showTimerPicker() {
    const timerOptions = [
      { name: '10分钟', value: 10 * 60 },
      { name: '15分钟', value: 15 * 60 },
      { name: '20分钟', value: 20 * 60 },
      { name: '30分钟', value: 30 * 60 },
      { name: '45分钟', value: 45 * 60 },
      { name: '60分钟', value: 60 * 60 },
      { name: '90分钟', value: 90 * 60 }
    ];
    
    wx.showActionSheet({
      itemList: timerOptions.map(item => item.name),
      success: (res) => {
        const selectedTimer = timerOptions[res.tapIndex];
        console.log('选择倒计时:', selectedTimer.name);
        
        // 更新全局倒计时设置
        app.globalData.timer.total = selectedTimer.value;
        app.globalData.timer.remaining = selectedTimer.value;
        
        // 更新页面显示
        this.setData({
          remainingTime: selectedTimer.value,
          formattedTime: app.formatTime(selectedTimer.value)
        });
        
        // 如果正在播放，重新开始倒计时
        if (this.data.isPlaying) {
          this.startTimer();
        }
        
        wx.showToast({
          title: `倒计时设置为${selectedTimer.name}`,
          icon: 'success'
        });
      }
    });
  }
}); 