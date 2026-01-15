# 数字类型和运算
# 整数
a = 10
b = 3

print("Integer operations:")
print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")
print(f"{a} * {b} = {a * b}")
print(f"{a} / {b} = {a / b}")
print(f"{a} // {b} = {a // b}")
print(f"{a} % {b} = {a % b}")
print(f"{a} ** {b} = {a ** b}")

# 浮点数
x = 3.14
y = 2.0

print("\nFloating point operations:")
print(f"{x} + {y} = {x + y}")
print(f"{x} * {y} = {x * y}")

# 复数
c = 3 + 4j
d = 1 + 2j

print("\nComplex numbers:")
print(f"c = {c}")
print(f"d = {d}")
print(f"c + d = {c + d}")
print(f"c * d = {c * d}")
print(f"Real part of c: {c.real}")
print(f"Imaginary part of c: {c.imag}")

# 数值转换
print("\nNumber conversions:")
print(f"abs(-5) = {abs(-5)}")
print(f"round(3.7) = {round(3.7)}")
print(f"round(3.14159, 2) = {round(3.14159, 2)}")
print(f"max(5, 10, 3) = {max(5, 10, 3)}")
print(f"min(5, 10, 3) = {min(5, 10, 3)}")
print(f"sum([1, 2, 3, 4]) = {sum([1, 2, 3, 4])}")

# 按位运算
print("\nBitwise operations:")
print(f"5 & 3 = {5 & 3}")
print(f"5 | 3 = {5 | 3}")
print(f"5 ^ 3 = {5 ^ 3}")
print(f"~5 = {~5}")
print(f"5 << 1 = {5 << 1}")
print(f"5 >> 1 = {5 >> 1}")
