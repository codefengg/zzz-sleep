Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否处于播放状态
    playing: {
      type: Boolean,
      value: false
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    _lastClickTime: 0,  // 用于防抖
    _debounceTime: 300,  // 防抖时间（毫秒）
    _localPlaying: false, // 本地播放状态
    _isUpdating: false   // 是否正在更新状态
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化本地状态
      this.setData({
        _localPlaying: this.properties.playing
      });
    }
  },

  /**
   * 属性观察器
   */
  observers: {
    'playing': function(playing) {
      // 当外部状态改变时，更新本地状态
      if (!this.data._isUpdating) {
        this.setData({
          _localPlaying: playing
        });
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换播放状态（带防抖和乐观更新）
    togglePlay() {
      const now = Date.now();
      if (now - this.data._lastClickTime < this.data._debounceTime) {
        return;
      }
      
      // 添加震动反馈
      wx.vibrateShort({
        type: 'light' // 使用轻微震动
      });
      
      this.setData({
        _lastClickTime: now,
        _isUpdating: true
      });

      // 乐观更新：立即更新本地状态
      const newPlayingState = !this.data._localPlaying;
      this.setData({
        _localPlaying: newPlayingState
      });
      
      // 通知父组件状态变化
      this.triggerEvent('toggle', { 
        playing: newPlayingState,
        onSuccess: () => {
          // 更新成功，重置更新状态
          this.setData({
            _isUpdating: false
          });
        },
        onError: () => {
          // 更新失败，回滚状态
          this.setData({
            _localPlaying: this.properties.playing,
            _isUpdating: false
          });
        }
      });
    }
  }
}) 