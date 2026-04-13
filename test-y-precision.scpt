#!/usr/bin/env osascript

-- 精确定位文章Y坐标 - 用不同Y间距测试

property ArticleTitleX : 668
property AddressBarX : 755
property AddressBarY : 96
property CliclickPath : "/opt/homebrew/bin/cliclick"

on run
	log "精确定位文章Y坐标"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 3

	-- 清理状态: 多次Esc和Cmd+W
	tell application "System Events"
		tell process "ima.copilot"
			keystroke "w" using command down
			delay 0.5
			keystroke "w" using command down
			delay 0.5
			key code 53
			delay 0.5
			key code 53
			delay 1.0
		end tell
	end tell

	-- 测试不同的Y位置: 从375到600, 间隔25px
	set yPositions to {375, 400, 425, 450, 475, 500, 525, 550}

	repeat with yPos in yPositions
		log ""
		log "Y=" & yPos

		-- 点击
		do shell script CliclickPath & " c:" & ArticleTitleX & "," & yPos
		delay 4.0

		-- 清空剪贴板
		do shell script "pbcopy < /dev/null"

		-- 地址栏 + 复制
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

		-- 读取URL
		set articleUrl to ""
		try
			set articleUrl to the clipboard as text
		on error
			set articleUrl to ""
		end try

		-- 提取URL中的biz参数来标识不同文章
		set articleId to "FAIL"
		if articleUrl starts with "http" then
			-- 提取 __biz= 参数的前10个字符作为ID
			set AppleScript's text item delimiters to "__biz="
			set parts to text items of articleUrl
			if (count of parts) > 1 then
				set bizPart to text item 2 of articleUrl
				set AppleScript's text item delimiters to "&"
				set bizItems to text items of bizPart
				set articleId to text 1 thru 10 of (text item 1 of bizItems)
			end if
			set AppleScript's text item delimiters to ""
			log "   " & articleId & " | " & text 1 thru 40 of articleUrl
		else
			log "   FAIL (no URL)"
		end if

		-- Cmd+W 关闭标签页
		tell application "System Events"
			tell process "ima.copilot"
				keystroke "w" using command down
				delay 2.0
			end tell
		end tell

	end repeat

	log ""
	log "============================================================"

end run
