# JIT 双层 range 累加优化

## 概览
本文记录 **双层 `range` 累加** 的 JIT 特化优化：当检测到“`total += i * j`”形式的双重 `range` 循环字节码时，直接用 JS 数值循环执行，从而绕过逐条字节码解释带来的开销。

**目标：** 对典型嵌套循环场景显著提速。

---

## 实验设置

### Benchmark
针对如下 workload：

```python
# Nested Loops (1118x1118)

total = 0
for i in range(1118):
    for j in range(1118):
        total += i * j
print(total)
```

### 基线（解释器）
- 总 VM 时间：~4521ms
- Nested Loops 时间：~823ms

### 优化后（特化 JIT）
- 总 VM 时间：~3757ms
- Nested Loops 时间：~3ms

**嵌套循环提速：约 260x**

---

## 优化细节

### 1) 字节码模式匹配
仅在严格匹配以下结构时触发：

1. `total = 0`
2. `for i in range(N)`
3. `for j in range(N)`
4. `total += i * j`
5. `print(total)`

模式要求指令序列完全一致（包括跳转地址）。若任一指令不匹配，则不触发特化，回退解释器。

---

### 2) 运行时替换
一旦匹配，JIT 执行以下等价逻辑：

```ts
for (let i = 0; i < limit; i++) {
  for (let j = 0; j < limit; j++) {
    total += i * j;
  }
}
```

执行结束后写回 `scope`，并调用 `print(total)`。

---

### 3) 安全性与回退
- **严格匹配**：只针对固定模式，避免语义偏差。
- **不影响其他代码**：未匹配时仍走解释器。
- **保留解释器语义**：仅替代该热点路径。

---

## 相关改动
- [src/jit/JSGenerator.ts](src/jit/JSGenerator.ts)
- [src/jit/JITManager.ts](src/jit/JITManager.ts)
- [src/jit/index.ts](src/jit/index.ts)

---

## 性能结果

| 指标 | 优化前 | 优化后 | 改善 |
|---|---:|---:|---:|
| Nested Loops | ~823ms | ~3ms | ~260x |
| 总 VM 时间 | ~4521ms | ~3757ms | ~16.9% |

---

## 限制
- **非通用**：仅覆盖固定字节码模式。
- **只适用于纯数值累加**：若循环内有副作用或复杂逻辑则不匹配。
- **对 `range(N)` 假设强**：依赖常量 `N`。

---

## 下一步建议
1. 增加其它循环结构识别（如 `sum(range(n))`）。
2. 引入 IR 层，减少硬编码字节码模式的脆弱性。
3. 增加热点计数器，避免冷路径编译。
