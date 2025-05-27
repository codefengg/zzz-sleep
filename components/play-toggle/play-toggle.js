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
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换播放状态
    togglePlay() {
      // 触发事件，通知父组件状态变化
      this.triggerEvent('toggle', { playing: !this.properties.playing });
    }
  }
}) 