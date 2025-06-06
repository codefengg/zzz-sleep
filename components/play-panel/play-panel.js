// components/play-panel/play-panel.js
Component({
  options: {
    multipleSlots: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    customStyle: {
      type: String,
      value: ''
    },
    backgroundColor: {
      type: String,
      value: 'rgba(40, 41, 55, 1)'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 面板位置
    panelPosition: 0,
    // 顶部位置（展开状态）
    topPosition: 0,
    // 底部位置（收起状态）
    bottomPosition: 0,
    // 展开进度（0-1之间）
    presentProgress: 0,
    // 禁用动画标志
    disableAnimated: false,
    // 是否展开
    isExpanded: false
  },

  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      const screenHeight = systemInfo.screenHeight;
      
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = systemInfo.statusBarHeight;
      const capsuleBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
      
      // 判断是否是全面屏
      const isFullScreen = systemInfo.screenHeight > systemInfo.windowHeight;
      // 底部安全区高度（源码使用24）
      const safeAreaBottom = isFullScreen ? 24 : 0;
      // 迷你播放器高度（源码计算方式）
      const miniPlayerHeight = 80 / (375 / systemInfo.windowWidth);
      
      // 计算位置（按照源码方式）
      const topPos = statusBarHeight + capsuleBarHeight;
      const bottomPos = screenHeight - safeAreaBottom - miniPlayerHeight;
      
      // 设置面板位置
      this.setData({
        topPosition: topPos,
        bottomPosition: bottomPos,
        panelPosition: bottomPos
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 拖动开始
    dragPanelStart(e) {
      if (e.changedTouches[0]) {
        this.dragOrigin = e.changedTouches[0].pageY;
      }
    },
    
    // 面板位置变化处理 - 对应源码的onPresent方法
    onPanelChange(e) {
      const { y } = e.detail;
      const { topPosition, bottomPosition } = this.data;
      
      // 使用源码的progress计算公式
      const progress = 1 - parseInt(1000 * ((y - topPosition) / (bottomPosition - topPosition))) / 1000;
      
      if (progress !== this.data.presentProgress) {
        this.setData({
          presentProgress: progress
        });
      }
      
      // 拖拽时临时禁用动画（源码逻辑）
      if (!this.data.disableAnimated) {
        this.setData({
          disableAnimated: true
        });
      }
      
      // 清除之前的恢复定时器
      clearTimeout(this.recoverAnimation);
      
      // 100ms后恢复动画（源码时间）
      this.recoverAnimation = setTimeout(() => {
        this.setData({
          disableAnimated: false
        });
        this.recoverAnimation = null;
      }, 100);
    },
    
    // 拖动结束 - 对应源码的dragPanelEnd方法
    dragPanelEnd(e) {
      const pageY = e.changedTouches[0].pageY;
      const { topPosition, bottomPosition } = this.data;
      
      // 计算拖动距离
      const distance = pageY - this.dragOrigin;
      // 阈值：源码使用(bottomPosition - topPosition) / 10
      const threshold = (bottomPosition - topPosition) / 10;
      
      // 使用源码的决策逻辑
      let finalPosition;
      if (this.data.panelPosition === topPosition) {
        // 当前在顶部：向下拖动超过阈值则收起到底部，否则保持顶部
        finalPosition = distance > threshold ? bottomPosition : topPosition;
      } else {
        // 当前在底部：向上拖动超过阈值则展开到顶部，否则保持底部
        finalPosition = distance < -threshold ? topPosition : bottomPosition;
      }
      
      // 设置最终位置
      this.setData({
        panelPosition: finalPosition,
        isExpanded: finalPosition === topPosition
      });
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    },
    
    // 点击切换面板状态 - 对应源码的presentPanel方法
    togglePanel() {
      const { panelPosition, topPosition, bottomPosition } = this.data;
      const newPosition = panelPosition === topPosition ? bottomPosition : topPosition;
      
      this.setData({
        panelPosition: newPosition,
        isExpanded: newPosition === topPosition
      });
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    }
  }
}) 