const ROW = 4
const NUMBERS = [2, 4];  // 随机生成的数字
const MIN_LENGTH = 50;  // 最起码拖动的长度
const MOVE_DURATION = 0.03;  // 移动的时长

cc.Class({
  extends: cc.Component,

  properties: {
    screenTitle: cc.Label,//分数text
    score: 0,//分数
    blockPrefab: cc.Prefab,//预置格子
    gap: 20,//横向间隔
    bg: cc.Node,//包裹格子的父元素
    audioSuccess: {
      type: cc.AudioClip,
      default: null
    },// 合并音效
    recycle: cc.Button,//重新开始
    gameOverNode: cc.Node,//结束页面
    gameOverScore: cc.Label,//结束分数
    recycle2: cc.Button,// 重新开始，结束页面
    shareButton: cc.Button,// 分享按钮
  },

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},
  onLoad: function () {
    this.recycle.node.on('click', this.recycleCallback, this);
    this.recycle2.node.on('click', this.recycleCallback, this);
    this.shareButton.node.on('click', this.shareCallback, this);
  },

  recycleCallback: function (button) {
    this.restart();
  },

  shareCallback: function (button) {
    cc.loader.loadRes("share", function (err, data) {
      wx.shareAppMessage({
        title: "智商不足？快来充值！",
        imageUrl: data.url,
        success(res) {
          console.log(res)
        },
        fail(res) {
          console.log(res)
        }
      })
    });
  },

  start() {
    this.drawBlocks();
    this.init();
    this.addEventHandler();

    wx.showShareMenu({withShareTicket: true})//开启右上角的分享按钮

    //分享按钮事件监听
    cc.loader.loadRes("share", function (err, data) {
      //share为分享的图片名称这是路径（assets/resources/share）
      wx.onShareAppMessage(function (res) {
        return {
          title: "智商不足？快来充值！",//分享的标题
          imageUrl: data.url,
          success(res) {
            console.log(res)
          },
          fail(res) {
            console.log(res)
          }
        }
      })
    });

  },

  drawBlocks() {
    this.blockSize = (cc.winSize.width - this.gap * (ROW + 1)) / 4;
    let x = this.gap + this.blockSize / 2;
    let x0 = x;
    let y = this.blockSize;
    this.positions = [];
    for (let i = 0; i < ROW; i++) {
      this.positions.push([0, 0, 0, 0]);
      for (let j = 0; j < ROW; j++) {
        let block = cc.instantiate(this.blockPrefab);
        block.width = this.blockSize;
        block.height = this.blockSize;
        this.bg.addChild(block);
        block.setPosition(cc.v2(x, y));
        block.getComponent("block").setNumber(0);
        this.positions[i][j] = cc.v2(x, y);
        x += this.gap + this.blockSize;
      }
      y += this.gap + this.blockSize;
      x = x0;
    }
  },

  init() {
    this.resetScore(0);
    if (this.blocks) {
      for (let i = 0; i < ROW; i++) {
        for (let j = 0; j < ROW; j++) {
          if (this.blocks[i][j] != null) {
            this.blocks[i][j].destroy();
          }
        }
      }
    }
    this.data = [];
    this.blocks = [];
    for (let i = 0; i < ROW; i++) {
      this.blocks.push([null, null, null, null])
      this.data.push([0, 0, 0, 0])
    }
    this.addBlock();
    this.addBlock();
    this.addBlock();
  },


  updateScore(number) {
    this.score += number;
    this.screenTitle.string = "分数：" + this.score
  },

  resetScore() {
    this.score = 0;
    this.screenTitle.string = "分数：" + this.score
  },

  /**
   * 找出空闲的块
   * @return 空闲块的位置表示
   */
  getEmptyLocations() {
    let locations = [];
    for (let i = 0; i < this.blocks.length; ++i) {
      for (let j = 0; j < this.blocks[i].length; ++j) {
        if (this.blocks[i][j] == null) {
          locations.push({
            x: i,
            y: j
          });
        }
      }
    }
    return locations;
  },

  addBlock() {
    let locations = this.getEmptyLocations();
    if (locations.length == 0) return false;
    let location = locations[Math.floor(Math.random() * locations.length)];
    let x = location.x;
    let y = location.y;
    let position = this.positions[x][y];
    let block = cc.instantiate(this.blockPrefab);
    block.width = this.blockSize;
    block.height = this.blockSize;
    this.bg.addChild(block);
    block.setPosition(position);
    let number = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    block.getComponent('block').setNumber(number);
    this.blocks[x][y] = block;
    this.data[x][y] = number;
    return true;
  },

  addEventHandler() {
    this.bg.on('touchstart', (event) => {
      this.startPoint = event.getLocation();
    });

    this.bg.on('touchend', (event) => {
      this.touchEnd(event);
    });

    this.bg.on('touchcancel', (event) => {
      this.touchEnd(event);
    });
  },

  touchEnd(event) {
    this.endPoint = event.getLocation();

    // let vec = cc.pSub(this.endPoint, this.startPoint);
    let vec = this.endPoint.sub(this.startPoint);
    if (vec.mag() > MIN_LENGTH) {
      if (Math.abs(vec.x) > Math.abs(vec.y)) {
        // 水平方向
        if (vec.x > 0) {
          this.moveRight();
        } else {
          this.moveLeft();
        }
      } else {
        // 竖直方向
        if (vec.y > 0) {
          this.moveUp();
        } else {
          this.moveDown();
        }
      }
    }
  },

  checkFail() {
    for (let i = 0; i < ROW; ++i) {
      for (let j = 0; j < ROW; ++j) {
        let n = this.data[i][j];
        if (n == 0) return false;
        if (j > 0 && this.data[i][j - 1] == n) return false;
        if (j < ROW - 1 && this.data[i][j + 1] == n) return false;
        if (i > 0 && this.data[i - 1][j] == n) return false;
        if (i < ROW - 1 && this.data[i + 1][j] == n) return false;
      }
    }
    return true;
  },

  gameOver() {
    this.gameOverNode.active = true;
    this.gameOverScore.string = this.score;
  },

  afterMove(hasMoved, addScore) {
    if (hasMoved) {
      this.updateScore(addScore);
      this.addBlock();
    }
    if (this.checkFail()) {
      this.gameOver();
    }
  },

  /**
   * 移动格子
   * @param {cc.Node} block 待移动块
   * @param {cc.p} position  块的位置
   * @param {func} callback 移动完回调
   */
  doMove(block, position, callback) {
    let action = cc.moveTo(MOVE_DURATION, position);
    let finish = cc.callFunc(() => {
      callback && callback()
    });
    block.runAction(cc.sequence(action, finish));
  },

  /**
   * 合并操作
   * @param {cc.Node} b1 块1
   * @param {cc.Node} b2 块2
   * @param {int} num 新的数值
   * @param {Func} callback 完成后回调
   */
  doMerge(b1, b2, num, callback) {
    cc.audioEngine.play(this.audioSuccess, false, 1);
    b1.destroy();  // 合并后销毁
    let scale1 = cc.scaleTo(0.1, 1.1);
    let scale2 = cc.scaleTo(0.1, 1);
    let mid = cc.callFunc(() => {
      b2.getComponent('block').setNumber(num);
    });
    let finished = cc.callFunc(() => {
      callback && callback()
    });
    b2.runAction(cc.sequence(scale1, mid, scale2, finished));
  },

  moveLeft() {
    cc.log('move left');
    let hasMoved = false;
    let addScore = 0;
    let move = (x, y, callback) => {
      if (y == 0 || this.data[x][y] == 0) {
        callback && callback();
        return;
      } else if (this.data[x][y - 1] == 0) {
        // 移动
        let block = this.blocks[x][y];
        let position = this.positions[x][y - 1];
        this.blocks[x][y - 1] = block;
        this.data[x][y - 1] = this.data[x][y];
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x, y - 1, callback);
        });
        hasMoved = true;
      } else if (this.data[x][y - 1] == this.data[x][y]) {
        // 合并
        let block = this.blocks[x][y];
        let position = this.positions[x][y - 1];
        this.data[x][y - 1] *= 2;
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          this.doMerge(block, this.blocks[x][y - 1], this.data[x][y - 1], () => {
            callback && callback();
          });
        });
        hasMoved = true;
        addScore += this.data[x][y - 1];

      } else {
        callback && callback();
        return;
      }
    };

    let toMove = [];
    for (let i = 0; i < ROW; ++i) {
      for (let j = 0; j < ROW; ++j) {
        if (this.data[i][j] != 0) {
          toMove.push({x: i, y: j});
        }
      }
    }

    let counter = 0;
    for (let i = 0; i < toMove.length; ++i) {
      move(toMove[i].x, toMove[i].y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, addScore);
        }
      });
    }
  },

  moveRight() {
    cc.log('move right');
    let hasMoved = false;
    let addScore = 0;
    let move = (x, y, callback) => {
      if (y == ROW - 1 || this.data[x][y] == 0) {
        callback && callback();
        return;
      } else if (this.data[x][y + 1] == 0) {
        // 移动
        let block = this.blocks[x][y];
        let position = this.positions[x][y + 1];
        this.blocks[x][y + 1] = block;
        this.data[x][y + 1] = this.data[x][y];
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x, y + 1, callback);
        });
        hasMoved = true;
      } else if (this.data[x][y + 1] == this.data[x][y]) {
        // 合并
        let block = this.blocks[x][y];
        let position = this.positions[x][y + 1];
        this.data[x][y + 1] *= 2;
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          this.doMerge(block, this.blocks[x][y + 1], this.data[x][y + 1], () => {
            callback && callback();
          });
        });
        hasMoved = true;
        addScore += this.data[x][y + 1];

      } else {
        callback && callback();
        return;
      }
    };

    let toMove = [];
    for (let i = 0; i < ROW; ++i) {
      for (let j = ROW - 1; j >= 0; --j) {
        if (this.data[i][j] != 0) {
          toMove.push({x: i, y: j});
        }
      }
    }

    let counter = 0;
    for (let i = 0; i < toMove.length; ++i) {
      move(toMove[i].x, toMove[i].y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, addScore);
        }
      });
    }
  },

  moveUp() {
    cc.log('move up');

    let hasMoved = false;
    let addScore = 0;

    let move = (x, y, callback) => {
      if (x == ROW - 1 || this.data[x][y] == 0) {
        callback && callback();
        return;
      } else if (this.data[x + 1][y] == 0) {
        // 移动
        let block = this.blocks[x][y];
        let position = this.positions[x + 1][y];
        this.blocks[x + 1][y] = block;
        this.data[x + 1][y] = this.data[x][y];
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x + 1, y, callback);
        });
        hasMoved = true;
      } else if (this.data[x + 1][y] == this.data[x][y]) {
        // 合并
        let block = this.blocks[x][y];
        let position = this.positions[x + 1][y];
        this.data[x + 1][y] *= 2;
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          this.doMerge(block, this.blocks[x + 1][y], this.data[x + 1][y], () => {
            callback && callback();
          });
        });
        hasMoved = true;
        addScore += this.data[x + 1][y];

      } else {
        callback && callback();
        return;
      }
    };

    let toMove = [];
    for (let i = ROW - 1; i >= 0; --i) {
      for (let j = 0; j < ROW; ++j) {
        if (this.data[i][j] != 0) {
          toMove.push({x: i, y: j});
        }
      }
    }

    let counter = 0;
    for (let i = 0; i < toMove.length; ++i) {
      move(toMove[i].x, toMove[i].y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, addScore);
        }
      });
    }
  },

  moveDown() {
    cc.log('move down');

    let hasMoved = false;
    let addScore = 0;

    let move = (x, y, callback) => {
      if (x == 0 || this.data[x][y] == 0) {
        callback && callback();
        return;
      } else if (this.data[x - 1][y] == 0) {
        // 移动
        let block = this.blocks[x][y];
        let position = this.positions[x - 1][y];
        this.blocks[x - 1][y] = block;
        this.data[x - 1][y] = this.data[x][y];
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x - 1, y, callback);
        });
        hasMoved = true;
      } else if (this.data[x - 1][y] == this.data[x][y]) {
        // 合并
        let block = this.blocks[x][y];
        let position = this.positions[x - 1][y];
        this.data[x - 1][y] *= 2;
        this.data[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          this.doMerge(block, this.blocks[x - 1][y], this.data[x - 1][y], () => {
            callback && callback();
          });
        });
        hasMoved = true;
        addScore += this.data[x - 1][y];
      } else {
        callback && callback();
        return;
      }
    };

    let toMove = [];
    for (let i = 0; i < ROW; ++i) {
      for (let j = 0; j < ROW; ++j) {
        if (this.data[i][j] != 0) {
          toMove.push({x: i, y: j});
        }
      }
    }

    let counter = 0;
    for (let i = 0; i < toMove.length; ++i) {
      move(toMove[i].x, toMove[i].y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, addScore);
        }
      });
    }
  },

  restart() {
    this.init();
    this.gameOverNode.active = false;
  },
});
