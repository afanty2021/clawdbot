#!/usr/bin/env osascript

-- 单篇测试 - 对比单击和双击效果

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96

on run
	log "单篇测试 - 单击 vs 双击"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 先按Esc确保回到列表
	tell application "System Events"
		tell process "ima.copilot"
			key code 53 -- Esc
			delay 1.0
		end tell
	end tell

	-- 测试1: 双击文章标题
	log ""
	log "测试1: 双击文章标题"
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 0.3
			-- 双击
			click at {ArticleTitleX, FirstArticleY}
			delay 0.1
			click at {ArticleTitleX, FirstArticleY}
			delay 5.0
		end tell
	end tell

	-- 尝试从地址栏复制
	tell application "System Events"
		tell process "ima.copilot"
			click at {AddressBarX, AddressBarY}
			delay 0.5
			keystroke "a" using command down
			delay 0.3
			keystroke "c" using command down
			delay 0.5
		end tell
	end tell

	set url1 to ""
	try
		set url1 to the clipboard as text
	on error
		set url1 to ""
	end try

	if url1 starts with "http" then
		log "   双击 OK: " & text 1 thru 60 of url1
	else
		log "   双击 FAIL: " & text 1 thru 30 of (url1 & "                              ")
	end if

	-- 按Esc返回
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 2.0
		end tell
	end tell

	-- 截图查看状态
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-test-state.png"
	log ""
	log "截图已保存: ima-test-state.png"

end run
