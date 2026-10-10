# Collect Data from Real Env

This article will guide you through collecting the training dataset required for GR00T. Before getting started, please ensure that `lerobot` is installed on your system.

## Learning Objectives

- Understand the basic usage of the lerobot data collection script.
- Generate a complete `VLA` training dataset.

## Prepare the code and runtime environment

### Install UV

Before creating the Python virtual environment, install `uv`. Otherwise, the shell will report an error such as `uv: command not found`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
uv --version
```

If a version number is displayed, `uv` is ready. You can now prepare the workspace and create the virtual environment.

### Prepare Runtime Environment
Open a terminal and execute:

```bash
mkdir ~/rebot_lerobot
cd ~/rebot_lerobot
sudo apt update
sudo apt install -y ffmpeg

# Download github repo
git clone https://github.com/Seeed-Projects/lerobot.git
git clone https://github.com/Seeed-Projects/lerobot-teleoperator-rebot-arm-102.git
git clone https://github.com/Seeed-Projects/lerobot-robot-seeed-b601.git

# Create virtual environment (Python 3.12)
uv venv --python 3.12 .venv

# Activate environment
source .venv/bin/activate

# Upgrade pip (optional)
uv pip install --upgrade pip

# Install lerobot main project (editable mode)
uv pip install -e ./lerobot

# Add local dependency packages (editable install)
uv pip install -e ./lerobot-teleoperator-rebot-arm-102
uv pip install -e ./lerobot-robot-seeed-b601
uv pip install motorbridge
```

> [!NOTE]
> The runtime environment only needs to be configured once. If you have previously set up the environment, you can quickly enter the workspace and activate the virtual environment by running:  
> `cd ~/rebot_lerobot && source .venv/bin/activate`

## Test the camera

If you are unsure of the camera ID, use the camera detection and preview tool provided by LeRobot to check which cameras are available on your computer and find their corresponding IDs. Please enter the `lerobot-find-cameras` command in the terminal. After the program finishes executing, you can find the preview images in `~/rebot_lerobot/outputs/captured_images` folder.

The naming convention for the preview images is: `<lowercase_camera_type>_dev_<camera_id>.png`.

![Camera Output Preview](../image/7d108cf2-08f5-4dcd-82a9-1b0c96855c30.png)

You can determine the camera device ID based on the preview image filename. For example, a preview image named `opencv_0.png` corresponds to the device: `/dev/video0`.

> [!WARNING]
> Note that the `/dev/videoX` index may change after reconnecting a USB camera or rebooting the device. Therefore, it is recommended to run `lerobot-find-cameras` once before data collection to verify the current camera IDs.

## Start the data collection program

First grant permissions to the serial ports:

```bash
# Leader
sudo chmod 666 /dev/ttyUSB*
# Follower
sudo ip link set can0 down 2>/dev/null
sudo ip link set can0 type can bitrate 1000000 restart-ms 100
sudo ip link set can0 up
```

Then start data collection:

```bash
lerobot-record   \
    --robot.type=seeed_b601_rs_follower  \
    --robot.port=can0 \
    --robot.id=follower1 \
    --robot.can_adapter=socketcan \
    --robot.cameras="{ front: {type: opencv, index_or_path: 6, width: 640, height: 480, fps: 30, fourcc: "YUYV"}, side: {type: opencv, index_or_path: 0, width: 640, height: 480, fps: 30, fourcc: "YUYV"}}" \
    --teleop.type=rebot_arm_102_leader \
    --teleop.port=/dev/ttyUSB0 \
    --teleop.id=rebot_arm_102_leader \
    --display_data=true \
    --dataset.repo_id=seeed_rebot_b601_rs/organize_stationery \
    --dataset.num_episodes=100 \
    --dataset.single_task="Organize stationery"  \
    --dataset.push_to_hub=false \
    --dataset.episode_time_s=25  \
    --dataset.reset_time_s=5
```

<details class="callout-box caution">
<summary class='callout-title'><span><i class='fas fa-radiation'></i> CAUTION<span style='color: var(--text-primary); font-weight: 400; font-size: 1.025rem; display: block; margin-top: 0.4rem;'>If the robotic arm becomes uncontrollable: three-level emergency stop procedure</span></span></summary>

During teleoperation, if power is lost, power contact is poor, or a signal cable detaches, **stop the program, return the arm to the zero position, and then reconnect power**. Otherwise, corrupted data may cause the arm to lose control.

#### Level 1: Software Stop
```Plain
Press ESC or Ctrl+C
# disable_torque_on_disconnect: True automatically disables motor torque
```

#### Level 2: Disconnect CAN (if Ctrl+C does not work and the arm keeps moving)
```Bash
sudo ip link set can0 down
```

This cuts the command path from the PC to the follower arm. The arm stops after it no longer receives commands.

#### Level 3: Cut physical power (if the arm still moves after CAN is disconnected)
```Plain
1. Cut the leader arm power (12 V) — cuts teleoperation input
2. Cut the follower arm power (48 V) — cuts motor power
3. Unplug USB-CAN — ensures no residual commands
```

> Order is critical: cut the motor first → then the signal line → finally power.
>
> Do not unplug the USB data cable first. Some controllers execute cached commands when communication is lost.

#### Recovery
```Plain
1. Manually return the arm to the zero position (gripper fully closed)
2. Connect the follower arm 48 V power
3. Connect the leader arm 12 V power
4. Plug in the USB cable and USB-CAN
5. Reconfigure CAN (ip link set can0 ...)
6. Reapply serial permissions (chmod 666)
7. Run lerobot-record again
```

#### Pre-run Checklist

- `lerobot-find-cameras` has been run and the current front/side indices are confirmed
- `--display_data` is set to `false`
- `brltty` is removed (`sudo apt remove brltty`)
- `/dev/ttyUSB*` permissions are set
- `can0` status is `UP`
- USB-CAN adapter is recognized
- Follower arm 48 V power is connected
- Leader arm 12 V power is connected
- Both arms are calibrated
- Terminal is in the virtual environment (`source .venv/bin/activate`)
</details>
> [!CAUTION]
> Please ensure that you have configured the access permissions for the robotic arm port.

> [!CAUTION]
> If the robotic arm suddenly freezes during collection, the episode time may be too short. Increase `--dataset.episode_time_s=25` to `90`.

> [!WARNING]
> Please ensure that you have entered the correct camera parameters.

The `record` function of lerobot provides a suite of tools for capturing and managing data during robot operation.

### 1. Data Storage

- Data is stored using the `LeRobotDataset` format and is stored on disk during recording.
- By default, the dataset is pushed to your Hugging Face page after recording.
- To disable uploading, use: `--dataset.push_to_hub=False`.

### 2. Checkpointing and Resuming

- Checkpoints are automatically created during recording.
- To resume after an interruption, re-run the same command with: `--resume=true`.
- To start recording from scratch, manually delete the dataset directory.

> [!WARNING]
> When resuming, set `--dataset.num_episodes` to the number of additional episodes to record (not the targeted total number of episodes in the dataset).

### 3. Recording Parameters

Set the flow of data recording using command-line arguments:

| Parameter | Description | Default |
|---|---|---|
| `--dataset.episode_time_s` | Duration per data episode (seconds) | 60 |
| `--dataset.reset_time_s` | Environment reset time after each episode (seconds) | 60 |
| `--dataset.num_episodes` | Total episodes to record | 50 |

### 4. Keyboard Controls During Recording

Control the data recording flow using keyboard shortcuts:

| Key | Action |
|---|---|
| `→` (Right Arrow) | Early-stop current episode/reset; move to next. |
| `←` (Left Arrow) | Cancel current episode; re-record it. |
| `ESC` | Stop session immediately, encode videos, and upload dataset. |

If your keyboard presses are not responding, you may need to downgrade your pynput version, such as installing version 1.6.8.

```bash
pip install pynput==1.6.8
```

## To collect data via teleoperation:

After the data collection script is started, please follow the prompts in the terminal log to complete the data collection.

![Teleoperation Data Collection Prompt](../image/4860b30d-0b22-4333-a072-944f3b16a3a8.png)

![Teleoperation Workspace Setup](../image/ddcd5355-d585-47bd-bdfc-8ede165c110b.png)

## Organize the dataset.

The collected data will be saved in the local `~/.cache/huggingface/lerobot` directory.

![Dataset Metadata Info](../image/1280X1280.PNG)

Now, you have successfully collected a VLA dataset using LeRobot.
