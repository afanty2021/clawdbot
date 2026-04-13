#!/usr/bin/env osascript

-- IMA 文章链接提取 - 纯 AppleScript 版本
-- 解决焦点问题：不通过 Node.js 运行，直接运行 AppleScript

on run
	tell application "ima.copilot"
		activate
	end tell

	delay 2

	-- 尝试点击文章列表区域
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 1

			-- 点击文章列表区域
			click at {600, 400}
			delay 2

			-- 尝试提取 URL
			click at {960, 100}
			delay 0.5
			keystroke "a" using command down
			delay 0.3
			keystroke "c" using command down
			delay 1
		end tell
	end tell

	-- 获取剪贴板内容
	set clipboardContent to the clipboard

	if clipboardContent starts with "http" then
		display dialog "成功提取 URL:" & return & return & clipboardContent buttons {"确定"} default button 1
	else
		display dialog "提取失败。剪贴板内容:" & return & return & (clipboardContent as string) buttons {"确定"} default button 1
	end if
end run
