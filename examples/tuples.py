# 元组操作
# 元组是不可变的序列
tuple1 = (1, 2, 3, 4, 5)
print("tuple1:", tuple1)
print("Length:", len(tuple1))

# 元组索引和切片
print("First element:", tuple1[0])
print("Last element:", tuple1[-1])
print("Slice [1:4]:", tuple1[1:4])

# 元组拆包
a, b, c = (10, 20, 30)
print(f"Unpacked: a={a}, b={b}, c={c}")

# 多个返回值（本质是元组）
def get_coordinates():
    return 10, 20, 30

x, y, z = get_coordinates()
print(f"Coordinates: x={x}, y={y}, z={z}")

# 元组方法
tuple2 = (1, 2, 3, 2, 1)
print("count(2):", tuple2.count(2))
print("index(3):", tuple2.index(3))

# 单元素元组
single = (42,)
print("Single element tuple:", single)
print("Type:", type(single))

# 元组连接
tuple3 = (1, 2) + (3, 4)
print("Concatenated:", tuple3)

# 元组重复
tuple4 = (1, 2) * 3
print("Repeated:", tuple4)

# 嵌套元组
nested = ((1, 2), (3, 4), (5, 6))
print("Nested:", nested)
print("nested[0]:", nested[0])
print("nested[1][1]:", nested[1][1])
