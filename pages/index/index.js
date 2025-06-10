import audioList from '../../mock/audio.js';

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
    showPlayPanel: false,
    
    // 添加倒计时选择器相关数据
    showTimerModal: false,
    timerOptions: Array.from({length: 24}, (_, i) => (i + 1) * 5), // 5-120分钟，步长5分钟
    quickTimerOptions: [15, 30, 60], // 快捷选项：15、30、60分钟
    tempSelectedTime: 30 // 临时选择的倒计时时间（分钟），用于选择器显示
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
      showPlayPanel: !!globalData.currentMusic.id,
      // 同步当前全局倒计时设置到临时选择时间
      tempSelectedTime: Math.floor(globalData.timer.total / 60)
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
      // 只有在倒计时结束时才清除定时器，避免用户手动暂停时清除倒计时
      if (this.data.remainingTime <= 0) {
        this.clearTimer();
      }
      this.setData({ isPlaying: false });
      console.log('音频停止播放');
    });
    
    // 播放结束事件
    this.audioManager.onEnded(() => {
      console.log('音频播放完成');
      // 如果倒计时还在进行，则重新播放音乐（循环播放）
      if (this.data.remainingTime > 0 && this.data.currentMusic.audioUrl) {
        console.log('倒计时未结束，继续循环播放');
        // 重新设置音频源，自动开始播放
        this.audioManager.src = this.data.currentMusic.audioUrl;
      } else {
        // 倒计时结束或没有音乐，停止播放
        app.setPlayState(false);
        this.clearTimer();
        this.setData({ isPlaying: false });
        console.log('倒计时已结束，停止播放');
      }
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
    // 清除之前的定时器
    this.clearTimer();
    
    const timer = app.globalData.timer;
    
    // 每次播放新音乐时，都重置倒计时为全局设置的时间
    timer.remaining = timer.total;
    
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
  },
  
  // 处理播放器进度变化
  onPlayerProgressChange(e) {
    const { progress } = e.detail;
  },
  
  // 显示倒计时选择器 - 使用play-panel组件
  showTimerPicker() {
    // 显示选择器时，将当前全局倒计时时间作为临时选择时间
    const currentMinutes = Math.floor(app.globalData.timer.total / 60);
    this.setData({
      showTimerModal: true,
      tempSelectedTime: currentMinutes
    });
  },
  
  // 隐藏倒计时选择器
  hideTimerPicker() {
    this.setData({
      showTimerModal: false
    });
  },
  
  // 处理倒计时选择器变化
  onTimerPickerChange(e) {
    const minutes = e.detail.value;
    // 只更新临时选择时间，不设置全局时间
    this.setData({
      tempSelectedTime: minutes
    });
  },
  
  // 处理快捷倒计时选择
  onTimerQuickSelect(e) {
    const minutes = e.detail.value;
    // 只更新临时选择时间，不立即设置全局时间
    this.setData({
      tempSelectedTime: minutes
    });
  },
  
  // 处理倒计时保存
  onTimerSave(e) {
    // 使用临时选择的时间
    const minutes = this.data.tempSelectedTime;
    this.setTimerDuration(minutes);
    this.hideTimerPicker();
  },
  
  // 设置倒计时时长
  setTimerDuration(minutes) {
    const seconds = minutes * 60;
        
    // 更新全局倒计时设置
    app.globalData.timer.total = seconds;
    
    // 立即重置剩余时间为新设置的时间
    app.globalData.timer.remaining = seconds;
    
    // 如果正在播放音乐，重新启动倒计时
    if (this.data.isPlaying) {
      this.startTimer();
    }
    
    // 始终更新页面显示的倒计时设置信息
    this.setData({
      remainingTime: app.globalData.timer.remaining,
      formattedTime: app.formatTime(app.globalData.timer.remaining)
    });
  }
}); 