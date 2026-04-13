#!/usr/bin/env osascript

-- 用 cliclick 测试真实鼠标点击

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96

on run
	log "cliclick 真实鼠标测试"
	log "============================================================"

	-- 激活 ima.copilot
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 先按Esc确保回到列表
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 0.3
			key code 53 -- Esc
			delay 0.5
			key code 53 -- Esc
			delay 1.0
		end tell
	end tell

	-- 用 cliclick 点击文章标题（真实鼠标事件）
	log "cliclick 点击文章 (" & ArticleTitleX & ", " & FirstArticleY & ")"
	do shell script "/opt/homebrew/bin/cliclick c:" & ArticleTitleX & "," & FirstArticleY
	delay 5.0

	-- 截图查看效果
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-cliclick-test.png"
	log "截图: ima-cliclick-test.png"

	-- 清空剪贴板
	do shell script "pbcopy < /dev/null"

	-- 点击地址栏
	log "点击地址栏"
	do shell script "/opt/homebrew/bin/cliclick c:" & AddressBarX & "," & AddressBarY
	delay 0.5

	-- Cmd+A, Cmd+C
	tell application "System Events"
		tell process "ima.copilot"
			keystroke "a" using command down
			delay 0.3
			keystroke "c" using command down
			delay 0.5
		end tell
	end tell

	-- 读取剪贴板
	set clipContent to ""
	try
		set clipContent to the clipboard as text
	on error
		set clipContent to "(empty)"
	end try

	log ""
	log "剪贴板长度: " & (count of characters of clipContent)
	if clipContent starts with "http" then
		log "OK: " & text 1 thru 80 of clipContent
	else
		log "FAIL: " & text 1 thru 40 of (clipContent & "                                        ")
	end if

end run
