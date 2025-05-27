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

const audioList = [
  {
    "id": "001",
    "name": "绵绵细雨",
    "icon": "/assets/mock-icons/fine-rain.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/fine-rain-back.png",
    "audioUrl": ""
  },
  {
    "id": "002",
    "name": "倾盆大雨",
    "icon": "/assets/mock-icons/thunderstorm.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/thunderstorm-back.png",
    "audioUrl": ""
  },
  {
    "id": "003",
    "name": "浪花涌动",
    "icon": "/assets/mock-icons/wave.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/wave-back.png",
    "audioUrl": ""
  },
  {
    "id": "004",
    "name": "篝火燃烧",
    "icon": "/assets/mock-icons/campfire.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/campfire-back.png",
    "audioUrl": ""
  },
  {
    "id": "005",
    "name": "稻田乐章",
    "icon": "/assets/mock-icons/rice-field.png",
    "listImage": "",
    "backgroundImage": "/assets/mock-back/rice-field-back.png",
    "audioUrl": ""
  }
];

Page({
  data: {
    navBarHeight: navBarHeight,
    audioList: audioList,
    itemWidth: itemWidth, // 直接使用计算好的值
    
    // 播放器显示相关数据
    currentAudio: audioList[0], // 默认显示第一个音频
    isPlaying: false,
    currentTime: "00:00",
    duration: "29:59",
    sliderValue: 0
  },
  
  onLoad() {
    // 页面加载时的初始化逻辑
  },
  
  // 点击音频项
  onTapAudioItem(e) {
    const audioId = e.currentTarget.dataset.id;
    const audioItem = this.data.audioList.find(item => item.id === audioId);
    
    if (audioItem) {
      console.log('点击了音频项：', audioItem.name);
      // 设置当前音频
      this.setData({
        currentAudio: audioItem
      });
      
      // 如果当前没有在播放，自动开始播放
      if (!this.data.isPlaying) {
        this.togglePlay();
      }
    }
  },
  
  // 切换播放/暂停状态
  togglePlay() {
    this.setData({
      isPlaying: !this.data.isPlaying
    });
    
    // 这里应该添加实际的音频播放/暂停逻辑
    if (this.data.isPlaying) {
      console.log('开始播放:', this.data.currentAudio.name);
      // TODO: 实现音频播放
    } else {
      console.log('暂停播放:', this.data.currentAudio.name);
      // TODO: 实现音频暂停
    }
  },
  
  // 处理播放器状态变化
  onPlayerStateChange(e) {
    const { isExpanded } = e.detail;
    console.log('播放器状态变化:', isExpanded ? '已展开' : '已收起');
    
    // 这里可以添加播放器展开/收起时的额外逻辑
    // 例如：当播放器展开时暂停轮播图，或者调整页面其他元素
  },
  
  // 处理播放器进度变化
  onPlayerProgressChange(e) {
    const { progress } = e.detail;
    // console.log('播放器展开进度:', progress);
    
    // 这里可以根据进度值实现一些联动效果
    // 例如：根据progress值调整背景透明度、缩放其他元素等
  },
  
  // 滑块值变化处理
  onSliderChange(e) {
    const value = e.detail.value;
    console.log('滑动到:', value);
    
    // 更新进度条
    this.setData({
      sliderValue: value
    });
    
    // TODO: 实际调整音频播放进度
  }
}); 