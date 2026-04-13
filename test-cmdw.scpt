#!/usr/bin/env osascript

-- 测试 Cmd+W 关闭标签页返回列表

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96
property ArticleHeight : 50
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "测试 Cmd+W 关闭标签页"
	log "============================================================"

	do shell script "printf '' > /Users/berton/Github/OpenClaw/ima-cmdw-test.txt"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 先关闭可能打开的标签页
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

		-- 1. cliclick点击文章
		do shell script CliclickPath & " c:" & ArticleTitleX & "," & currentY
		delay 4.0

		-- 2. 清空剪贴板
		do shell script "pbcopy < /dev/null"

		-- 3. cliclick点击地址栏 + 复制
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

		-- 4. 获取URL
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
				do shell script "echo '" & i & "|" & currentY & "|NEW|" & text 1 thru 60 of articleUrl & "' >> /Users/berton/Github/OpenClaw/ima-cmdw-test.txt"
			else
				log "   DUP"
				do shell script "echo '" & i & "|" & currentY & "|DUP' >> /Users/berton/Github/OpenClaw/ima-cmdw-test.txt"
			end if
		else
			log "   FAIL"
			do shell script "echo '" & i & "|" & currentY & "|FAIL' >> /Users/berton/Github/OpenClaw/ima-cmdw-test.txt"
		end if

		-- 5. Cmd+W 关闭标签页
		tell application "System Events"
			tell process "ima.copilot"
				keystroke "w" using command down
				delay 2.0
			end tell
		end tell

		-- 6. Y递增
		set currentY to currentY + ArticleHeight

	end repeat

	-- 截图
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-after-cmdw.png"
	log ""
	log "截图: ima-after-cmdw.png"
	log "============================================================"

end run
