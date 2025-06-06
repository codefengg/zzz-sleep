App({
  globalData: {
    // 当前播放音乐信息
    currentMusic: {
      id: null,
      name: '选择音乐开始播放',
      cover: '',
      audioUrl: '',
      color: '64,158,255' // 主题色RGB
    },
    
    // 播放状态
    isPlaying: false,
    
    // 倒计时设置
    timer: {
      total: 30 * 60,      // 默认30分钟(秒)
      remaining: 30 * 60,  // 剩余时间(秒) 
      timerId: null        // 定时器ID
    },
    
    // 音频管理器
    backgroundAudioManager: null
  },

  onLaunch() {
    // 初始化音频管理器
    this.globalData.backgroundAudioManager = wx.getBackgroundAudioManager();
    
    // 设置音频管理器基本信息
    const audioManager = this.globalData.backgroundAudioManager;
    audioManager.epname = '助眠音乐';
    audioManager.singer = 'ZZZ睡眠';
  },
  
  // 设置当前播放音乐
  setCurrentMusic(musicData) {
    this.globalData.currentMusic = {
      ...musicData,
      color: musicData.color || '64,158,255'
    };
  },
  
  // 设置播放状态
  setPlayState(isPlaying) {
    this.globalData.isPlaying = isPlaying;
  },
  
  // 重置倒计时
  resetTimer() {
    this.globalData.timer.remaining = this.globalData.timer.total;
  },
  
  // 格式化时间显示
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}) 