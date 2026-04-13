#!/usr/bin/env osascript

-- 逐步调试: 找到正确的返回列表方法

property ArticleTitleX : 668
property FirstArticleY : 392
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "调试返回列表的方法"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- Esc清理
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 0.3
			key code 53
			delay 1.0
		end tell
	end tell

	-- 点击第一篇文章
	log "点击第一篇文章..."
	do shell script CliclickPath & " c:" & ArticleTitleX & "," & FirstArticleY
	delay 4.0

	-- 截图: 文章已打开
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-1-open.png"
	log "step-1-open.png: 文章已打开"

	-- 尝试1: 浏览器后退键 (Cmd+[)
	log ""
	log "尝试1: Cmd+[ ..."
	tell application "System Events"
		tell process "ima.copilot"
			keystroke "[" using command down
		end tell
	end tell
	delay 2.0
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-2-cmdb.png"
	log "step-2-cmdb.png: Cmd+[后"

	-- 尝试2: 浏览器后退键 (Cmd+Left)
	log "尝试2: Cmd+Left..."
	tell application "System Events"
		tell process "ima.copilot"
			key code 123 using command down
		end tell
	end tell
	delay 2.0
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-3-cmdleft.png"
	log "step-3-cmdleft.png: Cmd+Left后"

	-- 尝试3: Backspace (Delete)
	log "尝试3: Delete键..."
	tell application "System Events"
		tell process "ima.copilot"
			key code 51 -- Delete/Backspace
		end tell
	end tell
	delay 2.0
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-4-delete.png"
	log "step-4-delete.png: Delete后"

	-- 尝试4: 点击浏览器后退按钮（左上角）
	-- Electron应用的后退按钮通常在窗口左上角
	log "尝试4: 点击浏览器后退按钮..."
	-- 先尝试点击 (40, 65) 附近的后退按钮
	do shell script CliclickPath & " c:40,65"
	delay 2.0
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-5-backbtn.png"
	log "step-5-backbtn.png: 点击(40,65)后"

	-- 尝试5: 点击左侧导航栏中的"AI"知识库
	log "尝试5: 点击左侧AI知识库..."
	-- 左侧导航栏大约在 X=200-300 区域
	do shell script CliclickPath & " c:200,500"
	delay 2.0
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/step-6-nav.png"
	log "step-6-nav.png: 点击左侧导航后"

	log ""
	log "============================================================"
	log "调试完成！查看 step-1 到 step-6 截图"

end run
