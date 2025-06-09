Component({
  properties: {
    // 当前选中的时间（分钟）
    value: {
      type: Number,
      value: 0
    },
    // 可选的时间项
    timerItems: {
      type: Array,
      value: []
    },
    // 快捷选项
    quickOptions: {
      type: Array,
      value: [5, 30, 60]
    }
  },
  
  data: {
    timerSelectedIndex: 0
  },
  
  observers: {
    'value': function(value) {
      // 根据value找到对应的索引
      const index = this.data.timerItems.findIndex(item => parseInt(item) === value);
      if (index !== -1) {
        this.setData({
          timerSelectedIndex: index
        });
      }
    }
  },
  
  methods: {
    // 选择器变化事件
    onTimerPickerChange(e) {
      const index = e.detail.value[0];
      const value = parseInt(this.data.timerItems[index]);
      this.triggerEvent('change', { value });
    },
    
    // 快捷选择事件
    onTimerQuickSelect(e) {
      const value = parseInt(e.currentTarget.dataset.value);
      this.triggerEvent('quickselect', { value });
    },
    
    // 保存按钮点击事件
    onSave() {
      const value = parseInt(this.data.timerItems[this.data.timerSelectedIndex]);
      this.triggerEvent('save', { value });
    }
  }
}) 