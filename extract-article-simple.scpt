#!/usr/bin/env osascript

-- IMA 文章链接提取 - 简化版（无对话框）
-- 直接保存结果到文件

on run
	-- 激活 ima.copilot
	tell application "ima.copilot"
		activate
	end tell

	delay 2

	-- 点击文章列表区域并提取 URL
	tell application "System Events"
		tell process "ima.copilot"
			set frontmost to true
			delay 1

			-- 点击文章列表区域
			click at {600, 400}
			delay 2.5

			-- 点击地址栏
			click at {960, 100}
			delay 0.5

			-- 全选并复制
			keystroke "a" using command down
			delay 0.3
			keystroke "c" using command down
			delay 1
		end tell
	end tell

	-- 获取剪贴板内容
	set clipboardContent to the clipboard

	-- 保存结果到文件
	set resultFile to open for access POSIX file "/Users/berton/Github/OpenClaw/apple-extract-result.txt" with write permission
	set eof of resultFile to 0
	write clipboardContent to resultFile
	close access resultFile

	-- 返回结果（供日志查看）
	return clipboardContent
end run
