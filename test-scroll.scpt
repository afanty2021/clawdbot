#!/usr/bin/env osascript

-- 测试 cliclick 滚轮滚动列表

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "测试 cliclick 滚轮滚动"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- Esc 确保回到列表
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 1.0
		end tell
	end tell

	-- 提取第一篇URL
	log "提取第一篇..."
	do shell script CliclickPath & " c:" & ArticleTitleX & "," & FirstArticleY
	delay 4.0
	do shell script "pbcopy < /dev/null"
	do shell script CliclickPath & " c:" & AddressBarX & "," & AddressBarY
	delay 0.5
	tell application "System Events"
		tell process "ima.copilot"
			keystroke "a" using command down
			delay 0.2
			keystroke "c" using command down
			delay 0.3
		end tell
	end tell
	set url1 to ""
	try
		set url1 to the clipboard as text
	on error
		set url1 to ""
	end try
	if url1 starts with "http" then
		log "   URL1: " & text 1 thru 50 of url1
	else
		log "   URL1: FAIL"
		return
	end if

	-- Esc返回
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 1.5
		end tell
	end tell

	-- 滚轮向下滚动3格（在列表区域）
	log "滚轮滚动..."
	-- cliclick scroll 语法: scroll:y:AMOUNT (正数=向下)
	-- 将鼠标移到列表区域然后滚动
	do shell script CliclickPath & " m:" & ArticleTitleX & "," & ((FirstArticleY + 900) div 2)
	delay 0.3
	do shell script CliclickPath & " scroll:y:3"
	delay 1.0

	-- 截图查看滚动后的列表状态
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-after-scroll.png"
	log "截图: ima-after-scroll.png"

	-- 点击同一位置看是否是第二篇
	log "点击同一位置..."
	do shell script CliclickPath & " c:" & ArticleTitleX & "," & FirstArticleY
	delay 4.0
	do shell script "pbcopy < /dev/null"
	do shell script CliclickPath & " c:" & AddressBarX & "," & AddressBarY
	delay 0.5
	tell application "System Events"
		tell process "ima.copilot"
			keystroke "a" using command down
			delay 0.2
			keystroke "c" using command down
			delay 0.3
		end tell
	end tell
	set url2 to ""
	try
		set url2 to the clipboard as text
	on error
		set url2 to ""
	end try
	if url2 starts with "http" then
		log "   URL2: " & text 1 thru 50 of url2
		if url2 is not equal to url1 then
			log "   SUCCESS - 不同的URL！滚动有效！"
		else
			log "   SAME - 滚动无效，还是同一篇"
		end if
	else
		log "   URL2: FAIL"
	end if

end run
