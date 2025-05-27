// components/play-panel/play-panel.js
Component({
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
      const screenWidth = systemInfo.screenWidth;
      
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = systemInfo.statusBarHeight;
      const navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
      
      // 计算迷你播放器高度（根据设计稿比例计算）
      const miniPlayerHeight = 100;
      
      // 判断是否是全面屏
      const isFullScreen = systemInfo.screenHeight > systemInfo.windowHeight;
      // 底部安全区高度
      const safeAreaBottom = isFullScreen ? 34 : 0;

      console.log('safeAreaBottom===', safeAreaBottom);
      
      // 设置面板位置
      this.setData({
        topPosition: statusBarHeight + navBarHeight,
        bottomPosition: screenHeight - safeAreaBottom - miniPlayerHeight,
        panelPosition: screenHeight - safeAreaBottom - miniPlayerHeight
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 拖动开始
    dragPanelStart(e) {
      const { changedTouches } = e;
      if (changedTouches[0]) {
        const { pageY } = changedTouches[0];
        this.dragOrigin = pageY;
      }
    },
    
    // 拖动结束
    dragPanelEnd(e) {
      const changedTouches = e.changedTouches;
      const pageY = changedTouches[0].pageY;
      const { topPosition, bottomPosition } = this.data;
      
      // 计算拖动距离
      const distance = pageY - this.dragOrigin;
      // 设置判断阈值，屏幕高度的10%
      const threshold = (bottomPosition - topPosition) / 10;
      
      let finalPosition;
      
      // 根据当前位置和拖动距离决定最终位置
      if (this.data.panelPosition === topPosition) {
        // 如果当前在顶部，向下拖动超过阈值则收起
        finalPosition = distance > threshold ? bottomPosition : topPosition;
      } else {
        // 如果当前在底部，向上拖动超过阈值则展开
        finalPosition = distance < -threshold ? topPosition : bottomPosition;
      }
      
      // 更新面板位置和展开状态
      this.setData({
        panelPosition: finalPosition,
        isExpanded: finalPosition === topPosition
      });
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    },
    
    // 点击切换面板状态
    togglePanel() {
      const { panelPosition, topPosition, bottomPosition } = this.data;
      const newPosition = panelPosition === topPosition ? bottomPosition : topPosition;
      
      this.setData({
        panelPosition: newPosition,
        isExpanded: newPosition === topPosition
      });
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    },
    
    // 面板位置变化处理
    onPanelChange(e) {
      const { y } = e.detail;
      const { topPosition, bottomPosition } = this.data;
      
      // 计算展开进度（0-1之间）
      const progress = 1 - ((y - topPosition) / (bottomPosition - topPosition));
      const roundedProgress = Math.max(0, Math.min(1, progress));
      
      if (roundedProgress !== this.data.presentProgress) {
        this.setData({
          presentProgress: roundedProgress
        });
        
        // 向父组件报告进度变化
        this.triggerEvent('progresschange', { progress: roundedProgress });
      }
      
      // 禁用动画以避免拖动时的卡顿
      if (!this.data.disableAnimated) {
        this.setData({
          disableAnimated: true
        });
      }
      
      // 延迟恢复动画
      clearTimeout(this.recoverAnimation);
      this.recoverAnimation = setTimeout(() => {
        this.setData({
          disableAnimated: false
        });
        this.recoverAnimation = null;
      }, 100);
    }
  }
}) 