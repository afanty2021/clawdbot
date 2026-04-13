#!/usr/bin/env osascript

-- 测试: Cmd+[ 后退 + 递增Y坐标

property ArticleTitleX : 668
property FirstArticleY : 392
property ArticleHeight : 50
property AddressBarX : 755
property AddressBarY : 96
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "测试 Cmd+[ 后退 + 递增Y"
	log "============================================================"

	do shell script "printf '' > /Users/berton/Github/OpenClaw/ima-backtest.txt"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 先按多次Esc确保回到列表
	tell application "System Events"
		tell process "ima.copilot"
			key code 53
			delay 0.3
			key code 53
			delay 1.0
		end tell
	end tell

	set currentY to FirstArticleY
	set lastUrl to ""

	repeat with i from 1 to 5
		log ""
		log "#" & i & " Y=" & currentY

		-- cliclick点击文章
		do shell script CliclickPath & " c:" & ArticleTitleX & "," & currentY
		delay 4.0

		-- 清空剪贴板
		do shell script "pbcopy < /dev/null"

		-- cliclick点击地址栏
		do shell script CliclickPath & " c:" & AddressBarX & "," & AddressBarY
		delay 0.5

		-- Cmd+A, Cmd+C
		tell application "System Events"
			tell process "ima.copilot"
				keystroke "a" using command down
				delay 0.2
				keystroke "c" using command down
				delay 0.3
			end tell
		end tell

		-- 获取URL
		set articleUrl to ""
		try
			set articleUrl to the clipboard as text
		on error
			set articleUrl to ""
		end try

		if articleUrl starts with "http" then
			if articleUrl is not equal to lastUrl then
				log "   NEW: " & text 1 thru 50 of articleUrl
				set lastUrl to articleUrl
				do shell script "echo '" & i & "|" & currentY & "|NEW|" & text 1 thru 60 of articleUrl & "' >> /Users/berton/Github/OpenClaw/ima-backtest.txt"
			else
				log "   DUP: same as previous"
				do shell script "echo '" & i & "|" & currentY & "|DUP' >> /Users/berton/Github/OpenClaw/ima-backtest.txt"
			end if
		else
			log "   FAIL: no URL"
			do shell script "echo '" & i & "|" & currentY & "|FAIL' >> /Users/berton/Github/OpenClaw/ima-backtest.txt"
		end if

		-- 用 Cmd+[ 后退（浏览器返回）
		tell application "System Events"
			tell process "ima.copilot"
				keystroke "[" using command down
				delay 2.0
			end tell
		end tell

		-- Y坐标递增
		set currentY to currentY + ArticleHeight

	end repeat

	-- 截图最终状态
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/debug-after-cmdb.png"
	log ""
	log "截图: debug-after-cmdb.png"
	log "============================================================"

end run
