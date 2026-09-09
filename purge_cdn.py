"""刷新腾讯云 CDN 缓存（站点更新后执行）。

用法:
  SECRET_ID=... SECRET_KEY=... python3 purge_cdn.py            # 刷新整站
  SECRET_ID=... SECRET_KEY=... python3 purge_cdn.py <path>...  # 只刷指定路径

环境变量:
  SECRET_ID / SECRET_KEY  腾讯云 API 密钥
  CDN_DOMAIN              加速域名（默认 yzzxref.diwu-pru.vip）
  FLUSH_TYPE              flush(刷新变更内容) 或 delete(删除全部缓存)，默认 flush
"""
import os
import sys
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.cdn.v20180606 import cdn_client, models

SECRET_ID = os.environ["SECRET_ID"]
SECRET_KEY = os.environ["SECRET_KEY"]
DOMAIN = os.environ.get("CDN_DOMAIN", "yzzxref.diwu-pru.vip")
FLUSH_TYPE = os.environ.get("FLUSH_TYPE", "flush")

args = sys.argv[1:]
if args:
    paths = [p if p.startswith("http") else f"https://{DOMAIN}{p}" for p in args]
else:
    paths = [f"https://{DOMAIN}/"]

cred = credential.Credential(SECRET_ID, SECRET_KEY)
hp = HttpProfile()
hp.endpoint = "cdn.tencentcloudapi.com"
cp = ClientProfile()
cp.httpProfile = hp
client = cdn_client.CdnClient(cred, "", cp)

req = models.PurgePathCacheRequest()
req.Paths = paths
req.FlushType = FLUSH_TYPE
resp = client.PurgePathCache(req)
print("purge submitted:", paths)
print("flushType:", FLUSH_TYPE)
print("taskId:", resp.TaskId)
print(resp.to_json_string())
