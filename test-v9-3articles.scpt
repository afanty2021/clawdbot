#!/usr/bin/env osascript

-- IMA v9 测试 - 3篇文章 (cliclick + 下箭头)

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "v9 测试 - 3篇文章 (cliclick真实鼠标)"
	log "============================================================"

	-- 清空旧结果
	do shell script "printf '' > /Users/berton/Github/OpenClaw/ima-v9-test.txt"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 确保回到列表
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 0.3
			key code 53 -- Esc
			delay 1.0
		end tell
	end tell

	set extractedCount to 0
	set lastUrl to ""

	repeat with i from 1 to 3
		log ""
		log "#" & i & " - cliclick点击 (" & ArticleTitleX & ", " & FirstArticleY & ")"

		-- 1. cliclick点击文章
		do shell script CliclickPath & " c:" & ArticleTitleX & "," & FirstArticleY
		delay 4.0

		-- 2. 清空剪贴板
		do shell script "pbcopy < /dev/null"

		-- 3. cliclick点击地址栏
		do shell script CliclickPath & " c:" & AddressBarX & "," & AddressBarY
		delay 0.5

		-- 4. Cmd+A, Cmd+C
		tell application "System Events"
			tell process "ima.copilot"
				keystroke "a" using command down
				delay 0.3
				keystroke "c" using command down
				delay 0.5
			end tell
		end tell

		-- 5. 获取URL
		set articleUrl to ""
		try
			set articleUrl to the clipboard as text
		on error
			set articleUrl to ""
		end try

		if articleUrl starts with "http" then
			if articleUrl is not equal to lastUrl then
				set extractedCount to extractedCount + 1
				set lastUrl to articleUrl
				log "   OK (新) " & text 1 thru 60 of articleUrl
				do shell script "echo '" & i & "|NEW|" & text 1 thru 60 of articleUrl & "' >> /Users/berton/Github/OpenClaw/ima-v9-test.txt"
			else
				log "   DUP " & text 1 thru 60 of articleUrl
				do shell script "echo '" & i & "|DUP|" & text 1 thru 60 of articleUrl & "' >> /Users/berton/Github/OpenClaw/ima-v9-test.txt"
			end if
		else
			log "   FAIL"
			do shell script "echo '" & i & "|FAIL' >> /Users/berton/Github/OpenClaw/ima-v9-test.txt"
		end if

		-- 6. Esc返回
		tell application "System Events"
			tell process "ima.copilot"
				key code 53 -- Esc
				delay 1.5
			end tell
		end tell

		-- 7. 下箭头滚动到下一篇
		tell application "System Events"
			tell process "ima.copilot"
				key code 125 -- 下箭头
				delay 0.5
			end tell
		end tell

	end repeat

	log ""
	log "============================================================"
	log "提取完成: " & extractedCount & "/3 (去重)"
	log "============================================================"

end run
