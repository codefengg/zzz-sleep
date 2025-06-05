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
    isExpanded: false,
    // 是否正在拖动中
    isDragging: false,
    // 过渡临界点的绝对位置
    transitionPoint: 0
  },

  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      const screenHeight = systemInfo.screenHeight;
      
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = systemInfo.statusBarHeight;
      const navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
      
      // 计算迷你播放器高度
      const miniPlayerHeight = 100;
      
      // 判断是否是全面屏
      const isFullScreen = systemInfo.screenHeight > systemInfo.windowHeight;
      // 底部安全区高度
      const safeAreaBottom = isFullScreen ? 34 : 0;
      
      // 底部位置
      const bottomPos = screenHeight - safeAreaBottom - miniPlayerHeight;
      
      // 过渡临界点（距离底部160px的位置）
      const transitionPoint = bottomPos - 60;
            
      // 设置面板位置
      this.setData({
        topPosition: statusBarHeight + navBarHeight,
        bottomPosition: bottomPos,
        panelPosition: bottomPos,
        transitionPoint: transitionPoint
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
      
      this.setData({
        isDragging: true
      });
    },
    
    // 拖动结束
    dragPanelEnd(e) {
      const pageY = e.changedTouches[0].pageY;
      const { topPosition, bottomPosition } = this.data;
      
      // 计算拖动距离和阈值
      const distance = pageY - this.dragOrigin;
      const threshold = (bottomPosition - topPosition) / 10;
      
      // 根据当前位置和拖动距离决定最终位置
      let finalPosition;
      if (this.data.panelPosition === topPosition) {
        finalPosition = distance > threshold ? bottomPosition : topPosition;
      } else {
        finalPosition = distance < -threshold ? topPosition : bottomPosition;
      }
      
      // 只设置位置和状态，不设置presentProgress，让它在动画过程中自然变化
      this.setData({
        panelPosition: finalPosition,
        isExpanded: finalPosition === topPosition
      });
      
      // 延迟关闭拖拽状态，让movable-view动画完成后再切换到静态层
      setTimeout(() => {
        this.setData({
          isDragging: false,
          // 在动画完成后设置最终的presentProgress值
          presentProgress: this.data.isExpanded ? 1 : 0
        });
      }, 300); // 等待动画完成（通常250-300ms）
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    },
    
    // 点击切换面板状态
    togglePanel() {
      const { panelPosition, topPosition, bottomPosition } = this.data;
      const newPosition = panelPosition === topPosition ? bottomPosition : topPosition;
      
      this.setData({
        panelPosition: newPosition,
        isExpanded: newPosition === topPosition,
        presentProgress: newPosition === topPosition ? 1 : 0
      });
      
      // 触发事件通知父组件状态变化
      this.triggerEvent('statechange', { isExpanded: this.data.isExpanded });
    },
    
    // 面板位置变化处理
    onPanelChange(e) {
      // 如果不是拖动状态，忽略处理
      if (!this.data.isDragging) return;
      
      const { y } = e.detail;
      const { transitionPoint } = this.data;
      
      // 过渡区间范围（120px）
      const transitionRange = 180;
      const upperBound = transitionPoint - transitionRange / 2;
      const lowerBound = transitionPoint + transitionRange / 2;
      
      // 计算过渡进度
      let progress;
      if (y <= upperBound) {
        progress = 1;
      } else if (y >= lowerBound) {
        progress = 0;
      } else {
        progress = 1 - ((y - upperBound) / transitionRange);
      }
      
      // 确保进度值在0-1范围内
      const roundedProgress = Math.max(0, Math.min(1, progress));
      
      // 只在进度确实发生变化时才更新，减少不必要的setData
      if (Math.abs(roundedProgress - this.data.presentProgress) > 0.01) {
        this.setData({
          presentProgress: roundedProgress
        });
      }
    }
  }
}) 