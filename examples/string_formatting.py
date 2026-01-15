# 字符串格式化
name = "Alice"
age = 30

# 使用 % 操作符 (旧式)
print("Old style: %s is %d years old" % (name, age))

# 使用 .format() 方法
print("Format method: {} is {} years old".format(name, age))
print("Format indexed: {0} is {1} years old".format(name, age))
print("Format named: {name} is {age} years old".format(name=name, age=age))

# f-string (Python 3.6+)
print(f"F-string: {name} is {age} years old")
print(f"F-string expression: {name} is {age + 5} in 5 years")

# 数字格式化
pi = 3.14159
print(f"Pi: {pi:.2f}")
print(f"Pi: {pi:.4f}")

# 宽度和对齐
print(f"Left aligned: {name:<10} End")
print(f"Right aligned: {name:>10} End")
print(f"Center aligned: {name:^10} End")

# 数字格式
count = 42
print(f"Decimal: {count:d}")
print(f"Binary: {count:b}")
print(f"Hex: {count:x}")
print(f"Octal: {count:o}")

# 百分比
percentage = 0.75
print(f"Percentage: {percentage:.1%}")
