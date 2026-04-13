#!/usr/bin/env osascript

-- 干净的单篇测试 - 先清理状态再点击

property ArticleTitleX : 668
property FirstArticleY : 392
property AddressBarX : 755
property AddressBarY : 96

on run
	log "干净单篇测试"
	log "============================================================"

	-- 激活
	tell application "ima.copilot"
		activate
	end tell
	delay 2

	-- 先按3次Esc确保关闭所有面板
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 0.3
			key code 53 -- Esc
			delay 0.5
			key code 53 -- Esc
			delay 0.5
			key code 53 -- Esc
			delay 1.0
		end tell
	end tell
	log "已按3次Esc清理状态"

	-- 截图确认状态
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-clean-state.png"
	log "截图: ima-clean-state.png (清理后)"

	-- 清空剪贴板
	do shell script "pbcopy < /dev/null"

	-- 单击第一篇文章
	log ""
	log "单击第一篇文章 (" & ArticleTitleX & ", " & FirstArticleY & ")"
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 0.3
			click at {ArticleTitleX, FirstArticleY}
			delay 5.0
		end tell
	end tell

	-- 截图查看单击后效果
	do shell script "screencapture -x /Users/berton/Github/OpenClaw/ima-after-click.png"
	log "截图: ima-after-click.png (单击后)"

	-- 点击地址栏
	log "点击地址栏 (" & AddressBarX & ", " & AddressBarY & ")"
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

	-- 读取剪贴板
	set clipContent to ""
	try
		set clipContent to the clipboard as text
	on error
		set clipContent to "(empty)"
	end try

	log ""
	log "剪贴板内容长度: " & (count of characters of clipContent)
	if clipContent starts with "http" then
		log "OK: " & text 1 thru 80 of clipContent
	else
		log "FAIL: " & text 1 thru 40 of (clipContent & "                                        ")
	end if

end run
