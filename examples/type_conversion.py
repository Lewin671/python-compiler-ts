# 类型转换
x = "123"
y = 45.67
z = True

# 字符串到整数
print("int('123'):", int(x))
print("int(45.67):", int(y))

# 字符串到浮点数
print("float('123'):", float(x))
print("float(45):", float(45))

# 整数到字符串
print("str(123):", str(123))
print("str(45.67):", str(y))

# 布尔转换
print("bool(1):", bool(1))
print("bool(0):", bool(0))
print("bool(''):", bool(""))
print("bool('hello'):", bool("hello"))
print("bool([]):", bool([]))
print("bool([1, 2]):", bool([1, 2]))

# 列表/元组/集合之间的转换
list1 = [1, 2, 3, 4, 5]
tuple1 = tuple(list1)
set1 = set(list1)
print("List to tuple:", tuple1)
print("List to set:", set1)

list2 = list(set1)
print("Set to list:", list2)

# 类型检查
print("type(123):", type(123))
print("type('hello'):", type("hello"))
print("type(3.14):", type(3.14))
print("type([1, 2]):", type([1, 2]))
print("isinstance(123, int):", isinstance(123, int))
