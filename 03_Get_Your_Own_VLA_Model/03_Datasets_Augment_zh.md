# 数据集增强

在真实场景中采集数据成本高昂且存在显著局限。例如：

- **环境受限**：数据通常仅在少数固定场景中采集。
- **背景过拟合**：策略网络可能学习到与任务无关的背景特征（如墙壁颜色、光照条件、物体摆放位置），导致策略无法泛化到新环境。
- **采集成本高**：每增加一个场景都需要重新部署、重新校准和重新采集数据。

![机器人模仿学习数据增强对比](../image/0e2f01cf-854d-4b68-88d7-8384ed6d50c7.png)

我们利用最先进的 Cosmos Transfer 模型来修改视频场景，扩展数据集多样性以增强模型鲁棒性。

## 学习目标

- 了解 Nvidia Cosmos3 Transfer 的工作原理
- 使用 Cosmos3 生成 VLA 数据

## Cosmos 简介

**NVIDIA Cosmos** 是一个基础 AI 平台，旨在加速 **具身智能**（如机器人和自动驾驶汽车）的开发。传统 AI 专注于文本和代码，而 Cosmos 专为理解、模拟物理世界并与其交互而构建。

## Cosmos3 Transfer 的工作原理

Cosmos3 Transfer 是一个 **视频到视频 (video-to-video)** 生成模型。它接收三个输入：

| 输入 | 作用 | 示例 |
|---|---|---|
| 源视频 (vision) | 提供时间动态信息 | 机器人侧视角操作视频 |
| 控制信号 (controls) | 约束空间结构，保持机器人形态 | Canny 边缘图 + SAM2 分割图 |
| 文本提示词 (prompt) | 描述目标场景的外观 | "一个带有白色实验台的现代实验室..." |

![COSMOS3 TRANSFER 视频到视频生成模型](../image/fbc2117d-4012-4f52-804c-36214710f971.png)

控制信号（边缘 + 分割）锁定机器人的形状与运动轨迹；文本提示词驱动新背景的生成。

## 控制信号概述

| 控制类型 | 作用 | 是否需要预计算？ |
|---|---|---|
| 边缘 (Edge) | 保持物体轮廓与结构，防止主体变形 | 可选（框架可自动计算 Canny） |
| 分割 (Seg) | 保持语义区域（机器人/物体/背景边界） | 必需（依赖 SAM2） |
| 模糊 (Blur) | 保持全局布局，同时允许更多纹理变化 | 可选（框架可自动计算） |
| 深度 (Depth) | 保持空间深度关系 | 必需（依赖 DepthAnything） |

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 1.5rem 0;">
  <div>
    <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; text-align: center;">边缘控制预览 (Control Edge)</p>
    <video controls autoplay loop muted playsinline style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
      <source src="../video/control_edge.mp4" type="video/mp4">
    </video>
  </div>
  <div>
    <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; text-align: center;">分割控制预览 (Control Seg)</p>
    <video controls autoplay loop muted playsinline style="width: 100%; border-radius: 8px; border: 1px solid var(--nv-border);">
      <source src="../video/control_seg.mp4" type="video/mp4">
    </video>
  </div>
</div>

**最佳实践搭配：** Edge + Seg 双重控制，以 Edge 权重为主导 (0.9)，确保机器人形态不发生扭曲变形。

## 环境配置

### 硬件要求

| 模型规格 | 最小 GPU 显存 | 推荐 GPU 硬件 |
|---|---|---|
| Cosmos3-Nano | ~24 GB | 单卡 RTX 4090 / A5000 / Jetson AGX Thor |
| Cosmos3-Super | ~80 GB × 4 | 4× A100 / H100 |

### 软件安装

```bash
# 克隆 Cosmos 仓库
git clone https://github.com/NVIDIA/Cosmos.git
cd Cosmos

# 进入框架目录
cd packages/cosmos3

# 创建虚拟环境
uv venv --python 3.13
source .venv/bin/activate

# 安装依赖项
uv pip install -e ".[inference]"
```

### 下载模型权重

```bash
# 登录 Hugging Face
huggingface-cli login

# 下载 Cosmos3-Nano 模型权重
hf download nvidia/Cosmos3-Nano --local-dir /path/to/models/Cosmos3-Nano
```

## 准备数据

### 目录结构

```text
your_project/
├── controls/
│   └── episode_000/
│       ├── vision.mp4                # 源视频（机器人操作录像）
│       ├── control_edge.mp4           # Canny 边缘控制图
│       └── control_seg.mp4            # SAM2 分割控制图
├── prompts/
│   ├── kitchen_prompt.json           # 厨房场景提示词
│   ├── lab_prompt.json               # 实验室场景提示词
│   └── workshop_prompt.json          # 车间场景提示词
├── specs/
│   ├── my_kitchen.json               # 厨房场景推理配置
│   ├── my_lab.json                   # 实验室场景推理配置
│   └── my_workshop.json              # 车间场景推理配置
├── negative_prompt.json              # 负向提示词（共享）
└── outputs/                          # 生成结果输出目录
```

### 提取源视频

从机器人数据集提取视频片段：

```bash
# 示例：提取 grab_jetson 数据集中 episode 0 的侧视角视频
ffmpeg -i grab_jetson/videos/chunk-000/observation.images.side/episode_000000.mp4 \
  -c copy your_project/controls/episode_000/vision.mp4
```

### 生成控制信号

**边缘检测 (Edge - Canny edge detection)：**

```python
# 使用 OpenCV 生成边缘控制图
python -c "
import cv2

# 读取源视频
cap = cv2.VideoCapture('your_project/controls/episode_000/vision.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# 写入边缘视频
out = cv2.VideoWriter(
    'your_project/controls/episode_000/control_edge.mp4',
    cv2.VideoWriter_fourcc(*'avc1'), fps, (w, h), isColor=True
)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    out.write(cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR))

cap.release()
out.release()
print(f'Generated {n} frames of edge control')
"
```

**分割图 (Seg - SAM2 segmentation)：** 运行 SAM2 对机器人及其交互物体进行分割。SAM2 需要单独安装，不捆绑在 Cosmos 中。

```bash
# 安装 SAM2
pip install sam2

# 运行分割（具体脚本取决于您的 SAM2 配置）
python your_sam2_script.py \
  --input your_project/controls/episode_000/vision.mp4 \
  --output your_project/controls/episode_000/control_seg.mp4
```

### 编写提示词 (Prompts)

每个提示词均为一个 JSON 文件，详细描述目标场景。以下是三个场景示例：

**厨房场景 (`prompts/kitchen_prompt.json`)：**

```json
{
  "subjects": [{
    "description": "A robotic manipulator with a 6-DOF arm performing a tabletop pick-and-place task",
    "appearance_details": "Black anodized aluminum links, small two-finger gripper with rubber pads",
    "action": "grab the Jetson",
    "pose": "Arm extends toward the object, gripper closes around the object, then lifts clear",
    "state_changes": "Gripper transitions from open to closed, the held object is lifted from tabletop"
  }],
  "background_setting": "A modern kitchen with marble countertops, stainless steel appliances, and ambient warm lighting",
  "lighting": {
    "conditions": "Warm ambient overhead spotlights combined with natural window light",
    "direction": "Soft diagonal key light from the front-left",
    "shadows": "Soft, natural shadows on marble surface"
  },
  "aesthetics": {
    "composition": "Side-view medium shot centered on kitchen counter workspace",
    "color_scheme": "Warm wood tones, marble white, and metallic steel accents",
    "mood_atmosphere": "Clean, domestic, realistic home kitchen setting"
  },
  "cinematography": {
    "camera_motion": "Static",
    "framing": "Medium close shot",
    "camera_angle": "Eye-level"
  },
  "style_medium": "Live-action video",
  "artistic_style": "Realistic, high-definition domestic robotics footage",
  "context": "A realistic side-view kitchen demonstration: a robotic arm grabs and lifts a Jetson module from a kitchen counter",
  "actions": [{
    "time": "0:00-0:25",
    "description": "The robotic arm grabs the Jetson from the kitchen counter over 25 seconds."
  }],
  "temporal_caption": "Over 25 seconds, the robotic arm reaches down to the kitchen counter, grabs a Jetson module with its two-finger gripper, and lifts it into the air",
  "audio_description": "Quiet kitchen ambient sounds, faint servo whirr from the arm; no speech"
}
```

**实验室场景 (`prompts/lab_prompt.json`)：**

```json
{
  "subjects": [{
    "description": "A robotic manipulator with a 6-DOF arm performing a tabletop pick-and-place task",
    "appearance_details": "Black anodized aluminum links, small two-finger gripper with rubber pads",
    "action": "grab the Jetson",
    "pose": "Arm extends toward the object, gripper closes around the object, then lifts clear",
    "state_changes": "Gripper transitions from open to closed, the held object is lifted from tabletop"
  }],
  "background_setting": "A clean robotics research laboratory with white epoxy workbenches, metal shelving, and precision instruments",
  "lighting": {
    "conditions": "Bright, even fluorescent laboratory lighting from overhead panels",
    "direction": "Top-down uniform illumination with minimal shadows",
    "shadows": "Minimal, clinical shadows directly beneath the equipment"
  },
  "aesthetics": {
    "composition": "Side-view medium shot of the robotic workspace with laboratory equipment visible in the background",
    "color_scheme": "White, gray, and metallic surfaces with blue LED indicators.",
    "mood_atmosphere": "Clinical, precise, professional research environment"
  },
  "cinematography": {
    "camera_motion": "Static",
    "framing": "Medium close shot",
    "camera_angle": "Eye-level"
  },
  "style_medium": "Live-action video",
  "artistic_style": "Realistic, documentary-style robotics footage",
  "context": "A realistic side-view laboratory demonstration: a robotic arm grabs and lifts a Jetson module from a workbench",
  "actions": [{
    "time": "0:00-0:25",
    "description": "The robotic arm grabs the Jetson from the lab workbench over 25 seconds."
  }],
  "temporal_caption": "Over 25 seconds, the robotic arm reaches down to the lab workbench, grabs a Jetson module with its two-finger gripper, and lifts it into the air",
  "audio_description": "Quiet laboratory ambient hum, faint servo whirr from the arm; no speech"
}
```

**车间场景 (`prompts/workshop_prompt.json`)：**

```json
{
  "subjects": [{
    "description": "A robotic manipulator with a 6-DOF arm performing a tabletop pick-and-place task",
    "appearance_details": "Black anodized aluminum links, small two-finger gripper with rubber pads",
    "action": "grab the Jetson",
    "pose": "Arm extends toward the object, gripper closes around the object, then lifts clear",
    "state_changes": "Gripper transitions from open to closed, the held object is lifted from tabletop"
  }],
  "background_setting": "An industrial maker workshop with heavy-duty wooden worktables, hanging power tools, and metal storage racks",
  "lighting": {
    "conditions": "Industrial overhead LED task lighting with warm ambient fill",
    "direction": "Direct overhead illumination with industrial contrast",
    "shadows": "Defined, crisp shadows under machinery and tools"
  },
  "aesthetics": {
    "composition": "Side-view medium shot focused on the industrial workbench",
    "color_scheme": "Industrial gray, dark wood, steel, and yellow safety accents",
    "mood_atmosphere": "Rugged, practical, industrial fabrication workshop"
  },
  "cinematography": {
    "camera_motion": "Static",
    "framing": "Medium close shot",
    "camera_angle": "Eye-level"
  },
  "style_medium": "Live-action video",
  "artistic_style": "Realistic, industrial workshop footage",
  "context": "A realistic side-view workshop demonstration: a robotic arm grabs and lifts a Jetson module from an industrial workbench",
  "actions": [{
    "time": "0:00-0:25",
    "description": "The robotic arm grabs the Jetson from the workshop bench over 25 seconds."
  }],
  "temporal_caption": "Over 25 seconds, the robotic arm reaches down to the workshop bench, grabs a Jetson module with its two-finger gripper, and lifts it into the air",
  "audio_description": "Low industrial workshop hum, mechanical gear click; no speech"
}
```

**负向提示词 (`negative_prompt.json`)：**

```json
{
  "prompt": "blur, low quality, distorted robot geometry, warped robotic arm links, extra robotic limbs, unrealistic physics, flickering, oversaturated colors, unnatural shadows, watermarks, text overlays"
}
```

## 编写 Spec 配置文件

Spec 配置文件用于控制所有生成参数：

```json
{
  "name": "my_kitchen",
  "model_mode": "video2video",

  "resolution": "720",
  "aspect_ratio": "4,3",
  "num_frames": 748,
  "fps": 30,

  "shift": 10.0,
  "num_steps": 35,
  "seed": 2026,

  "num_video_frames_per_chunk": 57,
  "num_conditional_frames": 1,
  "num_first_chunk_conditional_frames": 0,
  "share_vision_temporal_positions": true,

  "guidance": 3.0,
  "control_guidance": 1.5,
  "negative_metadata_mode": "none",
  "negative_prompt_keep_metadata": false,

  "negative_prompt_file": "../negative_prompt.json",
  "prompt_path": "../prompts/kitchen_prompt.json",
  "vision_path": "/absolute/path/to/controls/episode_000/vision.mp4",

  "edge": {
    "weight": 0.9,
    "control_path": "/absolute/path/to/controls/episode_000/control_edge.mp4",
    "preset_edge_threshold": "medium"
  },
  "seg": {
    "weight": 0.1,
    "control_path": "/absolute/path/to/controls/episode_000/control_seg.mp4"
  },

  "emphasize_control_in_prompt": false
}
```

## 核心参数详解

### 视频参数 (Video Parameters)

| 参数名称 | 参数说明 | 推荐设定值 |
|---|---|---|
| `resolution` | 输出分辨率桶 | `"720"` (720p) 或 `"480"` (480p)；Jetson 建议使用 `"480"` |
| `aspect_ratio` | 宽高比 | `"4,3"`（适配绝大多数机器人相机）或 `"16,9"` |
| `num_frames` | 视频总帧数 | 必须与源视频帧数一致 |
| `fps` | 帧率 | 必须与源视频帧率一致，通常为 30 |

### 采样参数 (Sampling Parameters)

| 参数名称 | 参数说明 | 推荐设定值 |
|---|---|---|
| `shift` | 流匹配 (Flow-matching) 偏移 | 720p 使用 `10.0`，480p 使用 `5.0` |
| `num_steps` | 采样步数 | `35`（生成更快）至 `50`（质量更高） |
| `seed` | 随机种子 | 任意整数；相同的种子会生成一致的结果 |

### 分块参数（适用于长视频 Chunking Parameters）

| 参数名称 | 参数说明 | 推荐设定值 |
|---|---|---|
| `num_video_frames_per_chunk` | 每个 Chunk 包含的帧数 | `57`（显存紧缺时可设为 33） |
| `num_conditional_frames` | Chunk 之间的重叠条件帧 | `1` |
| `num_first_chunk_conditional_frames` | 首个 Chunk 的额外条件帧数 | `0` |

### 引导参数 (Guidance Parameters)

| 参数名称 | 参数说明 | 推荐设定值 |
|---|---|---|
| `guidance` | 文本 CFG 引导强度 | `3.0`（越高越紧贴 Prompt 描述，但过高可能引入伪影） |
| `control_guidance` | 控制信号 CFG 引导强度 | `1.5`（越高越严格遵循控制信号结构） |
| `edge.weight` | 边缘控制权重 | `0.75 - 0.9`（保护主体形态结构） |
| `seg.weight` | 分割控制权重 | `0.1 - 0.25`（辅助语义一致性） |

> [!NOTE]
> **权重比例是关键：** 相对比例决定控制效果——`edge:0.9, seg:0.1` 与 `edge:9, seg:1` 等价。权重总和建议控制在 1.0 左右。

## 运行推理 (Run Inference)

### 标准 GPU 环境 (x86)

```bash
cd /path/to/cosmos/packages/cosmos3

export TRANSFER_ROOT="/path/to/your_project"

CUDA_VISIBLE_DEVICES=0 \
  .venv/bin/python -m cosmos_framework.scripts.inference \
    --parallelism-preset=latency \
    -i "$TRANSFER_ROOT/specs/my_kitchen.json" \
    -o "$TRANSFER_ROOT/outputs/Cosmos3-Nano/" \
    --checkpoint-path Cosmos3-Nano \
    --seed 2026
```

### Jetson AGX Thor (ARM + L4T)

> [!NOTE]
> **注意：** 本小节仅适用于 Jetson 边缘平台。标准 x86 GPU（RTX 4090, A100, H100 等）请直接使用上一节的标准命令。

Jetson 平台（L4T R39 + CUDA 13.2 + PyTorch 2.10）存在已知的 cuBLASLt Bug：`torch.addmm`（融合矩阵乘法+偏置）会触发 `CUBLAS_STATUS_NOT_INITIALIZED` 错误。需要创建以下两个文件来绕过该问题。

**文件 1：`jetson_cublas_patch.py`**  
**位置：** `packages/cosmos3/jetson_cublas_patch.py`（放置于 Cosmos3 框架根目录）  
**作用：** Patch 补丁 `nn.Linear` 和 `F.linear`，将融合的 `addmm` 操作替换为独立的 `matmul + add`，从而彻底避开 cuBLASLt Bug。

```python
"""Jetson cuBLASLt 变通补丁代码。

PyTorch 2.10 在 Jetson (L4T R39, CUDA 13.2) 上存在一个 Bug：
对于融合的矩阵乘法+偏置操作 (`torch.addmm`)，`cublasLtMatmulAlgoGetHeuristic` 
会返回 `CUBLAS_STATUS_NOT_INITIALIZED`。
该 Patch 重定向 `nn.Linear` 和 `F.linear` 以使用独立的 matmul + add 操作，
彻底避免使用融合的 cuBLASLt 代码路径。
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

def _patched_linear(input, weight, bias=None):
    """替代 F.linear，避免在 Jetson 上触发 torch.addmm (cuBLASLt)。"""
    output = input @ weight.T
    if bias is not None:
        output = output + bias
    return output

def _apply_patch():
    F.linear = _patched_linear
    nn.Linear.forward = lambda self, input: _patched_linear(input, self.weight, self.bias)

_apply_patch()
```

**文件 2：`run_inference_jetson.py`**  
**位置：** `packages/cosmos3/run_inference_jetson.py`（与 `jetson_cublas_patch.py` 在同一目录）  
**作用：** 包装入口脚本，首先导入补丁（触发修复），然后执行标准的推理流程。

```python
#!/usr/bin/env python3
"""在应用 Jetson cuBLASLt 补丁后运行 Cosmos 推理的包装入口脚本。"""
import jetson_cublas_patch  # noqa: F401 - 必须为首个 import
from cosmos_framework.scripts.inference import main

if __name__ == "__main__":
    main()
```

### 目录结构

创建上述文件后，您的目录结构应如下所示：

```text
packages/cosmos3/
├── jetson_cublas_patch.py       # <-- 补丁文件 (新建)
├── run_inference_jetson.py      # <-- 包装入口 (新建)
├── .venv/
├── cosmos_framework/
│   └── scripts/
│       └── inference.py         # <-- 原始入口 (适用于标准 GPU)
└── ...
```

### 在 Jetson 上运行

运行命令与标准 GPU 类似，只需将 `-m cosmos_framework.scripts.inference` 替换为 `run_inference_jetson.py`：

```bash
cd /path/to/cosmos/packages/cosmos3

export TRANSFER_ROOT="/path/to/your_project"
export HF_HUB_OFFLINE=1             # 使用本地缓存的模型权重，避免网络下载失败
export CUDA_VISIBLE_DEVICES=0

.venv/bin/python run_inference_jetson.py \
  --parallelism-preset=latency \
  -i "$TRANSFER_ROOT/specs/my_kitchen.json" \
  -o "$TRANSFER_ROOT/outputs/Cosmos3-Nano/" \
  --checkpoint-path Cosmos3-Nano \
  --seed 2026 \
  --no-use-torch-compile \
  --no-use-cuda-graphs
```

### 参数对比

| 参数 | 标准 GPU | Jetson 平台 | 说明 |
|---|---|---|---|
| 入口脚本 | `-m cosmos_framework.scripts.inference` | `run_inference_jetson.py` | 包装脚本自动加载 Patch 补丁 |
| `--no-use-torch-compile` | 可选（推荐开启加速） | **必需** | torch.compile 在 ARM 架构上存在兼容性问题 |
| `--no-use-cuda-graphs` | 可选 | **必需** | CUDA 图在 Jetson 架构上不稳定 |
| `HF_HUB_OFFLINE=1` | 可选 | **推荐** | 避免 Jetson 网络波动导致在线下载失败 |

### 验证 Patch 补丁

运行推理后，如果您看到模型正常加载并开始采样（显示 `Sampling: 0%` 进度条），说明补丁生效。如果立即报 `CUBLAS_STATUS_NOT_INITIALIZED` 错误，请检查：

1. `jetson_cublas_patch.py` 是否放置在 `packages/cosmos3/` 目录中；
2. `run_inference_jetson.py` 的**第一行**是否导入了该 Patch（必须在所有其他 import 之前）；
3. 是否使用的是 `run_inference_jetson.py` 而非原始的 `-m cosmos_framework.scripts.inference`。

> [!NOTE]
> `--no-use-torch-compile` 和 `--no-use-cuda-graphs` 是 Jetson 平台上的必需参数，以避免 ARM 平台上的编译兼容问题。

## 多场景批量生成 (Batch Generation for Multiple Scenes)

要一次性运行所有场景，可创建 `run_all_scenes.sh` 脚本：

```bash
#!/bin/bash
set -e
cd /path/to/cosmos/packages/cosmos3

export HF_HUB_OFFLINE=1
export CUDA_VISIBLE_DEVICES=0
TRANSFER_ROOT="/path/to/your_project"
OUTDIR="$TRANSFER_ROOT/outputs/Cosmos3-Nano"

echo "=== START: $(date) ==="

for scene in kitchen lab workshop; do
  echo "=== Scene: $scene ($(date)) ==="
  .venv/bin/python run_inference_jetson.py \
    --parallelism-preset=latency \
    -i "$TRANSFER_ROOT/specs/my_${scene}.json" \
    -o "$OUTDIR/" \
    --checkpoint-path Cosmos3-Nano \
    --seed 2026 \
    --no-use-torch-compile \
    --no-use-cuda-graphs
  echo "=== $scene done: $(date) ==="
done

echo "=== ALL DONE: $(date) ==="
```

使用 `nohup` 在后台运行（即使断开 SSH 连接也能持续运行）：

```bash
nohup bash run_all_scenes.sh > /tmp/inference.log 2>&1 &

# 实时监控生成进度
tail -f /tmp/inference.log
```

## 输出目录结构

推理完成后，输出目录结构如下：

```text
outputs/Cosmos3-Nano/
└── my_kitchen/
    ├── vision.mp4                # 生成的增强视频
    ├── control_edge.mp4           # 输入的控制信号（复制）
    ├── control_seg.mp4            # 输入的控制信号（复制）
    ├── sample_args.json           # 完整推理参数记录
    └── sample_outputs.json        # 输出文件清单
```

## 输出效果预览

> [!CAUTION]
> 说明：我们计划将采集场景转移至工控机房。但目前由于设定的分辨率仅为 480p 以及 Prompt 描述词可能存在优化空间，当前生成效果尚非最终最佳状态。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 1.5rem 0; align-items: stretch;">
  <div style="width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 8px; border: 1px solid var(--nv-border); background-color: #000;">
    <video controls autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; border: none; display: block;">
      <source src="../video/vision.mp4" type="video/mp4">
    </video>
  </div>
  <div style="width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 8px; border: 1px solid var(--nv-border); background-color: #000;">
    <video controls autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; border: none; display: block;">
      <source src="../video/vision_ws.mp4" type="video/mp4">
    </video>
  </div>
</div>

## 集成至机器人训练流水线 (Integration into Robot Training Pipeline)

### 数据增强工作流

![机器人数据增强工作流](../image/21144e21-735c-4c08-a3c8-ad7b044bedae.png)

### 核心要点

- **动作标签可直接继承**：Transfer 保持了机器人的运动轨迹，因此原始动作数据（关节角度、夹爪状态）可直接复用于生成后的增强视频。
- **Edge 权重关乎成败**：较高的 Edge 权重 (0.9) 确保机器人主体不发生形态扭曲，这是复用动作标签的安全保障。
- **批量数据扩展**：在每个 episode 上运行该工作流，可成倍扩大训练集场景多样性。

## 常见问题解答 (FAQ)

### Q: 生成视频中机器人发生变形怎么办？
**A:** 提高 `edge.weight`（如 0.9 -> 0.95），降低 `seg.weight`（如 0.1 -> 0.05），并调大 `control_guidance`（如 1.5 -> 2.0）。

### Q: 背景几乎没有变化？
**A:** 调大 `guidance`（如 3.0 -> 4.0），并在 Prompt 中使用更具体详细的场景特征词。

### Q: 在 Jetson 上遇到 CUBLAS_STATUS_NOT_INITIALIZED 错误？
**A:** 使用 `run_inference_jetson.py` 包装入口脚本，它会自动加载并应用针对 Jetson 的 cuBLASLt 补丁。

### Q: 显存不足（OOM）？
**A:** 按以下顺序尝试：
1. 将 `resolution` 降低至 `"480"`
2. 将 `num_video_frames_per_chunk` 减少至 33
3. 将 `guidance` 降低至 1.0（禁用文本 CFG，省去一次前向传播）
4. 将 `control_guidance` 降低至 1.0（禁用控制 CFG，再省去一次前向传播）

### Q: 较长视频画质下降？
**A:** 模型推荐的帧数范围为 [24, 200]。748 帧的 25 秒视频超出了该范围，框架会使用自回归 Chunk 分块生成。调大 `num_video_frames_per_chunk`（如 57 -> 93）可改善 Chunk 间一致性，但会增加显存占用。

### Q: 如何评估增强后的数据质量？
**A:** 建议检查以下三点：
1. **FID/IS 指标**：比较生成视频与真实视频之间的分布距离；
2. **策略迁移测试**：在增强数据上训练策略网络，实测在真实场景中的成功率；
3. **人工抽检**：逐帧观察机器人结构是否正常以及背景是否逼真自然。

## 参考资料

- [Cosmos3 官方文档](https://docs.nvidia.com/cosmos)
- [Cosmos3 Transfer 指南](https://github.com/NVIDIA/Cosmos/tree/main/cookbooks/cosmos3/generator/transfer)
- [Sim-to-Real (So-101) 课程 - 策略 3: Cosmos Transfer](https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/14-strategy3-cosmos.html)
