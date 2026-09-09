#!/usr/bin/env bash
# 上传 YZZX-cover-ref-site 到腾讯云 COS（香港节点）
# 用法：填好下面 4 个变量后执行  bash upload-coscli.sh
set -e

SECRET_ID="你的SecretId"
SECRET_KEY="你的SecretKey"
BUCKET="diwu-pru-cover-125xxxxxxx"   # 步骤1创建的桶名（含 AppID 后缀）
LOCAL_DIR="."                         # 本仓库根目录

# 1. 下载 coscli（macOS）；Linux 把链接换成 coscli-linux
if [ ! -f coscli ]; then
  echo "下载 coscli ..."
  curl -o coscli -L https://cosbrowser.cloud.tencent.com/software/coscli/coscli-mac
fi
chmod +x coscli

# 2. 通过环境变量传入密钥
export COS_SECRETID="$SECRET_ID"
export COS_SECRETKEY="$SECRET_KEY"

# 3. 递归上传，保留目录结构并覆盖同名文件
echo "开始上传 $LOCAL_DIR -> cos://$BUCKET/ (ap-hongkong)"
./coscli cp -r "$LOCAL_DIR"/ cos://$BUCKET/ -e cos.ap-hongkong.myqcloud.com

echo "上传完成。去 CDN 控制台刷新缓存后访问 https://cover.diwu-pru.vip"
