Component({
  options: {
    multipleSlots: true
  },
  
  properties: {
    // 控制面板的显示状态
    visible: {
      type: Boolean,
      value: false
    },
    // 自定义背景色
    backgroundColor: {
      type: String,
      value: 'rgba(40, 41, 55, 1)'
    },
    // 内容高度（rpx）
    contentHeight: {
      type: Number,
      value: 800
    }
  },

  data: {
    // 面板位置
    panelPosition: 0,
    // 隐藏位置
    hiddenPosition: 0,
    // 显示位置
    showPosition: 0,
    // 禁用动画标志
    disableAnimated: false,
    // 系统信息
    screenHeight: 0,
    safeAreaBottom: 0
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        this.showPanel();
      } else {
        this.hidePanel();
      }
    }
  },

  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      const screenHeight = systemInfo.screenHeight;
      
      // 判断是否是全面屏
      const isFullScreen = systemInfo.screenHeight > systemInfo.windowHeight;
      // 底部安全区高度
      const safeAreaBottom = isFullScreen ? 24 : 0;
      
      // 计算位置（px单位）
      const contentHeightPx = this.data.contentHeight / 750 * systemInfo.windowWidth;
      const hiddenPos = screenHeight + 20; // 隐藏位置（屏幕下方）
      const showPos = screenHeight - safeAreaBottom - contentHeightPx; // 显示位置
      
      this.setData({
        screenHeight: screenHeight,
        safeAreaBottom: safeAreaBottom,
        hiddenPosition: hiddenPos,
        showPosition: showPos,
        panelPosition: this.data.visible ? showPos : hiddenPos
      });
    }
  },

  methods: {
    // 显示面板
    showPanel() {
      this.setData({
        panelPosition: this.data.showPosition
      });
    },

    // 隐藏面板
    hidePanel() {
      this.setData({
        panelPosition: this.data.hiddenPosition
      });
      
      // 触发隐藏事件
      this.triggerEvent('hide');
    },

    // 面板拖拽开始
    dragPanelStart(e) {
      // 拖拽开始时禁用动画
      this.setData({
        disableAnimated: true
      });
    },

    // 面板拖拽结束
    dragPanelEnd(e) {
      const { y } = e.detail;
      const { showPosition, hiddenPosition, screenHeight } = this.data;
      
      // 计算是否应该关闭面板
      const threshold = screenHeight * 0.3; // 30%屏幕高度为阈值
      const shouldHide = y > showPosition + threshold;
      
      if (shouldHide) {
        // 隐藏面板
        this.hidePanel();
      } else {
        // 回到显示位置
        this.setData({
          panelPosition: showPosition
        });
      }
      
      // 恢复动画
      setTimeout(() => {
        this.setData({
          disableAnimated: false
        });
      }, 100);
    },

    // 面板位置变化处理
    onPanelChange(e) {
      // 拖拽时临时禁用动画
      if (!this.data.disableAnimated) {
        this.setData({
          disableAnimated: true
        });
      }
      
      // 清除之前的恢复定时器
      clearTimeout(this.recoverAnimation);
      
      // 100ms后恢复动画
      this.recoverAnimation = setTimeout(() => {
        this.setData({
          disableAnimated: false
        });
        this.recoverAnimation = null;
      }, 100);
    },

    // 点击遮罩关闭
    onMaskTap() {
      this.hidePanel();
    }
  }
}) 