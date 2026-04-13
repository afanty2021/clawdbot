#!/usr/bin/env osascript

-- IMA 提取3篇测试 - 验证完整流程

property AddressBarX : 755
property AddressBarY : 96
property ArticleTitleX : 668
property FirstArticleY : 392
property ArticleHeight : 50

on run
	log "🧪 测试提取3篇文章"
	log "============================================================"

	-- 清空旧结果
	do shell script "printf '' > /Users/berton/Github/OpenClaw/ima-test-results.txt"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	set extractedCount to 0
	set currentY to FirstArticleY

	repeat with i from 1 to 3
		log ""
		log "📄 #" & i & " (y:" & currentY & ")"

		-- 1. 确保前台
		tell application "ima.copilot"
			activate
		end tell
		delay 0.5

		-- 2. 点击文章
		tell application "System Events"
			tell process "ima.copilot"
				set frontmost to true
				delay 0.3
				click at {ArticleTitleX, currentY}
				delay 4.0
			end tell
		end tell

		-- 3. 点击地址栏+复制
		tell application "ima.copilot"
			activate
		end tell
		delay 0.5

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
			log "   ✅ " & text 1 thru 60 of articleUrl & "..."
			do shell script "echo '" & i & "|" & articleUrl & "' >> /Users/berton/Github/OpenClaw/ima-test-results.txt"
		else
			log "   ❌ " & text 1 thru 30 of (articleUrl & "                              ")
		end if

		-- 5. 返回列表
		tell application "System Events"
			tell process "ima.copilot"
				key code 53
				delay 1.5
			end tell
		end tell

		-- 6. 下一篇的Y坐标
		set currentY to currentY + ArticleHeight

	end repeat

	log ""
	log "============================================================"
	log "提取完成: " & extractedCount & "/3"
	log "============================================================"

end run
