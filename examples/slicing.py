# 切片操作
text = "Python Programming"
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 基本切片
print("text[0:6]:", text[0:6])
print("text[7:]:", text[7:])
print("text[:6]:", text[:6])
print("text[:]:", text[:])

# 负索引切片
print("text[-11:]:", text[-11:])
print("text[:-12]:", text[:-12])

# 步长切片
print("numbers[::2]:", numbers[::2])
print("numbers[1::2]:", numbers[1::2])
print("numbers[::-1]:", numbers[::-1])
print("numbers[5:1:-1]:", numbers[5:1:-1])

# 列表切片赋值
list1 = [1, 2, 3, 4, 5]
list1[1:3] = [20, 30]
print("After slice assignment:", list1)

# 列表切片删除
list2 = [1, 2, 3, 4, 5]
del list2[1:3]
print("After slice deletion:", list2)
