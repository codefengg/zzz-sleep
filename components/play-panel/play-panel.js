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
    // 过渡临界点距离底部的固定距离（单位rpx）
    transitionThreshold: 300,
    // 计算得到的过渡临界点的绝对位置
    transitionPoint: 0,
    // 过渡区间范围（单位rpx）- 在这个范围内完成从0到1的过渡
    transitionRange: 300
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
      
      // 计算临界点距离和过渡范围（将rpx转为px）
      const thresholdPx = this.data.transitionThreshold * (screenWidth / 750);
      const rangePx = this.data.transitionRange * (screenWidth / 750);
      
      // 底部位置
      const bottomPos = screenHeight - safeAreaBottom - miniPlayerHeight;
      
      // 计算过渡临界点的绝对位置（距离底部固定距离的位置）
      const transitionPoint = bottomPos - thresholdPx;
            
      // 设置面板位置
      this.setData({
        topPosition: statusBarHeight + navBarHeight,
        bottomPosition: bottomPos,
        panelPosition: bottomPos,
        transitionPoint: transitionPoint,
        transitionRangePx: rangePx
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
      
      // 设置拖动标志，启用过渡层
      this.setData({
        isDragging: true,
        disableAnimated: true
      });
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
      
      // 设置最终状态，同时禁用过渡层
      this.setData({
        panelPosition: finalPosition,
        isExpanded: finalPosition === topPosition,
        isDragging: false,
        disableAnimated: false,
        presentProgress: finalPosition === topPosition ? 1 : 0
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
      // 如果不是拖动状态，忽略处理
      if (!this.data.isDragging) return;
      
      const { y } = e.detail;
      const { transitionPoint, transitionRangePx } = this.data;
      
      // 计算过渡区间的上下边界
      const upperBound = transitionPoint - transitionRangePx / 2;
      const lowerBound = transitionPoint + transitionRangePx / 2;
      
      // 计算平滑过渡的进度值
      let progress;
      
      if (y <= upperBound) {
        // 在上边界之上，保持完全显示展开内容
        progress = 1;
      } else if (y >= lowerBound) {
        // 在下边界之下，保持完全显示迷你内容
        progress = 0;
      } else {
        // 在过渡区间内，线性计算进度
        progress = 1 - ((y - upperBound) / transitionRangePx);
      }
      
      // 确保进度值在0-1范围内
      const roundedProgress = Math.max(0, Math.min(1, progress));
      
      if (roundedProgress !== this.data.presentProgress) {
        this.setData({
          presentProgress: roundedProgress
        });
        
        // 向父组件报告进度变化
        this.triggerEvent('progresschange', { progress: roundedProgress });
      }
    }
  }
}) 