#!/usr/bin/env osascript

-- IMA 提取器 v8 测试 - 3篇文章
-- 策略: 固定位置点击 + 下箭头滚动

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96

on run
	log "v8 测试 - 3篇文章 (固定位置+下箭头)"
	log "============================================================"

	-- 清空旧结果
	do shell script "printf '' > /Users/berton/Github/OpenClaw/ima-v8-test.txt"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	set extractedCount to 0

	repeat with i from 1 to 3
		log ""
		log "#" & i & " - 点击 (" & ArticleTitleX & ", " & FirstArticleY & ")"

		-- 1. 确保前台
		tell application "ima.copilot"
			activate
		end tell
		delay 0.5

		-- 2. 点击文章（固定位置）
		tell application "System Events"
			tell process "ima.copilot"
				set frontmost to true
				delay 0.3
				click at {ArticleTitleX, FirstArticleY}
				delay 4.0
			end tell
		end tell

		-- 3. 点击地址栏+复制
		tell application "ima.copilot"
			activate
		end tell
		delay 0.3

		tell application "System Events"
			tell process "ima.copilot"
				set frontmost to true
				delay 0.3
				click at {AddressBarX, AddressBarY}
				delay 0.5
				keystroke "a" using command down
				delay 0.3
				keystroke "c" using command down
				delay 0.5
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
			set extractedCount to extractedCount + 1
			-- 提取URL中的sn参数用于去重判断
			set shortUrl to text 1 thru 60 of articleUrl
			log "   OK " & shortUrl & "..."
			do shell script "echo '" & i & "|" & shortUrl & "' >> /Users/berton/Github/OpenClaw/ima-v8-test.txt"
		else
			log "   FAIL " & text 1 thru 30 of (articleUrl & "                              ")
			do shell script "echo '" & i & "|FAIL' >> /Users/berton/Github/OpenClaw/ima-v8-test.txt"
		end if

		-- 5. 按Esc返回列表
		tell application "System Events"
			tell process "ima.copilot"
				key code 53 -- Esc
				delay 1.5
			end tell
		end tell

		-- 6. 用下箭头滚动到下一篇文章
		tell application "System Events"
			tell process "ima.copilot"
				key code 125 -- 下箭头
				delay 0.5
			end tell
		end tell

	end repeat

	log ""
	log "============================================================"
	log "提取完成: " & extractedCount & "/3"
	log "============================================================"

end run
