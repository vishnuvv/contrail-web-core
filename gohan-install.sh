#!/usr/bin/env bash

wget -O gohan_webui.zip https://github.com/Juniper/gohan_webui/archive/master.zip
rm -rf gohan_webui-master/
unzip gohan_webui.zip
cd gohan_webui-master/
cp app/config.json.sample app/config.json
npm install
npm run build
mkdir -p webroot/gohan
#Switch to contrail-web-core/ directory
cd ..
cp -rf gohan_webui-master/dist/* webroot/gohan/
rm -rf gohan_webui-master/

