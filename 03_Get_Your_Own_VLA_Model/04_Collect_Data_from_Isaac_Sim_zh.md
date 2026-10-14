# 从 Isaac Sim 采集数据

本章节介绍如何使用 reBot Arm 102 Leader 实时控制 Isaac Sim 中的 B601 机械臂，并把"将三个小瓶放入瓶架"的人类示教采集为 LeRobot Dataset v3 数据集。

> [!NOTE]
> 本章为可选章节。建议先跑通完整的真实世界闭环（真实采集 → 训练 → 真实环境评估，即 3.1–3.3 节），再回来学习本章：仿真数据不占用真实机械臂，能够以极低成本扩展场景与光照多样性，适合在真实流水线验证通过后作为数据补充。

![Isaac Sim 遥操作演示](../image/8月9日.gif)

## 学习目标

- 了解 Nvidia Isaac Sim 仿真工具
- 了解工作空间的相机布局：腕部 `front` 相机、固定 `side` 相机与顶部 `external` 相机
- 生成一份完整的 `VLA` 训练数据集

## 数据采集流程

本项目的数据链路如下：

```text
reBot Arm 102 Leader
       | USB-UART
       ▼
LeRobot Python bridge -- UDP 127.0.0.1:5005 --> Isaac Sim B601
                                                        |
                                   +--------------------+--------------------+
                                   |                    |                    |
                                   ▼                    ▼                    ▼
                              action/state         front camera        external camera
                                   |                    |                    |
                                   +--------------------+--------------------+
                                                        |
                                                        ▼
                                                 LeRobot Dataset v3
```

`Leader` 仅提供手动控制指令，仿真机械臂不会自主执行抓取轨迹。系统同时记录：

- `action`：`Leader` 的 6 个关节与夹爪指令；
- `observation.state`：仿真 B601 的 6 个关节与夹爪状态；
- `observation.images.front`：随腕部移动的相机图像；
- `observation.images.external`：工作面上方数据采集相机拍摄的俯视图像；
- 任务文本（`Put the three vials into the vial rack`）、随机化参数以及任务成功状态。

默认采集频率为 30 `FPS`。两路记录相机的分辨率均为 640 × 480。界面中还会打开一个围栏内固定的 `side` 相机视图，它仅用于观察，不会写入数据集。

## 相机画面

按 `R` 重置场景后，三路相机的画面如下。其中 `front` 与 `external` 是数据集里实际记录的两路视频流：

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin: 1.5rem 0;">
  <figure style="margin: 0;">
    <img src="../image/camera_preview_front.png" alt="腕部相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">front（腕部安装，随手臂移动）</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../image/camera_preview_side.png" alt="侧视相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">side（围栏内固定，仅观察）</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../image/camera_preview_external.png" alt="顶部相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">external（顶部俯视，录制）</figcaption>
  </figure>
</div>

> [!NOTE]
> `front` 画面下方出现夹爪与相机支架硬件属于正常现象——腕部相机安装在镜头前端、沿手臂方向取景。可用 `./run.sh --single-viewport` 只保留主视口、隐藏三个浮动相机窗口，录制不受影响。

## 可选任务：两支笔和橡皮放进笔筒

除了默认的小瓶任务，工程还内置一个可选的 `stationery` 场景：固定笔筒放在工作面 `(-0.16, 0.12) m` 处，两支笔和一块橡皮作为可抓取物体。机器人、围栏与三路相机和默认场景完全一致，场景文件会在首次启动时自动生成：

```bash
./run.sh --variant stationery
```

按 `R` 重置后，三路相机的画面如下（`front` 与 `external` 是数据集实际记录的两路视频流）：

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin: 1.5rem 0;">
  <figure style="margin: 0;">
    <img src="../image/camera_preview_stationery_front.png" alt="stationery 场景腕部相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">front（腕部安装，录制）</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../image/camera_preview_stationery_side.png" alt="stationery 场景侧视相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">side（固定，仅观察）</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="../image/camera_preview_stationery_external.png" alt="stationery 场景顶部相机画面" style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
    <figcaption style="text-align: center; font-size: 0.875rem; margin-top: 0.5rem;">external（顶部俯视，录制）</figcaption>
  </figure>
</div>

采集流程与默认场景完全相同（`R` 重置 / `S` 录制 / `C` 丢弃），三件文具都稳定放进笔筒时 episode 判定成功。数据写入独立目录，不会和默认的小瓶数据混在一起：

```bash
~/rebot-arm-dli-isaacsim/datasets/rebot_stationery_pencil_cup
# 任务文本: Put the two pens and the eraser into the pencil cup
```

> [!NOTE]
> 两个任务的场景文件都把渲染模式保存为 Path Tracing，因此 GUI 视口与上方截图一样干净、无噪点（代价是渲染负载更高）。显存较小的机器上如遇卡顿，见项目教程"已知问题"一节的缓解措施。

## 环境要求

开始前请确认以下条件：

- Ubuntu 22.04；
- NVIDIA RTX 显卡，**显存 ≥ 12GB**，且 Isaac Sim 6.1 能够正常启动；
- Isaac Sim 默认安装在 `~/isaacsim`；
- LeRobot 环境位于 `~/rebot_lerobot/.venv`，并且安装了数据集扩展依赖（见 3.1 节）：`uv pip install -e "./lerobot[dataset,viz]"`。缺少它们时，录制的 episode 会转换失败（终端出现 `[dataset-error]`），数据集可视化工具也不可用；
- reBot Arm 102 Leader 已通过 USB-UART 连接至计算机并完成校准；
- 已安装 `git-lfs`（本项目的 USD 资产使用 Git LFS 存储）。

> [!WARNING]
> 请使用显存 ≥ 12GB 的 RTX 显卡。8GB 显存（如大多数笔记本 GPU）在本工程的渲染负载下可能拖死桌面合成器，导致整机"死机"，即使启用了内置防护也存在风险。详情与部分缓解措施见项目教程 `TUTORIAL_zh.md` 第 1、10 节。

推荐的目录结构如下：

```text
~
├── isaacsim/
└── rebot_lerobot/
    └── .venv/bin/python
```

## 下载源码

在 Ubuntu 主机的终端中运行以下命令：

```bash
sudo apt update
sudo apt install -y git-lfs

cd ~
git clone https://github.com/Seeed-Projects/rebot-arm-dli-isaacsim.git
cd rebot-arm-dli-isaacsim
git lfs install
git lfs pull
```

> [!WARNING]
> 机器人、相机支架、工作台、小瓶与瓶架资产均使用 Git LFS 存储。未执行 `git lfs pull` 时，克隆下来的只是几百字节的指针文件，Isaac Sim 将无法打开场景。

## 启动 Isaac Sim 遥操作

进入项目目录并启动：

```bash
cd ~/rebot-arm-dli-isaacsim
./run.sh --leader-port /dev/ttyUSB0
```

如果只有一个 `/dev/ttyUSB*` 设备，也可以让程序自动检测：

```bash
./run.sh
```

如果 Isaac Sim 安装在其他目录：

```bash
ISAACSIM_ROOT=/path/to/isaacsim ./run.sh --leader-port /dev/ttyUSB0
```

首次启动需要几分钟做着色器编译，属于正常现象。启动完成后，终端应显示：

![Isaac Sim 启动终端输出](../image/e7f5a5d8-3e3e-4212-9e9d-eb0e428b40f8.png)

## 采集一个 episode

确保 Isaac Sim 视口已获得键盘焦点，然后按顺序执行以下操作：

1. 按 `R` 重置场景。三个小瓶将被重新放置，并对物体与光照进行随机化处理；
2. 检查三路相机画面（见上文）以及小瓶的初始位置；
3. 按 `S` 开始录制。终端应显示：

```text
[record] Episode started at 30 FPS -> .../datasets/rebot_stationery_front_side
```

4. 操作 leader，将三个小瓶依次放入瓶架（四个插槽任选）；
5. 松开夹爪，等待小瓶在瓶架中稳定；
6. 终端出现 `[SUCCESS]` 后，按 `S` 结束并保存 episode；
7. 等待后台编码完成，直到终端出现以下信息：

```text
[dataset] Episode saved; total completed: 1
```

系统将在后台将临时 JPEG、action 和 state 转换为 LeRobot Dataset v3，编码过程中即可开始下一次操作。退出程序时，如果仍有未处理完的 episode，程序会等待后台任务完成。

## 键盘快捷键

| 按键 | 功能 |
|---|---|
| `R` | 重置三个小瓶并重新随机化 |
| `S` | 开始录制；录制中再次按下则结束并保存 |
| `C` | 取消当前 episode，不写入数据集 |

若示教过程中小瓶掉落、抓取失败、动作质量不佳或相机被遮挡，可按 `C` 丢弃当前 episode，然后按 `R` 开始下一次数据采集。

采集数据的默认输出目录为：

```bash
~/rebot-arm-dli-isaacsim/datasets/rebot_stationery_front_side
```

> [!NOTE]
> 如果要使用这份仿真数据集训练 GR00T 1.7（见 3.2 节），请把 `modality.json` 的 `video.side.original_key` 从 `observation.images.side` 改为 `observation.images.external`（3.1 节采集的真实数据集仍是 `side`）。

## 检查与可视化数据集

可使用 LeRobot 可视化工具快速检查采集的数据，在终端中运行以下命令：

```bash
cd ~/rebot_lerobot
source .venv/bin/activate

lerobot-dataset-viz \
    --repo-id local/rebot_stationery_front_side \
    --root ~/rebot-arm-dli-isaacsim/datasets/rebot_stationery_front_side \
    --mode local \
    --episode-index 0 \
    --display-compressed-images false
```

依次检查不同 episode，确认 action、状态以及两路视频流的时间同步，画面中无黑帧、卡顿或严重遮挡。

![Isaac Sim 数据集可视化工具界面](../image/2564b0ac-fbac-4b4e-baf5-38b7f613ae73.png)

## 在 Isaac Sim 中回放动作

首先启动一个不连接 Leader、不录制数据、且关闭随机化的 Isaac Sim 接收端：

```bash
cd ~/rebot-arm-dli-isaacsim
./run.sh --no-start-bridge --no-recording --no-dr
```

然后打开第二个终端，回放第 0 个 episode：

```bash
cd ~/rebot-arm-dli-isaacsim
../rebot_lerobot/.venv/bin/python \
    scripts/replay_episode.py --episode 0
```

可通过添加 `--loop` 启用循环播放：

```bash
../rebot_lerobot/.venv/bin/python \
    scripts/replay_episode.py --episode 0 --loop
```

回放脚本发送的是数据集中的 `action` 数据，用于检查机械臂的运动轨迹；它不是双摄像头视频播放器，相机内容应使用 LeRobot 数据集可视化工具进行检查。

## 无主臂验证（可选）

如果暂时没有主臂，也可以用内置的 mock 主臂验证整套链路：

```bash
cd ~/rebot-arm-dli-isaacsim
./run.sh --test                     # 物理与抓取回归，约 3 分钟
./run.sh --test --test-recording    # 附加相机录制与数据集写入验证
```

最终出现 `[SUCCESS]` 即代表：全部 USD 资产正常加载、场景构建正常、物理/夹爪/抓取正常、数据集写入正常，全程不需要任何硬件。

## 配置与参考资料

项目中的主要配置文件：

- `config/teleop_config.json`：串口、UDP、关节映射与抓取辅助；
- `config/domain_randomization.json`：物体、光照、相机与数据集参数；
- `config/grasp_config.json`：场景物体、物理参数与任务成功条件；
- `scripts/capture_camera_previews.py`：headless 截图脚本，可重新生成本章节使用的相机画面。
