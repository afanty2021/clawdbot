#!/usr/bin/env osascript

-- 调试测试: 截取每个关键步骤的状态

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "调试测试 - 截取关键步骤"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- Esc确保干净状态
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 0.5
			key code 53
			delay 1.0
		end tell
	end tell

	-- 截图1: 列表初始状态
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-1-list.png"
	log "截图1: debug-1-list.png (列表初始状态)"

	-- 点击第一篇文章
	do shell script CliclickPath & " c:" & ArticleTitleX & "," & FirstArticleY
	delay 4.0

	-- 截图2: 文章打开后
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-2-article.png"
	log "截图2: debug-2-article.png (文章打开后)"

	-- 按Esc返回
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 2.0
		end tell
	end tell

	-- 截图3: Esc返回后
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-3-after-esc.png"
	log "截图3: debug-3-after-esc.png (Esc返回后)"

	-- 现在点击第二篇文章的位置 (Y=442)
	do shell script CliclickPath & " c:" & ArticleTitleX & ",442"
	delay 4.0

	-- 截图4: 点击Y=442后
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-4-y442.png"
	log "截图4: debug-4-y442.png (点击Y=442后)"

	-- 按Esc返回
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 2.0
		end tell
	end tell

	-- 尝试更大的Y间距: 点击 Y=500
	do shell script CliclickPath & " c:" & ArticleTitleX & ",500"
	delay 4.0

	-- 截图5: 点击Y=500后
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-5-y500.png"
	log "截图5: debug-5-y500.png (点击Y=500后)"

	log ""
	log "============================================================"
	log "调试完成！查看截图了解列表行为"
	log "============================================================"

end run
