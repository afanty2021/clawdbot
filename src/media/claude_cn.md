# 媒体处理模块 (Media Pipeline)

[根目录](../../CLAUDE.md) > [src](../) > **media**

## 模块职责

媒体处理模块提供媒体文件托管、存储、下载、优化等功能。支持图片、视频、音频等多种媒体格式。

## 主要功能

### 媒体服务器 (server.ts)

```typescript
// 媒体服务器
interface MediaServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getHost(): string;
}

async function createMediaServer(params: {
  host?: string;
  port?: number;
}): Promise<MediaServer>;
```

### 媒体托管 (host.ts)

```typescript
// 媒体托管
interface MediaHost {
  uploadMedia(params: {
    path: string;
    contentType?: string;
  }): Promise<{
    url: string;
    id: string;
  }>;

  getMediaUrl(id: string): string;

  deleteMedia(id: string): Promise<void>;
}
```

### 媒体存储 (store.ts)

```typescript
// 媒体存储
async function saveMediaBuffer(params: {
  buffer: Buffer;
  filename?: string;
  contentType?: string;
}): Promise<{
  path: string;
  contentType: string;
}>;

async function saveMediaFile(params: {
  sourcePath: string;
  targetDir?: string;
}): Promise<{
  path: string;
  contentType: string;
}>;
```

### 媒体下载 (fetch.ts)

```typescript
// 媒体下载
async function fetchMedia(params: {
  url: string;
  maxSize?: number;
  timeout?: number;
}): Promise<{
  buffer: Buffer;
  contentType: string;
}>;

async function downloadMedia(params: {
  url: string;
  targetPath?: string;
}): Promise<string>;
```

### 媒体解析 (parse.ts)

```typescript
// 媒体解析
async function parseMediaParams(params: {
  text: string;
}): Promise<Array<{
  url: string;
  caption?: string;
}>>;
```

### 图片操作 (image-ops.ts)

```typescript
// 图片操作
async function resizeImage(params: {
  path: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}): Promise<Buffer>;

async function optimizeImage(params: {
  path: string;
  format?: "jpeg" | "png" | "webp";
  quality?: number;
}): Promise<string>;
```

### 音频处理 (audio.ts, audio-tags.ts)

```typescript
// 音频处理
async function getAudioDuration(params: {
  path: string;
}): Promise<number>;

async function extractAudioTags(params: {
  path: string;
}): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
}>;
```

### MIME 类型 (mime.ts)

```typescript
// MIME 类型检测
function detectMimeType(params: {
  path?: string;
  buffer?: Buffer;
  filename?: string;
}): string;

function isImageMimeType(mimeType: string): boolean;

function isVideoMimeType(mimeType: string): boolean;

function isAudioMimeType(mimeType: string): boolean;
```

### 常量 (constants.ts)

```typescript
// 媒体常量
const DEFAULT_MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 100MB
const DEFAULT_IMAGE_QUALITY = 85;
const DEFAULT_THUMBNAIL_SIZE = 300;
```

## 测试与质量

当前测试覆盖率约 85%。

## 常见问题 (FAQ)

### Q1: 媒体文件存储在哪里？

A: 默认存储在 `~/.clawdbot/media/` 目录。

### Q2: 如何限制媒体文件大小？

A: 通过 `mediaMaxMb` 配置或 `DEFAULT_MEDIA_MAX_BYTES` 常量。

### Q3: 支持哪些媒体格式？

A: 图片 (JPEG, PNG, GIF, WebP)、视频 (MP4, WebM)、音频 (MP3, WAV, OGG) 等。

### Q4: 如何优化图片？

A: 使用 `optimizeImage()` 函数，可指定格式和质量。

## 相关文件清单

- `src/media/server.ts`
- `src/media/host.ts`
- `src/media/store.ts`
- `src/media/fetch.ts`
- `src/media/parse.ts`
- `src/media/image-ops.ts`
- `src/media/audio.ts`
- `src/media/audio-tags.ts`
- `src/media/mime.ts`
- `src/media/constants.ts`
- `src/media/input-files.ts`

## 变更记录

### 2026-01-25

- 创建媒体处理模块文档
